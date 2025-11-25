import { Context } from "hono";
import { log } from "../utils/logger";
import { failure } from "../utils/apiResponse";

export async function errorMiddleware(c: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (err: any) {
    log.error(err);
    const status = err?.status || 500;
    const message = err?.message || "Internal Server Error";
    return c.json(failure(message, err?.code || "INTERNAL_ERROR"), status);
  }
}
