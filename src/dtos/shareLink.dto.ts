import { z } from "zod";

export const CreateShareLinkDTO = z.object({
  product_id: z.number().int().positive(),
  margin_amount: z.number().nonnegative(),
  expires_in_days: z.number().int().positive().optional() // Optional expiry in days
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkDTO>;

