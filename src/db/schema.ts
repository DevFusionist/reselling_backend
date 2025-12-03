import { pgTable, serial, text, varchar, integer, timestamp, boolean, numeric, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("customer"), // 'admin'|'reseller'|'customer'
  profile_picture_url: text("profile_picture_url"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  base_price: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  reseller_price: numeric("reseller_price", { precision: 10, scale: 2 }),
  retail_price: numeric("retail_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const reseller_markups = pgTable("reseller_markups", {
  id: serial("id").primaryKey(),
  reseller_id: integer("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  markup_amount: numeric("markup_amount", { precision: 10, scale: 2 }).notNull(),
  unique_key: varchar("unique_key", { length: 128 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_reseller_product").on(table.reseller_id, table.product_id)
]);

export const share_links = pgTable("share_links", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  creator_id: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  margin_amount: numeric("margin_amount", { precision: 10, scale: 2 }).notNull(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  reseller_id: integer("reseller_id").references(() => users.id, { onDelete: "set null" }),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  share_link_id: integer("share_link_id").references(() => share_links.id, { onDelete: "set null" }),
  final_price: numeric("final_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  status: varchar("status", { length: 50 }).default('pending').notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

/* New tables */
export const refresh_tokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token_hash: varchar("token_hash", { length: 512 }).notNull().unique(),
  revoked: boolean("revoked").default(false).notNull(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  internal_receipt_id: varchar("internal_receipt_id", { length: 128 }).notNull(),
  razorpay_order_id: varchar("razorpay_order_id", { length: 128 }).unique(),
  razorpay_payment_id: varchar("razorpay_payment_id", { length: 128 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default('INR').notNull(),
  status: varchar("status", { length: 50 }).default('created').notNull(),
  metadata: text("metadata"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  payment_id: integer("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
  reseller_id: integer("reseller_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  razorpay_payout_id: varchar("razorpay_payout_id", { length: 128 }),
  beneficiary_account_id: varchar("beneficiary_account_id", { length: 128 }),
  fund_account_id: varchar("fund_account_id", { length: 128 }),
  status: varchar("status", { length: 50 }).default('pending').notNull(), // pending, processed, failed
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const product_images = pgTable("product_images", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  image_url: text("image_url").notNull(),
  display_order: integer("display_order").default(0).notNull(), // For ordering images
  created_at: timestamp("created_at").defaultNow().notNull()
});
