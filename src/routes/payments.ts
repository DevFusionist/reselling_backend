import { Router } from "express";
import { createPaymentOrder, razorpayWebhook } from "../controllers/paymentController";
import { authMiddleware } from "../middlewares/auth";
import { rawBodyMiddleware } from "../middlewares/rawBody";
const r = Router();
r.post("/create-order", authMiddleware, createPaymentOrder);
r.post("/webhook", rawBodyMiddleware, razorpayWebhook);
export default r;
