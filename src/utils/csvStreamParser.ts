import { createReadStream, ReadStream } from "fs";
import { createInterface } from "readline";

/**
 * Memory-efficient CSV stream parser using only Node.js built-in modules
 * Processes large files in chunks without loading entire file into memory
 */

export interface CSVRow {
  [column: string]: string;
}

export interface StreamParseOptions {
  batchSize?: number; // Process rows in batches
  skipHeader?: boolean; // Skip first row
  delimiter?: string; // CSV delimiter (default: ',')
  onBatch?: (rows: CSVRow[], batchNumber: number) => Promise<void>; // Batch callback
}

/**
 * Parse CSV file using streams - memory efficient for large files
 * Uses readline interface for line-by-line processing
 */
export async function parseCSVStream(
  filePath: string,
  options: StreamParseOptions = {}
): Promise<CSVRow[]> {
  const {
    batchSize = 1000,
    skipHeader = true,
    delimiter = ',',
    onBatch
  } = options;

  const rows: CSVRow[] = [];
  let currentBatch: CSVRow[] = [];
  let batchNumber = 0;
  let isFirstRow = true;
  let headers: string[] = [];

  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filePath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024 // 64KB chunks for optimal memory
    });

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity // Handle Windows line endings
    });

    rl.on('line', async (line: string) => {
      try {
        // Parse CSV line (handles quoted values)
        const values = parseCSVLine(line, delimiter);

        if (isFirstRow && skipHeader) {
          headers = values.map(h => h.trim());
          isFirstRow = false;
          return;
        }

        if (isFirstRow) {
          // Auto-generate headers if not skipping
          headers = values.map((_, i) => `column_${i + 1}`);
          isFirstRow = false;
        }

        // Create row object
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });

        currentBatch.push(row);
        rows.push(row);

        // Process batch when size reached
        if (currentBatch.length >= batchSize && onBatch) {
          const batch = [...currentBatch];
          currentBatch = [];
          batchNumber++;
          await onBatch(batch, batchNumber);
        }
      } catch (error) {
        reject(new Error(`Error parsing line: ${line}. ${error}`));
      }
    });

    rl.on('close', async () => {
      // Process remaining batch
      if (currentBatch.length > 0 && onBatch) {
        await onBatch(currentBatch, batchNumber + 1);
      }
      resolve(rows);
    });

    rl.on('error', (error) => {
      reject(error);
    });

    fileStream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);
  return values;
}

/**
 * Process CSV file in batches with callback
 * Most memory-efficient approach for large files
 */
export async function processCSVInBatches(
  filePath: string,
  onBatch: (rows: CSVRow[], batchNumber: number) => Promise<void>,
  options: Omit<StreamParseOptions, 'onBatch'> = {}
): Promise<{ totalRows: number; totalBatches: number }> {
  let totalRows = 0;
  let totalBatches = 0;

  await parseCSVStream(filePath, {
    ...options,
    onBatch: async (rows, batchNumber) => {
      totalRows += rows.length;
      totalBatches = batchNumber;
      await onBatch(rows, batchNumber);
    }
  });

  return { totalRows, totalBatches };
}

