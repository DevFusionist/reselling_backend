import { db } from "../db";
import { refresh_tokens } from "../db/schema";
import { eq } from "drizzle-orm";

export const tokenRepo = {
  async save(user_id: number, token_hash: string, expires_at: Date) {
    const [row] = await db.insert(refresh_tokens).values({ user_id, token_hash, expires_at }).returning();
    return row;
  },
  async revokeByHash(token_hash: string) {
    await db.update(refresh_tokens).set({ revoked: true }).where(eq(refresh_tokens.token_hash, token_hash));
  },
  async findByHash(token_hash: string) {
    const [row] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token_hash, token_hash));
    return row;
  },
  async revokeByUser(user_id: number) {
    await db.update(refresh_tokens).set({ revoked: true }).where(eq(refresh_tokens.user_id, user_id));
  },
  async revokeAllByUser(user_id: number) {
    await db.delete(refresh_tokens).where(eq(refresh_tokens.user_id, user_id));
  }
};
