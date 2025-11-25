import { Hono } from "hono";
import { orderController } from "../controllers/order.controller";
import { authRequired, adminOnly } from "../middlewares/auth.middleware";

const router = new Hono();

router.use("*", authRequired);

router.post("/", orderController.create);
router.get("/", orderController.list);
router.get("/:id", orderController.getById);
router.patch("/:id/status", authRequired, adminOnly, orderController.updateStatus);

export default router;

