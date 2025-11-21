import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import Redis from "ioredis";

const LUA = `
redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, ARGV[1] - ARGV[2])
redis.call("ZADD", KEYS[1], ARGV[1], ARGV[1])
local cnt = redis.call("ZCARD", KEYS[1])
local earliest = redis.call("ZRANGE", KEYS[1], 0, 0)[1] or ARGV[1]
redis.call("PEXPIRE", KEYS[1], ARGV[2])
return { tostring(cnt), tostring(earliest) }
`;

export const slidingRateLimiter = (override?: { windowMs?: number; max?: number }) => {
  const windowMs = override?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS) ?? 60000;
  const max = override?.max ?? Number(process.env.RATE_LIMIT_MAX) ?? 120;
  const prefix = "rl";

  let redisClient: Redis | null = null;
  let shaPromise: Promise<string | null> | null = null;
  let rateLimitingActive = false;

  try {
    redisClient = container.resolve("RedisClient");
    // load script once per process, but handle errors
    if (redisClient) {
      shaPromise = redisClient.script("LOAD", LUA)
        .then((sha: unknown) => {
          rateLimitingActive = true;
          console.log(`✅ Rate limiting ACTIVE - Window: ${windowMs}ms, Max: ${max} requests`);
          return sha as string;
        })
        .catch(() => {
          console.log("⚠️  Rate limiting DISABLED - Redis script loading failed");
          return null as string | null;
        });
    }
  } catch (err) {
    console.log("⚠️  Rate limiting DISABLED - Redis client not available");
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    // If Redis is not available, skip rate limiting
    if (!redisClient || !shaPromise) {
      return next();
    }

    try {
      const id = (req as any).user?._id ? String((req as any).user._id) : req.ip;
      const key = `${prefix}:${id}`;
      const now = Date.now();
      const sha = await shaPromise;
      if (!sha) {
        // Script not loaded, skip rate limiting
        return next();
      }
      const result = await redisClient.evalsha(sha, 1, key, now, windowMs, max) as [string, string];
      const count = parseInt(result[0],10);
      const earliest = parseInt(result[1]||String(now),10);
      const resetMs = earliest + windowMs;
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - count)));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetMs/1000)));
      
      // Log rate limit status (only when approaching limit to avoid spam)
      if (count > max * 0.8) {
        console.log(`[Rate Limit] ${id}: ${count}/${max} requests (${Math.max(0, max - count)} remaining)`);
      }
      
      if (count > max) {
        console.log(`[Rate Limit] ❌ BLOCKED - ${id} exceeded limit: ${count}/${max}`);
        return res.status(429).json({ message: "Too many requests" });
      }
      next();
    } catch (err) {
      // Redis error, allow request through
      console.log("⚠️  Rate limiting error (allowing request):", err);
      next();
    }
  };
};
