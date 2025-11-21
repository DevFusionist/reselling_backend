import { Router } from "express";
import { createOrder } from "../controllers/orderController";
import { authMiddleware } from "../middlewares/auth";
const r = Router();
r.post("/", authMiddleware, createOrder);
export default r;
