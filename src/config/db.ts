import mongoose from "mongoose";
import logger from "../utils/logger";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/reseller_db";
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      socketTimeoutMS: 2000,
    });
    logger.info("MongoDB connected");
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("connect")) {
      logger.warn("MongoDB connection refused. Make sure MongoDB is running.");
      logger.warn("Server will continue but database operations will fail.");
    } else {
      logger.error("MongoDB connection error:", errorMsg);
    }
    // Don't throw - allow server to start without MongoDB for development
    // In production, you might want to throw here
  }

  // Handle connection events
  mongoose.connection.on("error", (err) => {
    const errMsg = err?.message || String(err);
    if (!errMsg.includes("ECONNREFUSED") && !errMsg.includes("connect")) {
      logger.warn("MongoDB error:", errMsg);
    }
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
};
