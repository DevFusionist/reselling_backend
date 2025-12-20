import { reviewRepo } from "../repositories/review.repo";
import { CreateReviewInput, UpdateReviewInput, ReviewListInput } from "../dtos/review.dto";

export const reviewService = {
  async create(userId: number, input: CreateReviewInput) {
    // Check if user already reviewed this product
    const existingReview = await reviewRepo.checkUserReviewExists(userId, input.product_id);
    if (existingReview) {
      throw { status: 400, message: "You have already reviewed this product", code: "DUPLICATE_REVIEW" };
    }

    return await reviewRepo.create({
      ...input,
      user_id: userId,
    });
  },

  async getById(id: number) {
    const review = await reviewRepo.findById(id);
    if (!review) {
      throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
    }
    return review;
  },

  async update(id: number, userId: number, input: UpdateReviewInput) {
    const existing = await reviewRepo.findById(id);
    if (!existing) {
      throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
    }

    // Only allow user to update their own review (unless admin)
    if (existing.user_id !== userId) {
      throw { status: 403, message: "You can only update your own reviews", code: "FORBIDDEN" };
    }

    return await reviewRepo.update(id, input);
  },

  async delete(id: number, userId: number, isAdmin: boolean = false) {
    const existing = await reviewRepo.findById(id);
    if (!existing) {
      throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
    }

    // Only allow user to delete their own review (unless admin)
    if (!isAdmin && existing.user_id !== userId) {
      throw { status: 403, message: "You can only delete your own reviews", code: "FORBIDDEN" };
    }

    await reviewRepo.delete(id);
  },

  async list(input: ReviewListInput) {
    return await reviewRepo.list(input);
  },

  async getProductReviews(productId: number) {
    return await reviewRepo.findByProductId(productId);
  },

  async getProductRatingStats(productId: number) {
    return await reviewRepo.getProductRatingStats(productId);
  },

  async markHelpful(reviewId: number) {
    const existing = await reviewRepo.findById(reviewId);
    if (!existing) {
      throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
    }

    return await reviewRepo.markHelpful(reviewId);
  },

  async approveReview(reviewId: number) {
    const existing = await reviewRepo.findById(reviewId);
    if (!existing) {
      throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
    }

    return await reviewRepo.approveReview(reviewId);
  },
};

