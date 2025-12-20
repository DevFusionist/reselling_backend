CREATE TABLE "product_image_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_image_id" integer NOT NULL,
	"product_color_id" integer,
	"product_size_id" integer,
	"product_material_id" integer,
	"product_style_id" integer,
	"product_fit_id" integer,
	"product_pattern_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_image_id_product_images_id_fk" FOREIGN KEY ("product_image_id") REFERENCES "public"."product_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_color_id_product_colors_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_size_id_product_sizes_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_sizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_material_id_product_materials_id_fk" FOREIGN KEY ("product_material_id") REFERENCES "public"."product_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_style_id_product_styles_id_fk" FOREIGN KEY ("product_style_id") REFERENCES "public"."product_styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_fit_id_product_fits_id_fk" FOREIGN KEY ("product_fit_id") REFERENCES "public"."product_fits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_attributes" ADD CONSTRAINT "product_image_attributes_product_pattern_id_product_patterns_id_fk" FOREIGN KEY ("product_pattern_id") REFERENCES "public"."product_patterns"("id") ON DELETE cascade ON UPDATE no action;