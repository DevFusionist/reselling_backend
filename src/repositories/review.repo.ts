import { db } from "../db";
import { product_reviews, users } from "../db/schema";
import { eq, desc, asc, sql, and, gte, lte } from "drizzle-orm";
import { CreateReviewInput, UpdateReviewInput, ReviewListInput } from "../dtos/review.dto";

export const reviewRepo = {
  async create(input: CreateReviewInput & { user_id: number }) {
    const insertData: any = {
      product_id: input.product_id,
      user_id: input.user_id,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment || null,
      order_id: input.order_id || null,
      is_verified_purchase: input.order_id ? true : false, // Verified if linked to an order
    };

    const [review] = await db.insert(product_reviews).values(insertData).returning();
    return review;
  },

  async findById(id: number) {
    const [review] = await db
      .select({
        id: product_reviews.id,
        product_id: product_reviews.product_id,
        user_id: product_reviews.user_id,
        order_id: product_reviews.order_id,
        rating: product_reviews.rating,
        title: product_reviews.title,
        comment: product_reviews.comment,
        is_verified_purchase: product_reviews.is_verified_purchase,
        is_approved: product_reviews.is_approved,
        helpful_count: product_reviews.helpful_count,
        created_at: product_reviews.created_at,
        updated_at: product_reviews.updated_at,
        // User info
        user_email: users.email,
      })
      .from(product_reviews)
      .innerJoin(users, eq(product_reviews.user_id, users.id))
      .where(eq(product_reviews.id, id))
      .limit(1);

    return review || null;
  },

  async update(id: number, input: UpdateReviewInput) {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.title !== undefined) updateData.title = input.title || null;
    if (input.comment !== undefined) updateData.comment = input.comment || null;

    const [review] = await db
      .update(product_reviews)
      .set(updateData)
      .where(eq(product_reviews.id, id))
      .returning();

    return review;
  },

  async delete(id: number) {
    await db.delete(product_reviews).where(eq(product_reviews.id, id));
  },

  async list(input: ReviewListInput) {
    const offset = (input.page - 1) * input.limit;
    const conditions: any[] = [];

    if (input.product_id) {
      conditions.push(eq(product_reviews.product_id, input.product_id));
    }
    if (input.user_id) {
      conditions.push(eq(product_reviews.user_id, input.user_id));
    }
    if (input.rating) {
      conditions.push(eq(product_reviews.rating, input.rating));
    }
    if (input.is_approved !== undefined) {
      conditions.push(eq(product_reviews.is_approved, input.is_approved));
    }
    if (input.is_verified_purchase !== undefined) {
      conditions.push(eq(product_reviews.is_verified_purchase, input.is_verified_purchase));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const sortOrder = input.sort_order === "asc" ? asc : desc;

    // Determine sort field
    let orderByClause;
    switch (input.sort_by) {
      case "rating":
        orderByClause = sortOrder(product_reviews.rating);
        break;
      case "helpful_count":
        orderByClause = sortOrder(product_reviews.helpful_count);
        break;
      case "created_at":
      default:
        orderByClause = sortOrder(product_reviews.created_at);
        break;
    }

    const reviews = await db
      .select({
        id: product_reviews.id,
        product_id: product_reviews.product_id,
        user_id: product_reviews.user_id,
        order_id: product_reviews.order_id,
        rating: product_reviews.rating,
        title: product_reviews.title,
        comment: product_reviews.comment,
        is_verified_purchase: product_reviews.is_verified_purchase,
        is_approved: product_reviews.is_approved,
        helpful_count: product_reviews.helpful_count,
        created_at: product_reviews.created_at,
        updated_at: product_reviews.updated_at,
        user_email: users.email,
      })
      .from(product_reviews)
      .innerJoin(users, eq(product_reviews.user_id, users.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(input.limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(product_reviews)
      .where(whereClause);

    return {
      reviews,
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit),
    };
  },

  async findByProductId(productId: number) {
    return await db
      .select({
        id: product_reviews.id,
        product_id: product_reviews.product_id,
        user_id: product_reviews.user_id,
        order_id: product_reviews.order_id,
        rating: product_reviews.rating,
        title: product_reviews.title,
        comment: product_reviews.comment,
        is_verified_purchase: product_reviews.is_verified_purchase,
        is_approved: product_reviews.is_approved,
        helpful_count: product_reviews.helpful_count,
        created_at: product_reviews.created_at,
        updated_at: product_reviews.updated_at,
        user_email: users.email,
      })
      .from(product_reviews)
      .innerJoin(users, eq(product_reviews.user_id, users.id))
      .where(and(
        eq(product_reviews.product_id, productId),
        eq(product_reviews.is_approved, true) // Only show approved reviews
      ))
      .orderBy(desc(product_reviews.created_at));
  },

  async getProductRatingStats(productId: number) {
    const stats = await db
      .select({
        average_rating: sql<number>`COALESCE(AVG(${product_reviews.rating})::numeric, 0)`,
        total_reviews: sql<number>`COUNT(*)::int`,
        rating_1: sql<number>`COUNT(*) FILTER (WHERE ${product_reviews.rating} = 1)::int`,
        rating_2: sql<number>`COUNT(*) FILTER (WHERE ${product_reviews.rating} = 2)::int`,
        rating_3: sql<number>`COUNT(*) FILTER (WHERE ${product_reviews.rating} = 3)::int`,
        rating_4: sql<number>`COUNT(*) FILTER (WHERE ${product_reviews.rating} = 4)::int`,
        rating_5: sql<number>`COUNT(*) FILTER (WHERE ${product_reviews.rating} = 5)::int`,
      })
      .from(product_reviews)
      .where(and(
        eq(product_reviews.product_id, productId),
        eq(product_reviews.is_approved, true)
      ));

    return stats[0] || {
      average_rating: 0,
      total_reviews: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    };
  },

  async markHelpful(reviewId: number) {
    const [review] = await db
      .update(product_reviews)
      .set({
        helpful_count: sql`${product_reviews.helpful_count} + 1`,
      })
      .where(eq(product_reviews.id, reviewId))
      .returning();

    return review;
  },

  async approveReview(reviewId: number) {
    const [review] = await db
      .update(product_reviews)
      .set({ is_approved: true })
      .where(eq(product_reviews.id, reviewId))
      .returning();

    return review;
  },

  async checkUserReviewExists(userId: number, productId: number) {
    const [review] = await db
      .select()
      .from(product_reviews)
      .where(
        and(
          eq(product_reviews.user_id, userId),
          eq(product_reviews.product_id, productId)
        )
      )
      .limit(1);

    return review || null;
  },
};

