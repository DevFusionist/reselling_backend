import { productRepo } from "../repositories/product.repo";
import { CreateProductInput, UpdateProductInput, ProductListInput } from "../dtos/product.dto";

/**
 * Generate a unique SKU based on product title
 * Format: First 3 letters of title (uppercase) + timestamp + random string
 * Example: "LAP-1734567890-A3B2"
 */
async function generateUniqueSKU(title: string): Promise<string> {
  // Extract first 3 letters from title, remove special chars, uppercase
  const titlePrefix = title
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); // Pad with X if less than 3 chars

  const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 char random string

  let sku = `${titlePrefix}-${timestamp}-${randomStr}`;
  
  // Ensure uniqueness by checking against existing SKUs
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existingSKUs = await productRepo.findExistingSKUs([sku]);
    if (!existingSKUs.has(sku)) {
      return sku;
    }
    // If SKU exists, generate a new one with different random string
    const newRandomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    sku = `${titlePrefix}-${timestamp}-${newRandomStr}`;
    attempts++;
  }
  
  // Fallback: use UUID-like format if all attempts fail
  return `${titlePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

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
            const title = row.title || row.name || row['Product Name'] || row['product_name'] || row['Title'] || '';
            const sku = row.sku || row.SKU || row['Product SKU'] || row['product_sku'] || '';
            
            const productData: any = {
              title,
              description: row.description || row.desc || row['Description'] || row['description'] || '',
              base_price: parseFloat(row.base_price || row.price || row['Base Price'] || row['base_price'] || row['Price'] || '0'),
              stock: parseInt(row.stock || row.quantity || row['Stock'] || row['stock'] || row['Quantity'] || '0', 10)
            };

            // Map optional fields with flexible column name matching
            if (row.reseller_price || row['Reseller Price'] || row['reseller_price']) {
              productData.reseller_price = parseFloat(row.reseller_price || row['Reseller Price'] || row['reseller_price'] || '0');
            }
            if (row.retail_price || row['Retail Price'] || row['retail_price']) {
              productData.retail_price = parseFloat(row.retail_price || row['Retail Price'] || row['retail_price'] || '0');
            }
            if (row.category || row['Category'] || row['category']) {
              productData.category = row.category || row['Category'] || row['category'] || '';
            }
            if (row.sub_category || row['Sub Category'] || row['sub_category'] || row['Sub-Category']) {
              productData.sub_category = row.sub_category || row['Sub Category'] || row['sub_category'] || row['Sub-Category'] || '';
            }
            if (row.brand || row['Brand'] || row['brand']) {
              productData.brand = row.brand || row['Brand'] || row['brand'] || '';
            }
            if (row.model || row['Model'] || row['model']) {
              productData.model = row.model || row['Model'] || row['model'] || '';
            }
            if (row.color || row['Color'] || row['colour'] || row['Colour']) {
              productData.color = row.color || row['Color'] || row['colour'] || row['Colour'] || '';
            }
            if (row.size || row['Size'] || row['size']) {
              productData.size = row.size || row['Size'] || row['size'] || '';
            }
            if (row.material || row['Material'] || row['material']) {
              productData.material = row.material || row['Material'] || row['material'] || '';
            }
            if (row.style || row['Style'] || row['style']) {
              productData.style = row.style || row['Style'] || row['style'] || '';
            }
            if (row.fit || row['Fit'] || row['fit']) {
              productData.fit = row.fit || row['Fit'] || row['fit'] || '';
            }
            if (row.pattern || row['Pattern'] || row['pattern']) {
              productData.pattern = row.pattern || row['Pattern'] || row['pattern'] || '';
            }
            const isFeaturedValue = row.is_featured || row['Is Featured'] || row['is_featured'] || row['IsFeatured'];
            if (isFeaturedValue !== undefined && isFeaturedValue !== null && isFeaturedValue !== '') {
              const value = String(isFeaturedValue).toLowerCase();
              productData.is_featured = value === 'true' || value === '1' || value === 'yes';
            }

            // Validate with Zod (SKU is not part of DTO, will be generated if missing)
            const parsed = CreateProductDTO.safeParse(productData);
            if (!parsed.success) {
              failedCount++;
              errors.push({
                row: rowNumber,
                error: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
              });
              continue;
            }

            // Add SKU to product data (will be generated later if empty)
            validProducts.push({
              ...parsed.data,
              sku: sku.trim() || null // null means will be generated
            } as any);
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
            // Generate SKUs for products that don't have one
            const productsWithSKUs = await Promise.all(
              validProducts.map(async (p: any) => {
                if (!p.sku || p.sku.trim() === '') {
                  return {
                    ...p,
                    sku: await generateUniqueSKU(p.title)
                  };
                }
                return p;
              })
            );

            // Check for existing SKUs in this batch
            const skus = productsWithSKUs.map((p: any) => p.sku);
            const existingSKUs = await productRepo.findExistingSKUs(skus);
            
            // Filter out duplicates
            const newProducts = productsWithSKUs.filter((p: any) => !existingSKUs.has(p.sku));
            const duplicateCount = productsWithSKUs.length - newProducts.length;

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
    // Generate SKU if not provided
    let sku = (input as any).sku;
    if (!sku || sku.trim() === '') {
      sku = await generateUniqueSKU(input.title);
    } else {
      // Check if provided SKU already exists
      const existingSKUs = await productRepo.findExistingSKUs([sku]);
      if (existingSKUs.has(sku)) {
        throw { status: 400, message: "SKU already exists", code: "DUPLICATE_SKU" };
      }
    }

    // Create product with generated or provided SKU
    return await productRepo.create({
      ...input,
      sku
    } as CreateProductInput & { sku: string });
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

    // SKU updates are not allowed through the update endpoint
    // SKUs are auto-generated and should remain stable
    // If SKU needs to be changed, it should be done through a separate admin endpoint

    return await productRepo.update(id, input);
  },

  async delete(id: number) {
    const product = await productRepo.findById(id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }
    await productRepo.delete(id);
  },

  async deleteBulk(ids: number[]) {
    if (ids.length === 0) {
      throw { status: 400, message: "At least one product ID is required", code: "VALIDATION_ERROR" };
    }
    
    // Validate that all IDs are valid numbers
    const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
    if (validIds.length !== ids.length) {
      throw { status: 400, message: "Invalid product IDs provided", code: "VALIDATION_ERROR" };
    }
    
    return await productRepo.deleteBulk(validIds);
  },

  async list(input: ProductListInput) {
    return await productRepo.list(input);
  }
};

