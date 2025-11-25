import { Hono } from "hono";
import { productController } from "../controllers/product.controller";
import { authRequired, adminOnly } from "../middlewares/auth.middleware";

const router = new Hono();

// Public routes
router.get("/", productController.list);
router.get("/:id", productController.getById);

// Admin only routes
router.post("/", authRequired, adminOnly, productController.create);
router.post("/bulk", authRequired, adminOnly, productController.createBulk);
router.put("/:id", authRequired, adminOnly, productController.update);
router.delete("/:id", authRequired, adminOnly, productController.delete);

export default router;

