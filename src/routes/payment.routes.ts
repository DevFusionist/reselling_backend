import { Hono } from "hono";
import { paymentController } from "../controllers/payment.controller";
import { authRequired, resellerOnly } from "../middlewares/auth.middleware";

const router = new Hono();

// Public webhook endpoint (no auth, but signature verified)
router.post("/webhook", paymentController.verifyWebhook);

// Authenticated routes
router.post("/create-order", authRequired, paymentController.createPaymentOrder);
router.post("/payout/execute", authRequired, paymentController.executePayout);
router.get("/payouts", authRequired, resellerOnly, paymentController.getPayouts);

export default router;
