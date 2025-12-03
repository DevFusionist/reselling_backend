import { z } from "zod";

export const CreateProductDTO = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  base_price: z.number().positive(),
  reseller_price: z.number().positive().optional(),
  retail_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().default(0),
  image_urls: z.array(z.string().url()).optional()
});

export const UpdateProductDTO = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  base_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional()
});

export const ProductListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional()
});

export type CreateProductInput = z.infer<typeof CreateProductDTO>;
export type UpdateProductInput = z.infer<typeof UpdateProductDTO>;
export type ProductListInput = z.infer<typeof ProductListDTO>;

