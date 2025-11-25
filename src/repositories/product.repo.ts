import { db } from "../db";
import { products } from "../db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { CreateProductInput, UpdateProductInput, ProductListInput } from "../dtos/product.dto";

export const productRepo = {
  async create(input: CreateProductInput) {
    const [product] = await db.insert(products).values({
      ...input,
      base_price: input.base_price.toString()
    }).returning();
    return product;
  },

  async findById(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  },

  async update(id: number, input: UpdateProductInput) {
    const updateData: any = { ...input };
    if (input.base_price !== undefined) {
      updateData.base_price = input.base_price.toString();
    }
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
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

    return {
      products: allProducts,
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
  async createBulk(inputs: CreateProductInput[], batchSize: number = 500) {
    const results: any[] = [];
    
    // Process in batches to optimize memory and performance
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      
      // Prepare batch data
      const batchData = batch.map(input => ({
        ...input,
        base_price: input.base_price.toString()
      }));

      // Insert batch
      const inserted = await db
        .insert(products)
        .values(batchData)
        .returning();

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
    const existing = await db
      .select({ sku: products.sku })
      .from(products)
      .where(inArray(products.sku, skus));

    return new Set(existing.map(p => p.sku));
  }
};

