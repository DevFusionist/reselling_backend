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
  product_images,
  order_items,
  product_reviews,
  categories,
  sub_categories,
  brands,
  colors,
  sizes,
  materials,
  styles,
  fits,
  patterns,
  product_categories,
  product_sub_categories,
  product_brands,
  product_colors,
  product_sizes,
  product_materials,
  product_styles,
  product_fits,
  product_patterns,
  product_image_attributes,
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
  // One-to-many: User can write many reviews
  reviews: many(product_reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  // One-to-many: Product can be in many orders
  orders: many(orders),
  // One-to-many: Product can have many markups
  markups: many(reseller_markups),
  // One-to-many: Product can have many share links
  shareLinks: many(share_links),
  // One-to-many: Product can have many images
  images: many(product_images),
  // One-to-many: Product can have many reviews
  reviews: many(product_reviews),
  // Many-to-many: Product attributes
  categories: many(product_categories),
  subCategories: many(product_sub_categories),
  brands: many(product_brands),
  colors: many(product_colors),
  sizes: many(product_sizes),
  materials: many(product_materials),
  styles: many(product_styles),
  fits: many(product_fits),
  patterns: many(product_patterns),
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
  shareLink: one(share_links, {
    fields: [orders.share_link_id],
    references: [share_links.id],
  }),
  items: many(order_items),
  payments: many(payments),
  payouts: many(payouts),
}));

export const orderItemsRelations = relations(order_items, ({ one }) => ({
  order: one(orders, {
    fields: [order_items.order_id],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [order_items.product_id],
    references: [products.id],
  }),
  shareLink: one(share_links, {
    fields: [order_items.share_link_id],
    references: [share_links.id],
  }),
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

export const productImagesRelations = relations(product_images, ({ one, many }) => ({
  product: one(products, {
    fields: [product_images.product_id],
    references: [products.id],
  }),
  attributeMappings: many(product_image_attributes),
}));

/* Attribute Table Relations */
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(product_categories),
  subCategories: many(sub_categories),
}));

export const subCategoriesRelations = relations(sub_categories, ({ one, many }) => ({
  category: one(categories, {
    fields: [sub_categories.category_id],
    references: [categories.id],
  }),
  products: many(product_sub_categories),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(product_brands),
}));

export const colorsRelations = relations(colors, ({ many }) => ({
  products: many(product_colors),
}));

export const sizesRelations = relations(sizes, ({ many }) => ({
  products: many(product_sizes),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  products: many(product_materials),
}));

export const stylesRelations = relations(styles, ({ many }) => ({
  products: many(product_styles),
}));

export const fitsRelations = relations(fits, ({ many }) => ({
  products: many(product_fits),
}));

export const patternsRelations = relations(patterns, ({ many }) => ({
  products: many(product_patterns),
}));

/* Mapping Table Relations */
export const productCategoriesRelations = relations(product_categories, ({ one }) => ({
  product: one(products, {
    fields: [product_categories.product_id],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [product_categories.category_id],
    references: [categories.id],
  }),
}));

export const productSubCategoriesRelations = relations(product_sub_categories, ({ one }) => ({
  product: one(products, {
    fields: [product_sub_categories.product_id],
    references: [products.id],
  }),
  subCategory: one(sub_categories, {
    fields: [product_sub_categories.sub_category_id],
    references: [sub_categories.id],
  }),
}));

export const productBrandsRelations = relations(product_brands, ({ one }) => ({
  product: one(products, {
    fields: [product_brands.product_id],
    references: [products.id],
  }),
  brand: one(brands, {
    fields: [product_brands.brand_id],
    references: [brands.id],
  }),
}));

export const productColorsRelations = relations(product_colors, ({ one }) => ({
  product: one(products, {
    fields: [product_colors.product_id],
    references: [products.id],
  }),
  color: one(colors, {
    fields: [product_colors.color_id],
    references: [colors.id],
  }),
}));

export const productSizesRelations = relations(product_sizes, ({ one }) => ({
  product: one(products, {
    fields: [product_sizes.product_id],
    references: [products.id],
  }),
  size: one(sizes, {
    fields: [product_sizes.size_id],
    references: [sizes.id],
  }),
}));

export const productMaterialsRelations = relations(product_materials, ({ one }) => ({
  product: one(products, {
    fields: [product_materials.product_id],
    references: [products.id],
  }),
  material: one(materials, {
    fields: [product_materials.material_id],
    references: [materials.id],
  }),
}));

export const productStylesRelations = relations(product_styles, ({ one }) => ({
  product: one(products, {
    fields: [product_styles.product_id],
    references: [products.id],
  }),
  style: one(styles, {
    fields: [product_styles.style_id],
    references: [styles.id],
  }),
}));

export const productFitsRelations = relations(product_fits, ({ one }) => ({
  product: one(products, {
    fields: [product_fits.product_id],
    references: [products.id],
  }),
  fit: one(fits, {
    fields: [product_fits.fit_id],
    references: [fits.id],
  }),
}));

export const productPatternsRelations = relations(product_patterns, ({ one }) => ({
  product: one(products, {
    fields: [product_patterns.product_id],
    references: [products.id],
  }),
  pattern: one(patterns, {
    fields: [product_patterns.pattern_id],
    references: [patterns.id],
  }),
}));

/* Product Image Attributes Relations */
export const productImageAttributesRelations = relations(product_image_attributes, ({ one }) => ({
  productImage: one(product_images, {
    fields: [product_image_attributes.product_image_id],
    references: [product_images.id],
  }),
  productColor: one(product_colors, {
    fields: [product_image_attributes.product_color_id],
    references: [product_colors.id],
  }),
  productSize: one(product_sizes, {
    fields: [product_image_attributes.product_size_id],
    references: [product_sizes.id],
  }),
  productMaterial: one(product_materials, {
    fields: [product_image_attributes.product_material_id],
    references: [product_materials.id],
  }),
  productStyle: one(product_styles, {
    fields: [product_image_attributes.product_style_id],
    references: [product_styles.id],
  }),
  productFit: one(product_fits, {
    fields: [product_image_attributes.product_fit_id],
    references: [product_fits.id],
  }),
  productPattern: one(product_patterns, {
    fields: [product_image_attributes.product_pattern_id],
    references: [product_patterns.id],
  }),
}));

/* Product Reviews Relations */
export const productReviewsRelations = relations(product_reviews, ({ one }) => ({
  product: one(products, {
    fields: [product_reviews.product_id],
    references: [products.id],
  }),
  user: one(users, {
    fields: [product_reviews.user_id],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [product_reviews.order_id],
    references: [orders.id],
  }),
}));

