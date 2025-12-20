import { Context } from "hono";
import { reviewService } from "../services/review.service";
import { CreateReviewDTO, UpdateReviewDTO, ReviewListDTO } from "../dtos/review.dto";
import { success, failure } from "../utils/apiResponse";

export const reviewController = {
  async create(c: Context) {
    try {
      const userId = (c as any).user?.id;
      if (!userId) {
        return c.json(failure("Unauthorized", "UNAUTHORIZED"), 401);
      }

      const body = await c.req.json();
      const parsed = CreateReviewDTO.safeParse(body);
      if (!parsed.success) {
        return c.json(
          failure(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), "VALIDATION_ERROR"),
          400
        );
      }

      const review = await reviewService.create(userId, parsed.data);
      return c.json(success(review, "Review created successfully"), 201);
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to create review", error.code || "SERVER_ERROR"), status);
    }
  },

  async getById(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid review ID", "VALIDATION_ERROR"), 400);
      }

      const review = await reviewService.getById(id);
      return c.json(success(review, "Review fetched successfully"));
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to fetch review", error.code || "SERVER_ERROR"), status);
    }
  },

  async update(c: Context) {
    try {
      const userId = (c as any).user?.id;
      if (!userId) {
        return c.json(failure("Unauthorized", "UNAUTHORIZED"), 401);
      }

      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid review ID", "VALIDATION_ERROR"), 400);
      }

      const body = await c.req.json();
      const parsed = UpdateReviewDTO.safeParse(body);
      if (!parsed.success) {
        return c.json(
          failure(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), "VALIDATION_ERROR"),
          400
        );
      }

      const review = await reviewService.update(id, userId, parsed.data);
      return c.json(success(review, "Review updated successfully"));
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to update review", error.code || "SERVER_ERROR"), status);
    }
  },

  async delete(c: Context) {
    try {
      const userId = (c as any).user?.id;
      if (!userId) {
        return c.json(failure("Unauthorized", "UNAUTHORIZED"), 401);
      }

      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid review ID", "VALIDATION_ERROR"), 400);
      }

      const isAdmin = (c as any).user?.role === "admin";
      await reviewService.delete(id, userId, isAdmin);
      return c.json(success(null, "Review deleted successfully"));
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to delete review", error.code || "SERVER_ERROR"), status);
    }
  },

  async list(c: Context) {
    try {
      const query = c.req.query();
      const parsed = ReviewListDTO.safeParse(query);
      if (!parsed.success) {
        return c.json(
          failure(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), "VALIDATION_ERROR"),
          400
        );
      }

      const result = await reviewService.list(parsed.data);
      return c.json(success(result, "Reviews fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch reviews", "SERVER_ERROR"), 500);
    }
  },

  async getProductReviews(c: Context) {
    try {
      const productId = Number(c.req.param("productId"));
      if (!productId || isNaN(productId)) {
        return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
      }

      const reviews = await reviewService.getProductReviews(productId);
      return c.json(success(reviews, "Product reviews fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch product reviews", "SERVER_ERROR"), 500);
    }
  },

  async getProductRatingStats(c: Context) {
    try {
      const productId = Number(c.req.param("productId"));
      if (!productId || isNaN(productId)) {
        return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
      }

      const stats = await reviewService.getProductRatingStats(productId);
      return c.json(success(stats, "Product rating stats fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch rating stats", "SERVER_ERROR"), 500);
    }
  },

  async markHelpful(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid review ID", "VALIDATION_ERROR"), 400);
      }

      const review = await reviewService.markHelpful(id);
      return c.json(success(review, "Review marked as helpful"));
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to mark review as helpful", error.code || "SERVER_ERROR"), status);
    }
  },

  async approveReview(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid review ID", "VALIDATION_ERROR"), 400);
      }

      const review = await reviewService.approveReview(id);
      return c.json(success(review, "Review approved successfully"));
    } catch (error: any) {
      const status = error.status || 500;
      return c.json(failure(error.message || "Failed to approve review", error.code || "SERVER_ERROR"), status);
    }
  },
};

