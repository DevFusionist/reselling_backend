import "reflect-metadata";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { container } from "tsyringe";
import OrderService from "../services/OrderService";
import crypto from "crypto";

class PaymentController {
  private rp: Razorpay;

  constructor() {
    this.rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || "", key_secret: process.env.RAZORPAY_KEY_SECRET || "" });
  }

  async createPaymentOrder(req:Request, res:Response) {
    try {
      const orderSvc = container.resolve(OrderService);
      const customerId = (req as any).user?._id || null;
      const { productId, quantity=1, resellerId, margin=0 } = req.body;
      const internal = await orderSvc.createInternalOrder(String(customerId), String(productId), Number(quantity||1), resellerId, Number(margin||0));
      const amount = Math.round(Number(internal.totalAmount) * 100);
      const rOrder = await this.rp.orders.create({ amount, currency: "INR", receipt: String(internal._id) });
      res.json({ razorpayOrder: rOrder, internalOrderId: internal._id });
    } catch (err:any) { res.status(500).json({ message: err.message }); }
  }

  async razorpayWebhook(req:Request, res:Response) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
      const signature = req.headers["x-razorpay-signature"] as string;
      const bodyRaw = (req as any).rawBody || JSON.stringify(req.body);
      const expected = crypto.createHmac("sha256", secret).update(bodyRaw).digest("hex");
      if (expected !== signature) return res.status(400).json({ message: "Invalid signature" });
      const payload = req.body;
      const event = payload.event;
      if (event === "payment.captured" || event === "order.paid") {
        const rOrderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
        if (rOrderId) {
          const rp2 = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || "", key_secret: process.env.RAZORPAY_KEY_SECRET || "" });
          const fetched = await rp2.orders.fetch(rOrderId);
          const receipt = fetched.receipt;
          if (receipt) {
            const orderSvc = container.resolve(OrderService);
            await orderSvc.markPaidById(String(receipt), payload);
          }
        }
      }
      res.json({ status: "ok" });
    } catch (err:any) { console.error(err); res.status(500).json({ message: "Webhook error" }); }
  }
}

const controller = new PaymentController();

// Export bound methods to maintain the same interface
export const createPaymentOrder = controller.createPaymentOrder.bind(controller);
export const razorpayWebhook = controller.razorpayWebhook.bind(controller);
