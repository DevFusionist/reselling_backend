import "reflect-metadata";
import { Request, Response } from "express";
import { container } from "tsyringe";
import OrderService from "../services/OrderService";

class OrderController {
  async createOrder(req:Request, res:Response) {
    try {
      const svc = container.resolve(OrderService);
      const customerId = (req as any).user._id;
      const { productId, quantity, resellerId, margin } = req.body;
      const order = await svc.createInternalOrder(String(customerId), String(productId), Number(quantity||1), resellerId, Number(margin||0));
      res.json({ order });
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }
}

const controller = new OrderController();

// Export bound methods to maintain the same interface
export const createOrder = controller.createOrder.bind(controller);
