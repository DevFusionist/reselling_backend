import { db } from "../db";
import { product_images, products } from "../db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { CreateProductInput, UpdateProductInput, ProductListInput } from "../dtos/product.dto";

export const productRepo = {
  async create(input: CreateProductInput & { sku?: string }) {
    console.log("input", input);
    const insertData: any = {
      title: input.title,
      sku: input.sku || '', // SKU is required in schema, but will be generated in service
      base_price: input.base_price.toString(),
      stock: input.stock,
      description: input.description,
    };

    // Handle optional numeric fields - convert to string or null
    if (input.reseller_price !== undefined) {
      insertData.reseller_price = input.reseller_price !== null ? input.reseller_price.toString() : null;
    }
    if (input.retail_price !== undefined) {
      insertData.retail_price = input.retail_price !== null ? input.retail_price.toString() : null;
    }

    const [product] = await db.insert(products).values(insertData).returning();

    // Insert image_urls into the product_images table, but only if image_urls is defined and non-empty
    if (input.image_urls && input.image_urls.length > 0) {
      await db.insert(product_images).values(
        input.image_urls.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          display_order: index
        }))
      );
    }
    return product;
  },

  async findById(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    const images = await db.select().from(product_images).where(eq(product_images.product_id, id));
    return {
      ...product,
      images
    };
  },

  async update(id: number, input: UpdateProductInput) {
    const updateData: any = { ...input };
    
    // Remove image_urls from updateData as it's not a field on products table
    delete updateData.image_urls;
    
    if (input.base_price !== undefined) {
      updateData.base_price = input.base_price.toString();
    }
    
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    // Handle image_urls separately - append new images to existing ones
    if ((input as any).image_urls && (input as any).image_urls.length > 0) {
      // Get current max display_order to append new images
      const existingImages = await db
        .select()
        .from(product_images)
        .where(eq(product_images.product_id, id));
      
      const maxDisplayOrder = existingImages.length > 0
        ? Math.max(...existingImages.map(img => img.display_order || 0))
        : -1;

      await db.insert(product_images).values(
        (input as any).image_urls.map((url: string, index: number) => ({
          product_id: id,
          image_url: url,
          display_order: maxDisplayOrder + 1 + index
        }))
      );
    }
    
    return product;
  },

  async delete(id: number) {
    await db.delete(products).where(eq(products.id, id));
  },

  async list(input: ProductListInput) {
    const offset = (input.page - 1) * input.limit;
    let query = db.select().from(products);

    if (input.search) {
      query = db
        .select()
        .from(products)
        .where(
          sql`${products.title} ILIKE ${`%${input.search}%`} OR ${products.sku} ILIKE ${`%${input.search}%`}`
        ) as any;
    }

    const allProducts = await query.orderBy(desc(products.created_at)).limit(input.limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const allImages = await db.select().from(product_images).where(inArray(product_images.product_id, allProducts.map(p => p.id)));

    return {
      products: allProducts,
      images: allImages,
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit)
    };
  },

  async findAll() {
    return await db.select().from(products).orderBy(desc(products.created_at));
  },

  /**
   * Optimized bulk insert using batch processing
   * Inserts in chunks to avoid memory issues and improve performance
   */
  async createBulk(inputs: (CreateProductInput & { sku?: string; reseller_price?: number; retail_price?: number; image_urls?: string[] })[], batchSize: number = 500) {
    const results: any[] = [];
    
    // Process in batches to optimize memory and performance
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      
      // Prepare batch data - only include fields that exist in products table
      const batchData = batch.map(input => {
        const insertData: any = {
          title: input.title,
          sku: input.sku || '', // SKU is required in schema
          base_price: input.base_price.toString(),
          stock: input.stock,
          description: input.description,
        };

        // Handle optional numeric fields - convert to string or null
        if (input.reseller_price !== undefined) {
          insertData.reseller_price = input.reseller_price !== null ? input.reseller_price.toString() : null;
        }
        if (input.retail_price !== undefined) {
          insertData.retail_price = input.retail_price !== null ? input.retail_price.toString() : null;
        }

        return insertData;
      });

      // Insert batch
      const inserted = await db
        .insert(products)
        .values(batchData)
        .returning();

      // Handle image_urls separately for each product
      for (let j = 0; j < batch.length; j++) {
        const input = batch[j];
        const product = inserted[j];
        
        if (input.image_urls && input.image_urls.length > 0) {
          await db.insert(product_images).values(
            input.image_urls.map((url, index) => ({
              product_id: product.id,
              image_url: url,
              display_order: index
            }))
          );
        }
      }

      results.push(...inserted);
    }

    return results;
  },

  /**
   * Check if SKUs exist in database (optimized batch check)
   */
  async findExistingSKUs(skus: string[]): Promise<Set<string>> {
    if (skus.length === 0) return new Set();
    // Use IN clause for efficient batch lookup
    const existing = await db.select().from(products).where(inArray(products.sku, skus));

    return new Set(existing.map(p => p.sku));
  }
};

