import { payoutRepo } from "../repositories/payout.repo";
import { orderRepo } from "../repositories/order.repo";
import { productRepo } from "../repositories/product.repo";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "../config";
import { log } from "../utils/logger";
import fetch from "node-fetch";

function toPaise(amount: number) {
  return Math.round(amount * 100);
}

export const payoutService = {
  async processPayoutForOrder(orderId: number) {
    // Get order details
    const order = await orderRepo.findById(orderId);
    if (!order) {
      throw { status: 404, message: "Order not found", code: "NOT_FOUND" };
    }

    const orderData = order as any;
    if (!orderData.reseller_id) {
      // No reseller, no payout needed
      return null;
    }

    // Check if payout already exists
    const existingPayout = await payoutRepo.findByOrderId(orderId);
    if (existingPayout) {
      log.info("Payout already exists for order", orderId);
      return existingPayout;
    }

    // Calculate reseller earning
    const product = await productRepo.findById(orderData.product_id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    const basePrice = Number(product.base_price);
    const finalPrice = Number(orderData.final_price);
    const resellerEarning = finalPrice - basePrice;

    if (resellerEarning <= 0) {
      log.info("No earning for reseller in order", orderId);
      return null;
    }

    // Get payment record
    const { db } = await import("../db");
    const { payments } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.order_id, orderId));

    if (!paymentRecord) {
      throw { status: 404, message: "Payment record not found", code: "NOT_FOUND" };
    }

    // Create payout record (pending)
    const payout = await payoutRepo.create({
      order_id: orderId,
      payment_id: paymentRecord.id,
      reseller_id: orderData.reseller_id,
      amount: resellerEarning.toString()
    });

    // Note: Actual Razorpay payout requires beneficiary account setup
    // This is a placeholder - in production, you'd need:
    // 1. Reseller's beneficiary account ID
    // 2. Fund account ID
    // 3. Call Razorpay Payouts API

    return payout;
  },

  async executePayout(
    payoutId: number,
    beneficiaryAccountId: string,
    fundAccountId: string
  ) {
    const payout = await payoutRepo.findById(payoutId);
    if (!payout) {
      throw { status: 404, message: "Payout not found", code: "NOT_FOUND" };
    }

    if (payout.status !== "pending") {
      throw { status: 400, message: "Payout is not in pending status", code: "INVALID_STATUS" };
    }

    const amountPaise = toPaise(Number(payout.amount));

    const body = {
      account_number: beneficiaryAccountId,
      fund_account_id: fundAccountId,
      amount: amountPaise,
      currency: "INR",
      mode: "NEFT", // or IMPS, RTGS
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: `payout_${payoutId}_${Date.now()}`,
      narration: `Payout for order ${payout.order_id}`
    };

    try {
      const res = await fetch("https://api.razorpay.com/v1/payouts", {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const txt = await res.text();
        log.error("razorpay payout failed", txt);
        await payoutRepo.updateStatus(payoutId, "failed");
        throw { status: 502, message: "Razorpay payout failed", code: "RAZORPAY_ERROR", detail: txt };
      }

      const data = await res.json();
      await payoutRepo.updateStatus(payoutId, "processed", data.id);

      return {
        ...data,
        payout_id: payoutId
      };
    } catch (err: any) {
      if (err.code !== "RAZORPAY_ERROR") {
        await payoutRepo.updateStatus(payoutId, "failed");
      }
      throw err;
    }
  },

  async getPayoutsByReseller(resellerId: number) {
    return await payoutRepo.listByReseller(resellerId);
  }
};

