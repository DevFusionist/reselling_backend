import { Router } from "express";
import { createProduct, listProducts, getProduct } from "../controllers/productController";
import { authMiddleware, requireRole } from "../middlewares/auth";
const r = Router();
r.get("/", listProducts);
r.get("/:id", getProduct);
r.post("/", authMiddleware, requireRole("admin"), createProduct);
export default r;
