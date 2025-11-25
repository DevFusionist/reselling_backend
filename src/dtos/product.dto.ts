import { z } from "zod";

export const CreateProductDTO = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  base_price: z.number().positive(),
  stock: z.number().int().nonnegative().default(0)
});

export const UpdateProductDTO = z.object({
  sku: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  base_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional()
});

export const ProductListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional()
});

export type CreateProductInput = z.infer<typeof CreateProductDTO>;
export type UpdateProductInput = z.infer<typeof UpdateProductDTO>;
export type ProductListInput = z.infer<typeof ProductListDTO>;

