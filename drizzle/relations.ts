import { relations } from "drizzle-orm/relations";
import { products, shareLinks, users, refreshTokens, resellerMarkups, payments, payouts } from "./schema";

export const shareLinksRelations = relations(shareLinks, ({one}) => ({
	product: one(products, {
		fields: [shareLinks.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [shareLinks.creatorId],
		references: [users.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	shareLinks: many(shareLinks),
	resellerMarkups: many(resellerMarkups),
}));

export const usersRelations = relations(users, ({many}) => ({
	shareLinks: many(shareLinks),
	refreshTokens: many(refreshTokens),
	resellerMarkups: many(resellerMarkups),
	payouts: many(payouts),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const resellerMarkupsRelations = relations(resellerMarkups, ({one}) => ({
	user: one(users, {
		fields: [resellerMarkups.resellerId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [resellerMarkups.productId],
		references: [products.id]
	}),
}));

export const payoutsRelations = relations(payouts, ({one}) => ({
	payment: one(payments, {
		fields: [payouts.paymentId],
		references: [payments.id]
	}),
	user: one(users, {
		fields: [payouts.resellerId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({many}) => ({
	payouts: many(payouts),
}));