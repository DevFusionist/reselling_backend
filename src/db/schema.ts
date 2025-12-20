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
  created_at: timestamp("created_at").defaultNow().notNull(),
  model: varchar("model", { length: 100 }), // Model stays as it's product-specific
  isFeatured: boolean("is_featured").default(false).notNull(),
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
  share_link_id: integer("share_link_id").references(() => share_links.id, { onDelete: "set null" }),
  final_price: numeric("final_price", { precision: 10, scale: 2 }), // Made optional - will be calculated from order_items
  quantity: integer("quantity").default(1), // Made optional - will be in order_items
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(), // Total of all items
  status: varchar("status", { length: 50 }).default('pending').notNull(),
  // Shipping Address Fields
  shipping_name: varchar("shipping_name", { length: 255 }),
  shipping_phone: varchar("shipping_phone", { length: 20 }),
  shipping_address_line1: text("shipping_address_line1"),
  shipping_address_line2: text("shipping_address_line2"),
  shipping_city: varchar("shipping_city", { length: 100 }),
  shipping_state: varchar("shipping_state", { length: 100 }),
  shipping_postal_code: varchar("shipping_postal_code", { length: 20 }),
  shipping_country: varchar("shipping_country", { length: 100 }),
  // Billing Address Fields (optional, defaults to shipping if not provided)
  billing_name: varchar("billing_name", { length: 255 }),
  billing_phone: varchar("billing_phone", { length: 20 }),
  billing_address_line1: text("billing_address_line1"),
  billing_address_line2: text("billing_address_line2"),
  billing_city: varchar("billing_city", { length: 100 }),
  billing_state: varchar("billing_state", { length: 100 }),
  billing_postal_code: varchar("billing_postal_code", { length: 20 }),
  billing_country: varchar("billing_country", { length: 100 }),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const order_items = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").default(1).notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  total_price: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  share_link_id: integer("share_link_id").references(() => share_links.id, { onDelete: "set null" }),
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

/* Product Attribute Tables */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const sub_categories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  category_id: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_category_sub_category").on(table.category_id, table.name)
]);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const colors = pgTable("colors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const sizes = pgTable("sizes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const styles = pgTable("styles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const fits = pgTable("fits", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

/* Product Attribute Mapping Tables */
export const product_categories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  category_id: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_category").on(table.product_id, table.category_id)
]);

export const product_sub_categories = pgTable("product_sub_categories", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sub_category_id: integer("sub_category_id").notNull().references(() => sub_categories.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_sub_category").on(table.product_id, table.sub_category_id)
]);

export const product_brands = pgTable("product_brands", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  brand_id: integer("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_brand").on(table.product_id, table.brand_id)
]);

export const product_colors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  color_id: integer("color_id").notNull().references(() => colors.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_color").on(table.product_id, table.color_id)
]);

export const product_sizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  size_id: integer("size_id").notNull().references(() => sizes.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_size").on(table.product_id, table.size_id)
]);

export const product_materials = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  material_id: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_material").on(table.product_id, table.material_id)
]);

export const product_styles = pgTable("product_styles", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  style_id: integer("style_id").notNull().references(() => styles.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_style").on(table.product_id, table.style_id)
]);

export const product_fits = pgTable("product_fits", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  fit_id: integer("fit_id").notNull().references(() => fits.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_fit").on(table.product_id, table.fit_id)
]);

export const product_patterns = pgTable("product_patterns", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  pattern_id: integer("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  unique("unique_product_pattern").on(table.product_id, table.pattern_id)
]);

/* Product Image Attribute Mapping Table */
export const product_image_attributes = pgTable("product_image_attributes", {
  id: serial("id").primaryKey(),
  product_image_id: integer("product_image_id").notNull().references(() => product_images.id, { onDelete: "cascade" }),
  product_color_id: integer("product_color_id").references(() => product_colors.id, { onDelete: "cascade" }),
  product_size_id: integer("product_size_id").references(() => product_sizes.id, { onDelete: "cascade" }),
  product_material_id: integer("product_material_id").references(() => product_materials.id, { onDelete: "cascade" }),
  product_style_id: integer("product_style_id").references(() => product_styles.id, { onDelete: "cascade" }),
  product_fit_id: integer("product_fit_id").references(() => product_fits.id, { onDelete: "cascade" }),
  product_pattern_id: integer("product_pattern_id").references(() => product_patterns.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
});

/* Product Reviews Table */
export const product_reviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  order_id: integer("order_id").references(() => orders.id, { onDelete: "set null" }), // Optional: link to order if review is from purchase
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }), // Optional review title
  comment: text("comment"), // Review comment/description
  is_verified_purchase: boolean("is_verified_purchase").default(false).notNull(), // Whether reviewer purchased the product
  is_approved: boolean("is_approved").default(false).notNull(), // Admin approval flag for moderation
  helpful_count: integer("helpful_count").default(0).notNull(), // Number of users who found this helpful
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  unique("unique_user_product_review").on(table.user_id, table.product_id) // One review per user per product
]);
