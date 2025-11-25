import { db } from "../db";
import { payouts } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const payoutRepo = {
  async create(data: {
    order_id: number;
    payment_id: number;
    reseller_id: number;
    amount: string;
    beneficiary_account_id?: string;
    fund_account_id?: string;
    notes?: string;
  }) {
    const [payout] = await db.insert(payouts).values({
      ...data,
      status: "pending"
    }).returning();
    return payout;
  },

  async findById(id: number) {
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id));
    return payout;
  },

  async findByOrderId(orderId: number) {
    const [payout] = await db.select().from(payouts).where(eq(payouts.order_id, orderId));
    return payout;
  },

  async updateStatus(id: number, status: string, razorpayPayoutId?: string) {
    const [payout] = await db
      .update(payouts)
      .set({
        status,
        razorpay_payout_id: razorpayPayoutId,
        updated_at: new Date()
      })
      .where(eq(payouts.id, id))
      .returning();
    return payout;
  },

  async listByReseller(resellerId: number) {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.reseller_id, resellerId))
      .orderBy(desc(payouts.created_at));
  }
};

