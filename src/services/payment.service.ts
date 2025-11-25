import { db } from "../db";
import { payments, orders, products } from "../db/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";
import crypto from "crypto";
import { log } from "../utils/logger";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from "../config";
import { orderRepo } from "../repositories/order.repo";
import { payoutService } from "./payout.service";

function toPaise(amount: number) {
  return Math.round(amount * 100);
}

export const paymentService = {
  async createPaymentOrder(orderId: number, metadata?: any) {
    // Get order details
    const order = await orderRepo.findById(orderId);
    if (!order) {
      throw { status: 404, message: "Order not found", code: "NOT_FOUND" };
    }

    if ((order as any).status !== "pending") {
      throw { status: 400, message: "Order is not in pending status", code: "INVALID_ORDER_STATUS" };
    }

    const amount = Number((order as any).final_price);
    const amountPaise = toPaise(amount);
    const internalReceiptId = `rcpt_${orderId}_${Date.now()}`;

    const body = {
      amount: amountPaise,
      currency: "INR",
      receipt: internalReceiptId,
      payment_capture: 1,
      notes: {
        order_id: orderId,
        ...metadata
      }
    };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      log.error("razorpay create order failed", txt);
      throw { status: 502, message: "Razorpay order creation failed", code: "RAZORPAY_ERROR" };
    }

    const data = (await res.json()) as Record<string, any>;

    // Save payment record
    const [payment] = await db
      .insert(payments)
      .values({
        order_id: orderId,
        internal_receipt_id: internalReceiptId,
        razorpay_order_id: data.id,
        amount: amount.toString(),
        currency: "INR",
        status: "created",
        metadata: JSON.stringify(metadata || {})
      })
      .returning();

    return {
      ...data,
      internal_receipt_id: internalReceiptId,
      payment_id: payment.id,
      order_id: orderId
    };
  },

  verifyWebhook(payload: string, signature: string) {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      throw new Error("Razorpay webhook secret not configured");
    }
    const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
    return expected === signature;
  },

  async handleWebhook(data: any) {
    const event = data.event;

    if (event === "payment.captured") {
      const payment = data.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      // Find payment by razorpay_order_id
      const [paymentRecord] = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpay_order_id, razorpayOrderId));

      if (!paymentRecord) {
        log.error("Payment record not found for razorpay_order_id", razorpayOrderId);
        return;
      }

      // Update payment status
      await db
        .update(payments)
        .set({
          razorpay_payment_id: payment.id,
          status: "captured"
        })
        .where(eq(payments.id, paymentRecord.id));

      // Update order status
      await orderRepo.updateStatus(paymentRecord.order_id, "paid");

      // Trigger payout if reseller exists
      const order = await orderRepo.findById(paymentRecord.order_id);
      if (order && (order as any).reseller_id) {
        try {
          await payoutService.processPayoutForOrder(paymentRecord.order_id);
        } catch (err) {
          log.error("Failed to process payout", err);
          // Don't throw - payment is captured, payout can be retried
        }
      }
    }
  }
};
