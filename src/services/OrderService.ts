import { inject, injectable } from "tsyringe";
@injectable()
export default class OrderService {
  constructor(@inject("IOrderRepository") private orderRepo:any, @inject("IProductRepository") private productRepo:any, @inject("IWalletTransactionRepository") private walletTxRepo:any) {}
  async createInternalOrder(customerId:string, productId:string, quantity=1, resellerId?:string, margin=0){
    const product = await this.productRepo.findById(productId);
    if (!product) throw new Error("Product not found");
    const basePrice = product.basePrice * quantity;
    const total = basePrice + Number(margin||0);
    return this.orderRepo.create({ customerId, productId, quantity, resellerId: resellerId||null, margin, basePrice, totalAmount: total, status:"pending" });
  }
  async markPaidById(orderId:string, payload?:any){
    const upd = await this.orderRepo.update(orderId, { status:"paid", paymentMeta: payload });
    if (upd && upd.resellerId && upd.margin) {
      const User = (await import("../models/User")).default;
      const u = await User.findById(upd.resellerId);
      if (u) { u.walletBalance = (u.walletBalance||0) + upd.margin; await u.save(); await this.walletTxRepo.create({ resellerId: u._id, amount: upd.margin, type:"earning", description:`Earning from ${upd._id}` }); }
    }
    return upd;
  }
}
