CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_product_review" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address_line1" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address_line2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_city" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_state" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_country" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address_line1" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address_line2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_city" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_state" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_country" varchar(100);--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;