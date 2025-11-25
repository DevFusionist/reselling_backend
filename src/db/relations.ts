import { relations } from "drizzle-orm";
import {
  users,
  products,
  reseller_markups,
  share_links,
  orders,
  refresh_tokens,
  payments,
  payouts,
} from "./schema";

/**
 * Drizzle Relations for type-safe querying
 * 
 * Performance Note:
 * - Use db.query.* for simple nested queries (convenient, type-safe)
 * - Use manual joins for complex/optimized queries (faster, more control)
 * - Drizzle relations generate efficient SQL but manual joins give you full control
 */

export const usersRelations = relations(users, ({ one, many }) => ({
  // One-to-many: User can have many orders as customer
  customerOrders: many(orders, { relationName: "customerOrders" }),
  // One-to-many: User can have many orders as reseller
  resellerOrders: many(orders, { relationName: "resellerOrders" }),
  // One-to-many: User can create many share links
  shareLinks: many(share_links),
  // One-to-many: User can have many markups
  markups: many(reseller_markups),
  // One-to-many: User can have many refresh tokens
  refreshTokens: many(refresh_tokens),
  // One-to-many: User can receive many payouts
  payouts: many(payouts),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  // One-to-many: Product can be in many orders
  orders: many(orders),
  // One-to-many: Product can have many markups
  markups: many(reseller_markups),
  // One-to-many: Product can have many share links
  shareLinks: many(share_links),
}));

export const resellerMarkupsRelations = relations(reseller_markups, ({ one }) => ({
  reseller: one(users, {
    fields: [reseller_markups.reseller_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reseller_markups.product_id],
    references: [products.id],
  }),
}));

export const shareLinksRelations = relations(share_links, ({ one, many }) => ({
  creator: one(users, {
    fields: [share_links.creator_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [share_links.product_id],
    references: [products.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customer_id],
    references: [users.id],
    relationName: "customerOrders",
  }),
  reseller: one(users, {
    fields: [orders.reseller_id],
    references: [users.id],
    relationName: "resellerOrders",
  }),
  product: one(products, {
    fields: [orders.product_id],
    references: [products.id],
  }),
  shareLink: one(share_links, {
    fields: [orders.share_link_id],
    references: [share_links.id],
  }),
  payments: many(payments),
  payouts: many(payouts),
}));

export const refreshTokensRelations = relations(refresh_tokens, ({ one }) => ({
  user: one(users, {
    fields: [refresh_tokens.user_id],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, {
    fields: [payments.order_id],
    references: [orders.id],
  }),
  payouts: many(payouts),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  order: one(orders, {
    fields: [payouts.order_id],
    references: [orders.id],
  }),
  payment: one(payments, {
    fields: [payouts.payment_id],
    references: [payments.id],
  }),
  reseller: one(users, {
    fields: [payouts.reseller_id],
    references: [users.id],
  }),
}));

