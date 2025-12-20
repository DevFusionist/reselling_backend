import { Hono } from "hono";
import { reviewController } from "../controllers/review.controller";
import { authRequired, adminOnly } from "../middlewares/auth.middleware";

const router = new Hono();

// Public routes
router.get("/product/:productId", reviewController.getProductReviews);
router.get("/product/:productId/stats", reviewController.getProductRatingStats);
router.get("/", reviewController.list);
router.get("/:id", reviewController.getById);

// Authenticated routes
router.post("/", authRequired, reviewController.create);
router.put("/:id", authRequired, reviewController.update);
router.delete("/:id", authRequired, reviewController.delete);
router.post("/:id/helpful", reviewController.markHelpful);

// Admin only routes
router.post("/:id/approve", authRequired, adminOnly, reviewController.approveReview);

export default router;

