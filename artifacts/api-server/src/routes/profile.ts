import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

async function ensureProfile(userId: string) {
  const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0]!;
  const inserted = await db
    .insert(profilesTable)
    .values({ userId, currency: "USD", monthlyIncome: 0 })
    .returning();
  return inserted[0]!;
}

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await ensureProfile(userId);
  res.json(profile);
});

router.patch("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const body = UpdateProfileBody.parse(req.body);
  await ensureProfile(userId);
  const updated = await db
    .update(profilesTable)
    .set({
      ...(body.displayName !== undefined ? { displayName: body.displayName ?? null } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.monthlyIncome !== undefined ? { monthlyIncome: body.monthlyIncome } : {}),
    })
    .where(eq(profilesTable.userId, userId))
    .returning();
  res.json(updated[0]);
});

export default router;
