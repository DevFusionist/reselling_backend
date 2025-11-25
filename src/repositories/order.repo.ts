import { db } from "../db";
import { orders, products, users } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { OrderListInput } from "../dtos/order.dto";

export const orderRepo = {
  async create(data: {
    customer_id: number;
    product_id: number;
    reseller_id?: number;
    share_link_id?: number;
    final_price: string;
    quantity: number;
    status?: string;
  }) {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  },

  async findById(id: number) {
    // Using Drizzle relations for type-safe nested query
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        product: true,
        customer: true,
        reseller: true,
        shareLink: true
      }
    });

    return order || null;
  },

  async listByCustomer(customerId: number, input: OrderListInput) {
    const offset = (input.page - 1) * input.limit;
    
    // Build where conditions
    const conditions = [eq(orders.customer_id, customerId)];
    if (input.status) {
      conditions.push(sql`${orders.status} = ${input.status}`);
    }
    
    const allOrders = await db
      .select({
        order: orders,
        product: products
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(and(...conditions))
      .orderBy(desc(orders.created_at))
      .limit(input.limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customer_id, customerId));

    return {
      orders: allOrders.map(o => ({
        ...o.order,
        product: o.product
      })),
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit)
    };
  },

  async listByReseller(resellerId: number, input: OrderListInput) {
    const offset = (input.page - 1) * input.limit;
    
    // Build where conditions
    const conditions = [eq(orders.reseller_id, resellerId)];
    if (input.status) {
      conditions.push(sql`${orders.status} = ${input.status}`);
    }
    
    const allOrders = await db
      .select({
        order: orders,
        product: products,
        customer: users
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .innerJoin(users, eq(orders.customer_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(orders.created_at))
      .limit(input.limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.reseller_id, resellerId));

    return {
      orders: allOrders.map(o => ({
        ...o.order,
        product: o.product,
        customer: o.customer
      })),
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit)
    };
  },

  async updateStatus(id: number, status: string) {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }
};

