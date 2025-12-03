export const PORT = Number(process.env.PORT || 4000);
export const NODE_ENV = process.env.NODE_ENV || "development";
export const JWT_SECRET: string = process.env.JWT_SECRET || "replace_me";
export const JWT_EXPIRY: string = process.env.JWT_EXPIRY || "15m";
export const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS || 30);

// Razorpay Config
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

// Cloudflare R2 Config
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID 
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
export const R2_ENDPOINT = process.env.R2_ENDPOINT
export const R2_PUBLIC_URL = process.env.PUBLIC_DEVELOPMENT_URL