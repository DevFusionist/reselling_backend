import { orderRepo } from "../repositories/order.repo";
import { productRepo } from "../repositories/product.repo";
import { markupRepo } from "../repositories/markup.repo";
import { shareLinkRepo } from "../repositories/shareLink.repo";
import { CreateOrderInput, OrderListInput } from "../dtos/order.dto";

export const orderService = {
  async createOrder(customerId: number, input: CreateOrderInput) {
    // Verify product exists and has stock
    const product = await productRepo.findById(input.product_id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    if (product.stock < input.quantity) {
      throw { status: 400, message: "Insufficient stock", code: "INSUFFICIENT_STOCK" };
    }

    let finalPrice = Number(product.base_price);
    let resellerId: number | undefined = input.reseller_id;
    let shareLinkId: number | undefined;

    // Handle share link
    if (input.share_link_code) {
      const shareLink = await shareLinkRepo.findByCode(input.share_link_code);
      if (!shareLink) {
        throw { status: 404, message: "Share link not found or expired", code: "INVALID_SHARE_LINK" };
      }
      const marginAmount = Number(shareLink.margin_amount);
      finalPrice = Number(product.base_price) + marginAmount;
      resellerId = (shareLink as any).creator_id;
      shareLinkId = (shareLink as any).id;
    }
    // Handle reseller markup
    else if (input.reseller_id) {
      const markup = await markupRepo.findByResellerAndProduct(input.reseller_id, input.product_id);
      if (markup) {
        const markupAmount = Number(markup.markup_amount);
        finalPrice = Number(product.base_price) + markupAmount;
      }
    }

    // Calculate total price
    const totalPrice = finalPrice * input.quantity;

    // Create order
    const order = await orderRepo.create({
      customer_id: customerId,
      product_id: input.product_id,
      reseller_id: resellerId,
      share_link_id: shareLinkId,
      final_price: totalPrice.toString(),
      quantity: input.quantity,
      status: "pending"
    });

    // Update stock
    await productRepo.update(input.product_id, {
      stock: product.stock - input.quantity
    });

    return {
      ...order,
      product,
      unit_price: finalPrice,
      total_price: totalPrice
    };
  },

  async getOrderById(id: number, userId: number, userRole: string) {
    const order = await orderRepo.findById(id);
    if (!order) {
      throw { status: 404, message: "Order not found", code: "NOT_FOUND" };
    }

    // Check authorization
    if (userRole !== "admin" && (order as any).customer_id !== userId && (order as any).reseller_id !== userId) {
      throw { status: 403, message: "Access denied", code: "FORBIDDEN" };
    }

    return order;
  },

  async listOrders(userId: number, userRole: string, input: OrderListInput) {
    if (userRole === "admin") {
      // Admin can see all orders - implement if needed
      throw { status: 501, message: "Admin order listing not implemented", code: "NOT_IMPLEMENTED" };
    } else if (userRole === "reseller") {
      return await orderRepo.listByReseller(userId, input);
    } else {
      return await orderRepo.listByCustomer(userId, input);
    }
  },

  async updateOrderStatus(id: number, status: string, userRole: string) {
    if (userRole !== "admin") {
      throw { status: 403, message: "Only admin can update order status", code: "FORBIDDEN" };
    }

    const order = await orderRepo.findById(id);
    if (!order) {
      throw { status: 404, message: "Order not found", code: "NOT_FOUND" };
    }

    return await orderRepo.updateStatus(id, status);
  }
};

