import { orderRepo } from "../repositories/order.repo";
import { productRepo } from "../repositories/product.repo";
import { markupRepo } from "../repositories/markup.repo";
import { shareLinkRepo } from "../repositories/shareLink.repo";
import { CreateOrderItemInput, OrderListInput, CreateOrderInput } from "../dtos/order.dto";

export const orderService = {
  async createOrders(customerId: number, input: CreateOrderInput) {
    const { items, shipping_address, billing_address } = input;
    // Validate all items first
    const validatedItems: Array<{
      item: CreateOrderItemInput;
      product: any;
      unitPrice: number;
      totalPrice: number;
      resellerId?: number;
      shareLinkId?: number;
    }> = [];

    const errors: Array<{ item: CreateOrderItemInput; error: string }> = [];

    // Validate and calculate prices for all items
    for (const item of items) {
      try {
        // Verify product exists and has stock
        const productResult = await productRepo.findById(item.product_id);
        if (!productResult) {
          errors.push({
            item,
            error: "Product not found"
          });
          continue;
        }

        const product = (productResult as any).product || productResult;

        if (product.stock < item.quantity) {
          errors.push({
            item,
            error: "Insufficient stock"
          });
          continue;
        }

        let unitPrice = Number(product.base_price);
        let resellerId: number | undefined = item.reseller_id;
        let shareLinkId: number | undefined;

        // Handle share link
        if (item.share_link_code) {
          const shareLink = await shareLinkRepo.findByCode(item.share_link_code);
          if (!shareLink) {
            errors.push({
              item,
              error: "Share link not found or expired"
            });
            continue;
          }
          const marginAmount = Number(shareLink.margin_amount);
          unitPrice = Number(product.base_price) + marginAmount;
          resellerId = shareLink.creator_id;
          shareLinkId = shareLink.id;
        }
        // Handle reseller markup
        else if (item.reseller_id) {
          const markup = await markupRepo.findByResellerAndProduct(item.reseller_id, item.product_id);
          if (markup) {
            const markupAmount = Number(markup.markup_amount);
            unitPrice = Number(product.base_price) + markupAmount;
          }
        }

        const totalPrice = unitPrice * item.quantity;

        validatedItems.push({
          item,
          product,
          unitPrice,
          totalPrice,
          resellerId,
          shareLinkId
        });
      } catch (error: any) {
        errors.push({
          item,
          error: error.message || "Failed to validate item"
        });
      }
    }

    if (validatedItems.length === 0) {
      throw {
        status: 400,
        message: "No valid items to create order",
        code: "VALIDATION_ERROR",
        errors
      };
    }

    // Determine reseller_id (use the first item's reseller if all have the same, otherwise null)
    const resellerIds = validatedItems.map(v => v.resellerId).filter(Boolean);
    const uniqueResellerIds = [...new Set(resellerIds)];
    const orderResellerId = uniqueResellerIds.length === 1 ? uniqueResellerIds[0] : undefined;

    // Calculate total amount
    const totalAmount = validatedItems.reduce((sum, v) => sum + v.totalPrice, 0);

    // Create single order with all items and address
    const order = await orderRepo.createWithItems(
      {
        customer_id: customerId,
        reseller_id: orderResellerId,
        total_amount: totalAmount.toString(),
        status: "pending",
        // Shipping address
        shipping_name: shipping_address.name,
        shipping_phone: shipping_address.phone,
        shipping_address_line1: shipping_address.address_line1,
        shipping_address_line2: shipping_address.address_line2,
        shipping_city: shipping_address.city,
        shipping_state: shipping_address.state,
        shipping_postal_code: shipping_address.postal_code,
        shipping_country: shipping_address.country,
        // Billing address (use shipping if not provided)
        billing_name: billing_address?.name,
        billing_phone: billing_address?.phone,
        billing_address_line1: billing_address?.address_line1,
        billing_address_line2: billing_address?.address_line2,
        billing_city: billing_address?.city,
        billing_state: billing_address?.state,
        billing_postal_code: billing_address?.postal_code,
        billing_country: billing_address?.country,
      },
      validatedItems.map(v => ({
        product_id: v.item.product_id,
        quantity: v.item.quantity,
        unit_price: v.unitPrice.toString(),
        total_price: v.totalPrice.toString(),
        share_link_id: v.shareLinkId
      }))
    );

    // Update stock for all products
    for (const validatedItem of validatedItems) {
      await productRepo.update(validatedItem.item.product_id, {
        stock: validatedItem.product.stock - validatedItem.item.quantity
      });
    }

    // Fetch order with items for response
    const orderWithItems = await orderRepo.findById(order.id);

    return {
      order: orderWithItems,
      total_amount: totalAmount,
      items_count: validatedItems.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  // Legacy method for backward compatibility - creates a single-item order
  async createOrder(customerId: number, input: CreateOrderItemInput, shippingAddress?: any, billingAddress?: any) {
    // Use the new createOrders method with a single item
    const orderInput: CreateOrderInput = {
      items: [input],
      shipping_address: shippingAddress || {
        name: "",
        phone: "",
        address_line1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      },
      billing_address: billingAddress,
    };
    const result = await this.createOrders(customerId, orderInput);
    return result.order;
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
      // Admin can see all orders with full details
      return await orderRepo.listAll(input);
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

