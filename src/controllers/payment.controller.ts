import { Context } from "hono";
import { paymentService } from "../services/payment.service";
import { payoutService } from "../services/payout.service";
import { success, failure } from "../utils/apiResponse";
import { authRequired } from "../middlewares/auth.middleware";

export const paymentController = {
  async createPaymentOrder(c: Context) {
    const body = await c.req.json();
    const { order_id, metadata } = body;
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
