import { pgTable, serial, varchar, text, numeric, integer, timestamp, unique, foreignKey, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	sku: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	stock: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	razorpayOrderId: varchar("razorpay_order_id", { length: 128 }),
	razorpayPaymentId: varchar("razorpay_payment_id", { length: 128 }),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('INR').notNull(),
	status: varchar({ length: 50 }).default('created').notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	internalReceiptId: varchar("internal_receipt_id", { length: 128 }).notNull(),
}, (table) => [
	unique("payments_razorpay_order_id_unique").on(table.razorpayOrderId),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 50 }).default('customer').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const shareLinks = pgTable("share_links", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	creatorId: integer("creator_id").notNull(),
	marginAmount: numeric("margin_amount", { precision: 10, scale:  2 }).notNull(),
	code: varchar({ length: 128 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "share_links_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "share_links_creator_id_users_id_fk"
		}).onDelete("cascade"),
	unique("share_links_code_unique").on(table.code),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 512 }).notNull(),
	revoked: boolean().default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("refresh_tokens_token_hash_unique").on(table.tokenHash),
]);

export const resellerMarkups = pgTable("reseller_markups", {
	id: serial().primaryKey().notNull(),
	resellerId: integer("reseller_id").notNull(),
	productId: integer("product_id").notNull(),
	markupAmount: numeric("markup_amount", { precision: 10, scale:  2 }).notNull(),
	uniqueKey: varchar("unique_key", { length: 128 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.resellerId],
			foreignColumns: [users.id],
			name: "reseller_markups_reseller_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reseller_markups_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("unique_reseller_product").on(table.resellerId, table.productId),
	unique("reseller_markups_unique_key_unique").on(table.uniqueKey),
]);

export const payouts = pgTable("payouts", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	paymentId: integer("payment_id").notNull(),
	resellerId: integer("reseller_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	razorpayPayoutId: varchar("razorpay_payout_id", { length: 128 }),
	beneficiaryAccountId: varchar("beneficiary_account_id", { length: 128 }),
	fundAccountId: varchar("fund_account_id", { length: 128 }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payouts_payment_id_payments_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.resellerId],
			foreignColumns: [users.id],
			name: "payouts_reseller_id_users_id_fk"
		}).onDelete("restrict"),
]);
