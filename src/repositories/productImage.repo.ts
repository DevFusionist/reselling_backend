import { db } from "../db";
import { product_images } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const productImageRepo = {
  /**
   * Create multiple product images
   */
  async createMany(productId: number, imageUrls: string[]) {
    if (imageUrls.length === 0) return [];

    const imagesToInsert = imageUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      display_order: index,
    }));

    const inserted = await db
      .insert(product_images)
      .values(imagesToInsert)
      .returning();

    return inserted;
  },

  /**
   * Get all images for a product, ordered by display_order
   */
  async findByProductId(productId: number) {
    return await db
      .select()
      .from(product_images)
      .where(eq(product_images.product_id, productId))
      .orderBy(asc(product_images.display_order));
  },

  /**
   * Get all images for multiple products
   */
  async findByProductIds(productIds: number[]) {
    if (productIds.length === 0) return [];

    const { inArray } = await import("drizzle-orm");
    return await db
      .select()
      .from(product_images)
      .where(inArray(product_images.product_id, productIds))
      .orderBy(asc(product_images.display_order));
  },

  /**
   * Delete all images for a product
   */
  async deleteByProductId(productId: number) {
    await db.delete(product_images).where(eq(product_images.product_id, productId));
  },

  /**
   * Delete specific image by ID
   */
  async deleteById(imageId: number) {
    await db.delete(product_images).where(eq(product_images.id, imageId));
  },

  /**
   * Update display order of images
   */
  async updateDisplayOrder(imageId: number, displayOrder: number) {
    const [updated] = await db
      .update(product_images)
      .set({ display_order: displayOrder })
      .where(eq(product_images.id, imageId))
      .returning();
    return updated;
  },
};

