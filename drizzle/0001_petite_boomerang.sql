ALTER TABLE "products" ADD COLUMN "reseller_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "retail_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";