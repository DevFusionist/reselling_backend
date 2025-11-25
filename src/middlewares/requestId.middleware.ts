import { Context } from "hono";
import { v4 as uuidv4 } from "uuid";

export async function requestIdMiddleware(c: Context, next: () => Promise<void>) {
  const id = c.req.header("x-request-id") || uuidv4();
  c.header("x-request-id", id);
  (c as any).requestId = id;
  await next();
}
