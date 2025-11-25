import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { SignupInput, LoginInput } from "../dtos/auth.dto";
import { JWT_SECRET, JWT_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS } from "../config";
import { v4 as uuidv4 } from "uuid";
import { tokenRepo } from "../repositories/token.repo";
import { createHash } from 'crypto';

function sha256Hash(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

export const authService = {
  async signup(input: SignupInput) {
    const existing = await db.select().from(users).where(eq(users.email, input.email));
    if (existing.length) throw { status: 400, message: "Email already registered" };
    const password_hash = await bcrypt.hash(input.password, 10);
    const [user] = await db.insert(users).values({ email: input.email, password_hash, role: input.role }).returning();
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY } as SignOptions);
    const refreshTokenPlain = uuidv4();
    const refreshHash = sha256Hash(refreshTokenPlain);
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await tokenRepo.save(user.id, refreshHash, expires);
    return { accessToken, refreshToken: refreshTokenPlain };
  },

  async login(input: LoginInput) {
    const [user] = await db.select().from(users).where(eq(users.email, input.email));
    if (!user) throw { status: 401, message: "Invalid credentials" };
    const ok = await bcrypt.compare(input.password, (user as any).password_hash);
    if (!ok) throw { status: 401, message: "Invalid credentials" };
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY } as SignOptions);
    const refreshTokenPlain = uuidv4();
    const refreshHash = sha256Hash(refreshTokenPlain);
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await tokenRepo.save(user.id, refreshHash, expires);
    return { accessToken, refreshToken: refreshTokenPlain };
  },

  async refresh(refreshTokenPlain: string) {
    const refreshHash = sha256Hash(refreshTokenPlain);
    const row = await tokenRepo.findByHash(refreshHash);
    if (!row || row.revoked) throw { status: 401, message: "Invalid refresh token" };
    if (row.expires_at && new Date(row.expires_at) < new Date()) throw { status: 401, message: "Refresh token expired" };
    // rotate: revoke old and issue new
    await tokenRepo.revokeByHash(refreshHash);
    const [user] = await db.select().from(users).where(eq(users.id, row.user_id));
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY } as SignOptions);
    const newPlain = uuidv4();
    const newHash = sha256Hash(newPlain);
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await tokenRepo.save(user.id, newHash, expires);
    return { accessToken, refreshToken: newPlain };
  },

  async logout(refreshTokenPlain: string) {
    const refreshHash = sha256Hash(refreshTokenPlain);
    await tokenRepo.revokeByHash(refreshHash);
  }
};
