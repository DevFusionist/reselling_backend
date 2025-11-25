import { db } from "../db";
import { reseller_markups, products } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { SetMarkupInput, MarkupListInput } from "../dtos/markup.dto";

export const markupRepo = {
  async createOrUpdate(resellerId: number, input: SetMarkupInput) {
    const uniqueKey = `${resellerId}:${input.product_id}`;
    
    // Check if exists
    const existing = await db
      .select()
      .from(reseller_markups)
      .where(
        and(
          eq(reseller_markups.reseller_id, resellerId),
          eq(reseller_markups.product_id, input.product_id)
        )
      );

    if (existing.length > 0) {
      // Update
      const [updated] = await db
        .update(reseller_markups)
        .set({ markup_amount: input.markup_amount.toString() })
        .where(eq(reseller_markups.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create
      const [created] = await db
        .insert(reseller_markups)
        .values({
          reseller_id: resellerId,
          product_id: input.product_id,
          markup_amount: input.markup_amount.toString(),
          unique_key: uniqueKey
        })
        .returning();
      return created;
    }
  },

  async findByResellerAndProduct(resellerId: number, productId: number) {
    // Using Drizzle relations for type-safe query with nested data
    const markup = await db.query.reseller_markups.findFirst({
      where: and(
        eq(reseller_markups.reseller_id, resellerId),
        eq(reseller_markups.product_id, productId)
      ),
      with: {
        reseller: true,
        product: true
      }
    });
    return markup || null;
  },

  async listByReseller(resellerId: number, input: MarkupListInput) {
    const offset = (input.page - 1) * input.limit;
    
    const markups = await db
      .select({
        markup: reseller_markups,
        product: products
      })
      .from(reseller_markups)
      .innerJoin(products, eq(reseller_markups.product_id, products.id))
      .where(eq(reseller_markups.reseller_id, resellerId))
      .orderBy(desc(reseller_markups.created_at))
      .limit(input.limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reseller_markups)
      .where(eq(reseller_markups.reseller_id, resellerId));

    return {
      markups: markups.map(m => ({
        ...m.markup,
        product: m.product
      })),
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit)
    };
  },

  async delete(resellerId: number, productId: number) {
    await db
      .delete(reseller_markups)
      .where(
        and(
          eq(reseller_markups.reseller_id, resellerId),
          eq(reseller_markups.product_id, productId)
        )
      );
  }
};

