import { db } from "../db";
import { share_links, products } from "../db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { CreateShareLinkInput } from "../dtos/shareLink.dto";
import { v4 as uuidv4 } from "uuid";

export const shareLinkRepo = {
  async create(creatorId: number, input: CreateShareLinkInput) {
    // Generate unique code
    const code = uuidv4().replace(/-/g, "").substring(0, 16);
    
    // Calculate expiry if provided
    const expiresAt = input.expires_in_days
      ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    const [link] = await db
      .insert(share_links)
      .values({
        creator_id: creatorId,
        product_id: input.product_id,
        margin_amount: input.margin_amount.toString(),
        code,
        expires_at: expiresAt
      })
      .returning();

    return link;
  },

  async findByCode(code: string) {
    // Using Drizzle relations for type-safe nested query
    const link = await db.query.share_links.findFirst({
      where: eq(share_links.code, code),
      with: {
        product: true,
        creator: true
      }
    });

    if (!link) return null;

    // Check if expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return null;
    }

    return link;
  },

  async findByCreator(creatorId: number) {
    const links = await db
      .select({
        link: share_links,
        product: products
      })
      .from(share_links)
      .innerJoin(products, eq(share_links.product_id, products.id))
      .where(
        and(
          eq(share_links.creator_id, creatorId),
          sql`(${share_links.expires_at} IS NULL OR ${share_links.expires_at} > NOW())`
        )
      )
      .orderBy(desc(share_links.created_at));

    return links.map(l => ({
      ...l.link,
      product: l.product
    }));
  },

  async delete(code: string, creatorId: number) {
    await db
      .delete(share_links)
      .where(
        and(
          eq(share_links.code, code),
          eq(share_links.creator_id, creatorId)
        )
      );
  }
};

