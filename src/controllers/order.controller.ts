import { Context } from "hono";
import { orderService } from "../services/order.service";
import { CreateOrderDTO, OrderListDTO } from "../dtos/order.dto";
import { success, failure } from "../utils/apiResponse";

export const orderController = {
  async create(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = CreateOrderDTO.safeParse(body);
    if (!parsed.success) {
      return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
    }

    const order = await orderService.createOrder(user.sub, parsed.data);
    return c.json(success(order, "Order created successfully"));
  },

  async getById(c: Context) {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (!id || isNaN(id)) {
      return c.json(failure("Invalid order ID", "VALIDATION_ERROR"), 400);
    }

    const order = await orderService.getOrderById(id, user.sub, user.role);
    return c.json(success(order));
  },

  async list(c: Context) {
    const user = c.get("user");
    const query = c.req.query();
    const parsed = OrderListDTO.safeParse(query);
    if (!parsed.success) {
      return c.json(failure("Invalid query parameters", "VALIDATION_ERROR"), 400);
    }

    const result = await orderService.listOrders(user.sub, user.role, parsed.data);
    return c.json(success(result));
  },

  async updateStatus(c: Context) {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (!id || isNaN(id)) {
      return c.json(failure("Invalid order ID", "VALIDATION_ERROR"), 400);
    }

    const body = await c.req.json();
    const { status } = body;
    if (!status) {
      return c.json(failure("Status is required", "VALIDATION_ERROR"), 400);
    }

    const order = await orderService.updateOrderStatus(id, status, user.role);
    return c.json(success(order, "Order status updated successfully"));
  }
};

