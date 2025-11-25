import { productRepo } from "../repositories/product.repo";
import { CreateProductInput, UpdateProductInput, ProductListInput } from "../dtos/product.dto";

export const productService = {
  /**
   * Import products from CSV file using streaming
   * Backend reads and parses the file, then does bulk insert
   * Memory-efficient for large files
   */
  async importFromCSV(filePath: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const { processCSVInBatches } = await import("../utils/csvStreamParser");
    const { CreateProductDTO } = await import("../dtos/product.dto");

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; error: string }> = [];
    let rowNumber = 0;

    // Process file in batches using streams - backend reads the file
    await processCSVInBatches(
      filePath,
      async (rows, batchNumber) => {
        // Validate and prepare batch
        const validProducts: CreateProductInput[] = [];
        
        for (const row of rows) {
          rowNumber++;
          try {
            // Map CSV columns to product fields
            // Flexible column name mapping
            const productData = {
              sku: row.sku || row.SKU || row['Product SKU'] || row['product_sku'] || '',
              title: row.title || row.name || row['Product Name'] || row['product_name'] || row['Title'] || '',
              description: row.description || row.desc || row['Description'] || row['description'] || '',
              base_price: parseFloat(row.base_price || row.price || row['Base Price'] || row['base_price'] || row['Price'] || '0'),
              stock: parseInt(row.stock || row.quantity || row['Stock'] || row['stock'] || row['Quantity'] || '0', 10)
            };

            // Validate with Zod
            const parsed = CreateProductDTO.safeParse(productData);
            if (!parsed.success) {
              failedCount++;
              errors.push({
                row: rowNumber,
                error: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
              });
              continue;
            }

            validProducts.push(parsed.data);
          } catch (error: any) {
            failedCount++;
            errors.push({
              row: rowNumber,
              error: error.message || 'Unknown error'
            });
          }
        }

        // Batch insert valid products
        if (validProducts.length > 0) {
          try {
            // Check for existing SKUs in this batch
            const skus = validProducts.map(p => p.sku);
            const existingSKUs = await productRepo.findExistingSKUs(skus);
            
            // Filter out duplicates
            const newProducts = validProducts.filter(p => !existingSKUs.has(p.sku));
            const duplicateCount = validProducts.length - newProducts.length;

            if (newProducts.length > 0) {
              await productRepo.createBulk(newProducts);
              successCount += newProducts.length;
            }

            if (duplicateCount > 0) {
              failedCount += duplicateCount;
              errors.push({
                row: batchNumber,
                error: `${duplicateCount} products skipped due to duplicate SKUs`
              });
            }
          } catch (error: any) {
            failedCount += validProducts.length;
            errors.push({
              row: batchNumber,
              error: `Batch insert failed: ${error.message}`
            });
          }
        }
      },
      {
        batchSize: 500, // Process 500 rows at a time
        skipHeader: true
      }
    );

    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  },


  async create(input: CreateProductInput) {
    // Check if SKU already exists
    const existing = await productRepo.findAll();
    const skuExists = existing.some(p => p.sku === input.sku);
    if (skuExists) {
      throw { status: 400, message: "SKU already exists", code: "DUPLICATE_SKU" };
    }
    return await productRepo.create(input);
  },

  async getById(id: number) {
    const product = await productRepo.findById(id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }
    return product;
  },

  async update(id: number, input: UpdateProductInput) {
    const existing = await productRepo.findById(id);
    if (!existing) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    // Check SKU uniqueness if updating SKU
    if (input.sku && input.sku !== existing.sku) {
      const allProducts = await productRepo.findAll();
      const skuExists = allProducts.some(p => p.sku === input.sku && p.id !== id);
      if (skuExists) {
        throw { status: 400, message: "SKU already exists", code: "DUPLICATE_SKU" };
      }
    }

    return await productRepo.update(id, input);
  },

  async delete(id: number) {
    const product = await productRepo.findById(id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }
    await productRepo.delete(id);
  },

  async list(input: ProductListInput) {
    return await productRepo.list(input);
  }
};

