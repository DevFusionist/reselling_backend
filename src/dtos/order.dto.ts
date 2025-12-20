import { z } from "zod";

export const CreateOrderItemDTO = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  reseller_id: z.number().int().positive().optional(),
  share_link_code: z.string().optional()
});

export const AddressDTO = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1).default("India"),
});

export const CreateOrderDTO = z.object({
  items: z.array(CreateOrderItemDTO).min(1, "At least one item is required"),
  shipping_address: AddressDTO,
  billing_address: AddressDTO.optional(), // If not provided, will use shipping_address
});

export const OrderListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional()
});

export type CreateOrderInput = z.infer<typeof CreateOrderDTO>;
export type CreateOrderItemInput = z.infer<typeof CreateOrderItemDTO>;
export type OrderListInput = z.infer<typeof OrderListDTO>;

