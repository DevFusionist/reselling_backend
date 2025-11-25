import { z } from "zod";

export const SignupDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin","customer","reseller"]).optional().default("customer")
});

export const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type SignupInput = z.infer<typeof SignupDTO>;
export type LoginInput = z.infer<typeof LoginDTO>;
