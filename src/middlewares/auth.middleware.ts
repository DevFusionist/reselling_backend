import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { failure } from "../utils/apiResponse";

export interface AuthUser {
  sub: number;
  role: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authRequired(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(failure("Unauthorized", "UNAUTHORIZED"), 401);
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
      return c.json(failure("Invalid token payload", "UNAUTHORIZED"), 401);
    }
    const payload = decoded as { sub: number | string; role?: string };
    if (!payload.sub || !payload.role) {
      return c.json(failure("Invalid token payload", "UNAUTHORIZED"), 401);
    }
    const userId = typeof payload.sub === "string" ? parseInt(payload.sub, 10) : payload.sub;
    if (isNaN(userId)) {
      return c.json(failure("Invalid user ID in token", "UNAUTHORIZED"), 401);
    }
    c.set("user", { sub: userId, role: payload.role });
    await next();
  } catch (err) {
    console.log("error -- ", err)
    return c.json(failure("Invalid or expired token", "UNAUTHORIZED"), 401);
  }
}

export async function resellerOnly(c: Context, next: Next) {
  const user = c.get("user");
  if (!user || (user.role !== "reseller" && user.role !== "admin")) {
    return c.json(failure("Reseller access required", "FORBIDDEN"), 403);
  }
  await next();
}

export async function adminOnly(c: Context, next: Next) {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json(failure("Admin access required", "FORBIDDEN"), 403);
  }
  await next();
}

