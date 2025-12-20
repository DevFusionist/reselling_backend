import { z } from "zod";

export const CreateReviewDTO = z.object({
  product_id: z.number().int().positive(),
  order_id: z.number().int().positive().optional(), // Optional: link to order if review is from purchase
  rating: z.number().int().min(1).max(5), // 1-5 stars
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
});

export const UpdateReviewDTO = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
});

export const ReviewListDTO = z.object({
  product_id: z.coerce.number().int().positive().optional(),
  user_id: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  is_approved: z.coerce.boolean().optional(),
  is_verified_purchase: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(["created_at", "rating", "helpful_count"]).optional().default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateReviewInput = z.infer<typeof CreateReviewDTO>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewDTO>;
export type ReviewListInput = z.infer<typeof ReviewListDTO>;

