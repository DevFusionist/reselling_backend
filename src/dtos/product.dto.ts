import { z } from "zod";

// Image attribute mapping schema for associating images with specific attributes
// Supports both single values and arrays (for multiple attributes per image)
const ImageAttributeMappingSchema = z.object({
  color: z.union([z.string(), z.array(z.string())]).optional(),
  size: z.union([z.string(), z.array(z.string())]).optional(),
  material: z.union([z.string(), z.array(z.string())]).optional(),
  style: z.union([z.string(), z.array(z.string())]).optional(),
  fit: z.union([z.string(), z.array(z.string())]).optional(),
  pattern: z.union([z.string(), z.array(z.string())]).optional(),
}).optional();

// Image with optional attribute mappings
const ImageWithAttributesSchema = z.union([
  z.string().url(), // Simple URL string (backward compatibility)
  z.object({
    url: z.string().url(),
    attributes: ImageAttributeMappingSchema,
  }),
]);

export const CreateProductDTO = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  base_price: z.number().positive(),
  reseller_price: z.number().positive().optional(),
  retail_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().default(0),
  image_urls: z.array(z.string().url()).optional(), // Legacy: simple array of URLs
  images: z.array(ImageWithAttributesSchema).optional(), // New: images with attribute mappings
  category: z.string().optional(), // Single value
  sub_category: z.string().optional(), // Single value
  brands: z.array(z.string()).optional(), // Multiple values allowed
  model: z.string().optional(), // Single value
  colors: z.array(z.string()).optional(), // Multiple values allowed
  sizes: z.array(z.string()).optional(), // Multiple values allowed
  materials: z.array(z.string()).optional(), // Multiple values allowed
  styles: z.array(z.string()).optional(), // Multiple values allowed
  fits: z.array(z.string()).optional(), // Multiple values allowed
  patterns: z.array(z.string()).optional(), // Multiple values allowed
  // Legacy support - single values (will be converted to arrays)
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  style: z.string().optional(),
  fit: z.string().optional(),
  pattern: z.string().optional(),
  is_featured: z.boolean().optional().default(false)
});

export const UpdateProductDTO = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  base_price: z.number().positive().optional(),
  reseller_price: z.number().positive().optional(),
  retail_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(), // Legacy: single image URL
  image_urls: z.array(z.string().url()).optional(), // Legacy: simple array of URLs
  images: z.array(ImageWithAttributesSchema).optional(), // New: images with attribute mappings
  category: z.string().optional(), // Single value
  sub_category: z.string().optional(), // Single value
  brands: z.array(z.string()).optional(), // Multiple values allowed
  model: z.string().optional(), // Single value
  colors: z.array(z.string()).optional(), // Multiple values allowed
  sizes: z.array(z.string()).optional(), // Multiple values allowed
  materials: z.array(z.string()).optional(), // Multiple values allowed
  styles: z.array(z.string()).optional(), // Multiple values allowed
  fits: z.array(z.string()).optional(), // Multiple values allowed
  patterns: z.array(z.string()).optional(), // Multiple values allowed
  // Legacy support - single values (will be converted to arrays)
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  style: z.string().optional(),
  fit: z.string().optional(),
  pattern: z.string().optional(),
  is_featured: z.boolean().optional()
});

export const ProductListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  // Filtering
  category: z.string().optional(),
  sub_category: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  style: z.string().optional(),
  is_featured: z.coerce.boolean().optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  in_stock: z.coerce.boolean().optional(), // true = only products with stock > 0
  // Sorting
  sort_by: z.enum(["created_at", "base_price", "title", "stock"]).optional().default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc")
});

export const BulkDeleteProductDTO = z.object({
  product_ids: z.array(z.number().int().positive()).min(1, "At least one product ID is required").max(100, "Cannot delete more than 100 products at once")
});

export type CreateProductInput = z.infer<typeof CreateProductDTO>;
export type UpdateProductInput = z.infer<typeof UpdateProductDTO>;
export type ProductListInput = z.infer<typeof ProductListDTO>;
export type BulkDeleteProductInput = z.infer<typeof BulkDeleteProductDTO>;

