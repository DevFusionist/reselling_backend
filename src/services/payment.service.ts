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

    // Use total_amount (which is always set) instead of final_price (which may be null)
    const amount = Number((order as any).total_amount || (order as any).final_price || 0);
    if (amount <= 0) {
      throw { status: 400, message: "Order amount must be greater than 0", code: "INVALID_ORDER_AMOUNT" };
    }
    const amountPaise = toPaise(amount);
    const internalReceiptId = `rcpt_${orderId}_${Date.now()}`;

    console.log("amount", amount, "amountPaise", amountPaise, "internalReceiptId", internalReceiptId);

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
    let razorpayOrderId: string;
    let razorpayPaymentId: string;

    // Handle standard Razorpay webhook format
    if (data.event === "payment.captured") {
      const payment = data.payload.payment.entity;
      razorpayOrderId = payment.order_id;
      razorpayPaymentId = payment.id;
    } else {
      log.error("Unknown webhook format", data);
      return;
    }

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
        razorpay_payment_id: razorpayPaymentId,
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
  },

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw { status: 401, message: "Invalid payment signature", code: "INVALID_SIGNATURE" };
    }

    // Verify payment with Razorpay API
    const res = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64"),
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      log.error("razorpay payment verification failed", txt);
      throw { status: 502, message: "Razorpay payment verification failed", code: "RAZORPAY_ERROR" };
    }

    const paymentData = (await res.json()) as Record<string, any>;

    // Check if payment is captured
    if (paymentData.status !== "captured") {
      throw { status: 400, message: `Payment not captured. Status: ${paymentData.status}`, code: "PAYMENT_NOT_CAPTURED" };
    }

    // Find payment by razorpay_order_id
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpay_order_id, razorpayOrderId));

      console.log("paymentRecord -- ", paymentRecord, "paymentData -- ", paymentData);

    if (!paymentRecord) {
      throw { status: 404, message: "Payment record not found", code: "NOT_FOUND" };
    }

    // Check if already processed
    if (paymentRecord.status === "captured") {
      return {
        payment: paymentRecord,
        order_id: paymentRecord.order_id,
        message: "Payment already verified"
      };
    }

    // Update payment status
    const [updatedPayment] = await db
      .update(payments)
      .set({
        razorpay_payment_id: razorpayPaymentId,
        status: paymentData.status
      })
      .where(eq(payments.id, paymentRecord.id))
      .returning();

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

    return {
      payment: updatedPayment,
      order_id: paymentRecord.order_id,
      message: "Payment verified successfully",
      verified: paymentData.status === "captured"
    };
  }
};
