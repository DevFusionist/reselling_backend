import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { container } from "tsyringe";
import UserRepository from "../repositories/UserRepository";
export const authMiddleware = async (req:Request,res:Response,next:NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });
  const token = auth.split(" ")[1];
  try {
    const decoded:any = jwt.verify(token, process.env.JWT_SECRET||"");
    const repo = container.resolve(UserRepository);
    const user = await repo.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    (req as any).user = user;
    next();
  } catch (err) { return res.status(401).json({ message: "Invalid token" }); }
};
export const requireRole = (role:"admin"|"reseller"|"customer") => (req:Request,res:Response,next:NextFunction)=> {
  const u = (req as any).user;
  if (!u) return res.status(401).json({ message: "Unauthorized" });
  if (u.role !== role) return res.status(403).json({ message: "Forbidden" });
  next();
};
