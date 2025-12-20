ALTER TABLE "sub_categories" DROP CONSTRAINT "sub_categories_name_unique";--> statement-breakpoint
ALTER TABLE "sub_categories" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_categories" ADD CONSTRAINT "unique_category_sub_category" UNIQUE("category_id","name");