import { z } from "zod";

export const SetMarkupDTO = z.object({
  product_id: z.number().int().positive(),
  markup_amount: z.number().nonnegative()
});

export const MarkupListDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export type SetMarkupInput = z.infer<typeof SetMarkupDTO>;
export type MarkupListInput = z.infer<typeof MarkupListDTO>;

