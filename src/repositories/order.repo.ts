import { db } from "../db";
import { orders, products, users, order_items } from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { OrderListInput } from "../dtos/order.dto";

export const orderRepo = {
  async create(data: {
    customer_id: number;
    product_id?: number; // Optional for backward compatibility
    reseller_id?: number;
    share_link_id?: number;
    final_price?: string; // Optional - will be calculated from items
    quantity?: number; // Optional - will be in order_items
    total_amount?: string; // Total of all items (required for new orders)
    status?: string;
  }) {
    // For backward compatibility: if total_amount not provided, use final_price
    const insertData = {
      ...data,
      total_amount: data.total_amount || data.final_price || "0"
    };
    const [order] = await db.insert(orders).values(insertData).returning();
    return order;
  },

  async createWithItems(
    orderData: {
      customer_id: number;
      reseller_id?: number;
      share_link_id?: number;
      total_amount: string;
      status?: string;
      // Shipping address
      shipping_name?: string;
      shipping_phone?: string;
      shipping_address_line1?: string;
      shipping_address_line2?: string;
      shipping_city?: string;
      shipping_state?: string;
      shipping_postal_code?: string;
      shipping_country?: string;
      // Billing address
      billing_name?: string;
      billing_phone?: string;
      billing_address_line1?: string;
      billing_address_line2?: string;
      billing_city?: string;
      billing_state?: string;
      billing_postal_code?: string;
      billing_country?: string;
    },
    items: Array<{
      product_id: number;
      quantity: number;
      unit_price: string;
      total_price: string;
      share_link_id?: number;
    }>
  ) {
    // Create order with address fields
    const [order] = await db.insert(orders).values({
      customer_id: orderData.customer_id,
      reseller_id: orderData.reseller_id,
      share_link_id: orderData.share_link_id,
      total_amount: orderData.total_amount,
      status: orderData.status || "pending",
      // Shipping address
      shipping_name: orderData.shipping_name || null,
      shipping_phone: orderData.shipping_phone || null,
      shipping_address_line1: orderData.shipping_address_line1 || null,
      shipping_address_line2: orderData.shipping_address_line2 || null,
      shipping_city: orderData.shipping_city || null,
      shipping_state: orderData.shipping_state || null,
      shipping_postal_code: orderData.shipping_postal_code || null,
      shipping_country: orderData.shipping_country || null,
      // Billing address (use shipping if not provided)
      billing_name: orderData.billing_name || orderData.shipping_name || null,
      billing_phone: orderData.billing_phone || orderData.shipping_phone || null,
      billing_address_line1: orderData.billing_address_line1 || orderData.shipping_address_line1 || null,
      billing_address_line2: orderData.billing_address_line2 || orderData.shipping_address_line2 || null,
      billing_city: orderData.billing_city || orderData.shipping_city || null,
      billing_state: orderData.billing_state || orderData.shipping_state || null,
      billing_postal_code: orderData.billing_postal_code || orderData.shipping_postal_code || null,
      billing_country: orderData.billing_country || orderData.shipping_country || null,
    }).returning();

    // Create order items
    if (items.length > 0) {
      await db.insert(order_items).values(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          share_link_id: item.share_link_id
        }))
      );
    }

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
        shareLink: true,
        items: {
          with: {
            product: true,
            shareLink: true
          }
        }
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
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.created_at))
      .limit(input.limit)
      .offset(offset);

    // Get order IDs
    const orderIds = allOrders.map(o => o.id);

    // Get order items for these orders
    const items = orderIds.length > 0
      ? await db
          .select()
          .from(order_items)
          .where(inArray(order_items.order_id, orderIds))
      : [];

    // Get products for order items
    const productIds = [...new Set(items.map(i => i.product_id))];
    const productsMap = new Map();
    if (productIds.length > 0) {
      const productsList = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      productsList.forEach(p => productsMap.set(p.id, p));
    }

    // Group items by order_id
    const itemsByOrderId = new Map();
    items.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push({
        ...item,
        product: productsMap.get(item.product_id)
      });
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));

    return {
      orders: allOrders.map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
        // For backward compatibility with old orders that have product_id
        product: order.product_id ? productsMap.get(order.product_id) : null
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
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.created_at))
      .limit(input.limit)
      .offset(offset);

    // Get order IDs and customer IDs
    const orderIds = allOrders.map(o => o.id);
    const customerIds = [...new Set(allOrders.map(o => o.customer_id))];

    // Get order items
    const items = orderIds.length > 0
      ? await db
          .select()
          .from(order_items)
          .where(inArray(order_items.order_id, orderIds))
      : [];

    // Get products and customers
    const productIds = [...new Set(items.map(i => i.product_id))];
    const productsMap = new Map();
    const customersMap = new Map();

    if (productIds.length > 0) {
      const productsList = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      productsList.forEach(p => productsMap.set(p.id, p));
    }

    if (customerIds.length > 0) {
      const customersList = await db
        .select()
        .from(users)
        .where(inArray(users.id, customerIds));
      customersList.forEach(c => customersMap.set(c.id, c));
    }

    // Group items by order_id
    const itemsByOrderId = new Map();
    items.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push({
        ...item,
        product: productsMap.get(item.product_id)
      });
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));

    return {
      orders: allOrders.map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
        customer: customersMap.get(order.customer_id),
        // For backward compatibility
        product: order.product_id ? productsMap.get(order.product_id) : null
      })),
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit)
    };
  },

  async listAll(input: OrderListInput) {
    const offset = (input.page - 1) * input.limit;
    
    // Build where conditions
    const conditions = [];
    if (input.status) {
      conditions.push(sql`${orders.status} = ${input.status}`);
    }
    
    const allOrders = await db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.created_at))
      .limit(input.limit)
      .offset(offset);

    // Get order IDs, customer IDs, and reseller IDs
    const orderIds = allOrders.map(o => o.id);
    const customerIds = [...new Set(allOrders.map(o => o.customer_id))];
    const resellerIds = allOrders
      .map(o => o.reseller_id)
      .filter((id): id is number => id !== null && id !== undefined);

    // Get order items
    const items = orderIds.length > 0
      ? await db
          .select()
          .from(order_items)
          .where(inArray(order_items.order_id, orderIds))
      : [];

    // Get products, customers, and resellers
    const productIds = [...new Set(items.map(i => i.product_id))];
    const productsMap = new Map();
    const customersMap = new Map();
    const resellersMap = new Map();

    if (productIds.length > 0) {
      const productsList = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      productsList.forEach(p => productsMap.set(p.id, p));
    }

    if (customerIds.length > 0) {
      const customersList = await db
        .select()
        .from(users)
        .where(inArray(users.id, customerIds));
      customersList.forEach(c => customersMap.set(c.id, c));
    }

    if (resellerIds.length > 0) {
      const resellers = await db
        .select()
        .from(users)
        .where(inArray(users.id, resellerIds));
      resellers.forEach(reseller => {
        resellersMap.set(reseller.id, reseller);
      });
    }

    // Group items by order_id
    const itemsByOrderId = new Map();
    items.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push({
        ...item,
        product: productsMap.get(item.product_id)
      });
    });

    // Get total count with same conditions
    const countConditions = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(countConditions);

    return {
      orders: allOrders.map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
        customer: customersMap.get(order.customer_id),
        reseller: order.reseller_id ? resellersMap.get(order.reseller_id) || null : null,
        // For backward compatibility
        product: order.product_id ? productsMap.get(order.product_id) : null
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

