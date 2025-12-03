import { db } from "../db";
import { share_links, products, product_images } from "../db/schema";
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
        product: true
      }
    });

    const productImages = await db.select().from(product_images).where(eq(product_images.product_id, link!.product!.id));

    if (!link) return null;

    // Check if expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return null;
    }

    // Calculate final price (base_price + margin_amount)
    const basePrice = Number(link.product.base_price);
    const marginAmount = Number(link.margin_amount);
    const finalPrice = (basePrice + marginAmount).toFixed(2);

    // Return only required fields
    return {
      id: link.id,
      code: link.code,
      expires_at: link.expires_at,
      product: {
        id: link.product.id,
        sku: link.product.sku,
        title: link.product.title,
        description: link.product.description,
        base_price: finalPrice,
        productImages
      }
    };
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

