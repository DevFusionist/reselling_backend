import { Router } from "express";
import { generateLink, getLinks, getWallet } from "../controllers/resellerController";
import { authMiddleware, requireRole } from "../middlewares/auth";
const r = Router();
r.post("/generate-link", authMiddleware, requireRole("reseller"), generateLink);
r.get("/links", authMiddleware, requireRole("reseller"), getLinks);
r.get("/wallet", authMiddleware, requireRole("reseller"), getWallet);
export default r;
