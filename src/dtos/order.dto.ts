import { z } from "zod";

export const CreateOrderDTO = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  reseller_id: z.number().int().positive().optional(),
  share_link_code: z.string().optional()
});

export const OrderListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional()
});

export type CreateOrderInput = z.infer<typeof CreateOrderDTO>;
export type OrderListInput = z.infer<typeof OrderListDTO>;

