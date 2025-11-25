import { Context } from "hono";

export async function responseMiddleware(c: Context, next: () => Promise<void>) {
  await next();
  c.header("Content-Type", "application/json");
}
