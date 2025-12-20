import { Context } from "hono";
import { paymentService } from "../services/payment.service";
import { payoutService } from "../services/payout.service";
import { success, failure } from "../utils/apiResponse";

export const paymentController = {
  async createPaymentOrder(c: Context) {
    const body = await c.req.json();
    const { order_id, metadata } = body;
    console.log("order_id", order_id, "metadata", metadata);
    if (!order_id) {
      return c.json(failure("order_id is required", "VALIDATION_ERROR"), 400);
    }

    const paymentOrder = await paymentService.createPaymentOrder(order_id, metadata);
    return c.json(success(paymentOrder, "Payment order created successfully"));
  },

  async verifyWebhook(c: Context) {
    const payload = await c.req.text();
    const signature = c.req.header("x-razorpay-signature") || c.req.header("X-Razorpay-Signature");
    
    if (!signature) {
      return c.json(failure("Missing signature", "VALIDATION_ERROR"), 400);
    }

    const ok = paymentService.verifyWebhook(payload, signature);
    if (!ok) {
      return c.json(failure("Invalid signature", "UNAUTHORIZED"), 401);
    }

    const data = JSON.parse(payload);
    await paymentService.handleWebhook(data);
    return c.text("ok");
  },

  async verifyPayment(c: Context) {
    const body = await c.req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json(
        failure("razorpay_order_id, razorpay_payment_id, and razorpay_signature are required", "VALIDATION_ERROR"),
        400
      );
    }

    try {
      const result = await paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      return c.json(success(result, result.message));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Payment verification failed", error.code || "VERIFICATION_ERROR"),
        error.status || 500
      );
    }
  },

  async executePayout(c: Context) {
    const body = await c.req.json();
    const { payout_id, beneficiary_account_id, fund_account_id } = body;
    
    if (!payout_id || !beneficiary_account_id || !fund_account_id) {
      return c.json(failure("payout_id, beneficiary_account_id, and fund_account_id are required", "VALIDATION_ERROR"), 400);
    }

    const payout = await payoutService.executePayout(payout_id, beneficiary_account_id, fund_account_id);
    return c.json(success(payout, "Payout executed successfully"));
  },

  async getPayouts(c: Context) {
    const user = c.get("user");
    const payouts = await payoutService.getPayoutsByReseller(user.sub);
    return c.json(success(payouts));
  }
};
