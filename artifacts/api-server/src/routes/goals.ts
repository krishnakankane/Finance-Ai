import { Router, type IRouter } from "express";
import { db, goalsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateGoalBody, UpdateGoalBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/goals", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const rows = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId))
    .orderBy(desc(goalsTable.createdAt));
  res.json(rows);
});

router.post("/goals", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const body = CreateGoalBody.parse(req.body);
  const inserted = await db
    .insert(goalsTable)
    .values({
      userId,
      name: body.name,
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount ?? 0,
      deadline: body.deadline ? new Date(body.deadline) : null,
    })
    .returning();
  res.status(201).json(inserted[0]);
});

router.patch("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  const body = UpdateGoalBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.targetAmount !== undefined) updates.targetAmount = body.targetAmount;
  if (body.currentAmount !== undefined) updates.currentAmount = body.currentAmount;
  if (body.deadline !== undefined) updates.deadline = body.deadline ? new Date(body.deadline) : null;
  const updated = await db
    .update(goalsTable)
    .set(updates)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated[0]);
});

router.delete("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.status(204).end();
});

export default router;
