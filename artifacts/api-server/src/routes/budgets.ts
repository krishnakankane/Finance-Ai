import { Router, type IRouter } from "express";
import { db, budgetsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { UpsertBudgetBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/budgets", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = (req.query.month as string | undefined) ?? undefined;
  const conditions = [eq(budgetsTable.userId, userId)];
  if (month) conditions.push(eq(budgetsTable.month, month));
  const rows = await db.select().from(budgetsTable).where(and(...conditions));
  res.json(rows);
});

router.post("/budgets", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const body = UpsertBudgetBody.parse(req.body);
  const result = await db
    .insert(budgetsTable)
    .values({ userId, category: body.category, amount: body.amount, month: body.month })
    .onConflictDoUpdate({
      target: [budgetsTable.userId, budgetsTable.category, budgetsTable.month],
      set: { amount: body.amount },
    })
    .returning();
  res.json(result[0]);
});

router.delete("/budgets/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  await db.delete(budgetsTable).where(and(eq(budgetsTable.id, id), eq(budgetsTable.userId, userId)));
  res.status(204).end();
});

export default router;
