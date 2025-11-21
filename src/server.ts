import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import session from "express-session";
import RedisStore from "connect-redis";
import Redis from "ioredis";
import path from "path";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";

import { slidingRateLimiter } from "./middlewares/slidingRateLimiter";
import { getRouteRateLimit } from "./middlewares/routeRateLimit";

import { createContainer } from "./utils/container";
import { connectDB } from "./config/db";
import logger from "./utils/logger";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import resellerRoutes from "./routes/reseller";
import orderRoutes from "./routes/orders";
import paymentRoutes from "./routes/payments";

const app = express();

/* Redis */
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 0,
  retryStrategy: (times) => {
    // Stop retrying after 2 attempts
    if (times > 2) {
      return null;
    }
    return Math.min(times * 100, 1000);
  },
  enableOfflineQueue: true,
  connectTimeout: 2000,
  lazyConnect: false,
  showFriendlyErrorStack: false
});

// Track Redis connection status
let redisConnected = false;
let redisReady = false;

// Handle Redis errors gracefully to prevent unhandled errors
redisClient.on("error", (err: any) => {
  const errMsg = err?.message || String(err);
  if (errMsg.includes("ECONNREFUSED") || errMsg.includes("connect")) {
    redisConnected = false;
    redisReady = false;
    // Only log once to avoid spam
    if (!redisConnected) {
      logger.warn("❌ Redis connection failed - Rate limiting is DISABLED");
    }
  } else if (!errMsg.includes("AggregateError")) {
    logger.warn("Redis error:", errMsg);
  }
});

redisClient.on("connect", () => {
  redisConnected = true;
  logger.info("✅ Redis connected successfully");
});

redisClient.on("ready", () => {
  redisReady = true;
  logger.info("✅ Redis ready - Rate limiting is ACTIVE");
});

redisClient.on("close", () => {
  // Suppress close events during startup failures
});

redisClient.on("end", () => {
  // Suppress end events
});

redisClient.on("reconnecting", () => {
  // Suppress reconnecting events
});

const redisStore = new RedisStore({ client: redisClient, prefix: "sess:" });

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || "session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24*60*60*1000 }
}));

/* security + parsers */
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xssClean());
app.use(compression());
app.use(express.json({ limit: "10kb" }));

/* DI container must be registered before limiter */
createContainer({ redisClient });

/* global limiter */
app.use(slidingRateLimiter());

/* swagger */
const swaggerDocument = YAML.load(path.join(__dirname, "./docs/openapi.yaml"));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* routes */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reseller", resellerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

/* auto-apply route-level limits */
import { applyRouteLevelRateLimits } from "./utils/routeHelpers";
setImmediate(() => applyRouteLevelRateLimits(app));

// Helper function to check Redis status
const checkRedisStatus = async (): Promise<{ connected: boolean; ready: boolean; ping?: string }> => {
  const status = {
    connected: redisClient.status === "ready" || redisClient.status === "connect",
    ready: redisReady,
  };
  
  if (status.connected) {
    try {
      const pingResult = await redisClient.ping();
      return { ...status, ping: pingResult };
    } catch (err) {
      return { ...status, ping: "error" };
    }
  }
  return status;
};

app.get("/health", async (req, res) => {
  const redisStatus = await checkRedisStatus();
  res.json({ 
    status: "ok",
    services: {
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      redis: redisStatus.ready ? "connected" : redisStatus.connected ? "connecting" : "disconnected",
      rateLimiting: redisStatus.ready ? "active" : "disabled"
    },
    redis: redisStatus
  });
});

app.use((err:any, req:any, res:any, next:any) => {
  logger.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await connectDB();
    // Only seed if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const { seed } = await import("./utils/seed");
      await seed();
    }
  } catch (err) {
    logger.warn("Database initialization error (server will continue):", err);
  }
  
  // Check Redis status after a short delay
  setTimeout(async () => {
    const redisStatus = await checkRedisStatus();
    if (redisStatus.ready) {
      logger.info("✅ Redis is ready - Rate limiting is ACTIVE");
    } else if (redisStatus.connected) {
      logger.warn("⚠️  Redis is connecting but not ready yet");
    } else {
      logger.warn("❌ Redis is not connected - Rate limiting is DISABLED");
      logger.warn("   Start Redis with: redis-server (or your Redis service)");
    }
  }, 1000);

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⚠️  MongoDB is not connected - database operations will fail");
    }
  });
})();
