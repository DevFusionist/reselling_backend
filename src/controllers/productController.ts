import "reflect-metadata";
import { Request, Response } from "express";
import { container } from "tsyringe";
import ProductService from "../services/ProductService";
import { RateLimit } from "../middlewares/routeRateLimit";

class ProductController {
  async createProduct(req:Request, res:Response) {
    try {
      const svc = container.resolve(ProductService);
      const p = await svc.create(req.body);
      res.json(p);
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }

  @RateLimit({ windowMs: 30000, max: 20 })
  async listProducts(req:Request, res:Response) {
    try {
      const svc = container.resolve(ProductService);
      const items = await svc.list(String(req.query.q||""), Number(req.query.limit||20));
      res.json(items);
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }

  async getProduct(req:Request, res:Response) {
    try {
      const svc = container.resolve(ProductService);
      const p = await svc.getById(req.params.id);
      res.json({ product: p, finalPrice: p?.basePrice });
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }
}

const controller = new ProductController();

// Export bound methods to maintain the same interface
export const createProduct = controller.createProduct.bind(controller);
export const listProducts = controller.listProducts.bind(controller);
export const getProduct = controller.getProduct.bind(controller);
