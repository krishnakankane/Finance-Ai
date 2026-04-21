import { Router, type IRouter } from "express";
import { db, transactionsTable, budgetsTable, notificationsTable } from "@workspace/db";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  CategorizeTransactionBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { categorizeDescription } from "../lib/ai";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { category, type, search, startDate, endDate, limit } = req.query as Record<string, string | undefined>;

  const conditions = [eq(transactionsTable.userId, userId)];
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (startDate) conditions.push(gte(transactionsTable.date, new Date(startDate)));
  if (endDate) conditions.push(lte(transactionsTable.date, new Date(endDate)));
  if (search) conditions.push(ilike(transactionsTable.description, `%${search}%`));

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.date))
    .limit(limit ? Math.min(Number(limit), 500) : 200);

  res.json(rows);
});

async function checkBudgetAndNotify(userId: string, category: string, date: Date) {
  const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const budget = await db
    .select()
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.category, category), eq(budgetsTable.month, month)))
    .limit(1);
  if (budget.length === 0) return;

  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  const spentRow = await db
    .select({ total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.category, category),
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, monthStart),
        lte(transactionsTable.date, monthEnd),
      ),
    );
  const spent = spentRow[0]?.total ?? 0;
  const limit = budget[0]!.amount;
  if (limit > 0 && spent >= limit * 0.8) {
    const pct = Math.round((spent / limit) * 100);
    await db.insert(notificationsTable).values({
      userId,
      title: spent >= limit ? `Over budget: ${category}` : `Budget alert: ${category}`,
      message:
        spent >= limit
          ? `You have exceeded your ${category} budget for ${month}.`
          : `You've used ${pct}% of your ${category} budget for ${month}.`,
      type: spent >= limit ? "danger" : "warning",
    });
  }
}

router.post("/transactions", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const body = CreateTransactionBody.parse(req.body);
  const date = body.date ? new Date(body.date) : new Date();
  const inserted = await db
    .insert(transactionsTable)
    .values({
      userId,
      amount: body.amount,
      type: body.type,
      category: body.category,
      description: body.description ?? "",
      date,
    })
    .returning();
  if (body.type === "expense") {
    await checkBudgetAndNotify(userId, body.category, date);
  }
  res.status(201).json(inserted[0]);
});

router.patch("/transactions/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  const body = UpdateTransactionBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.type !== undefined) updates.type = body.type;
  if (body.category !== undefined) updates.category = body.category;
  if (body.description !== undefined) updates.description = body.description;
  if (body.date !== undefined) updates.date = new Date(body.date);
  const updated = await db
    .update(transactionsTable)
    .set(updates)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated[0]);
});

router.delete("/transactions/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  await db
    .delete(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));
  res.status(204).end();
});

router.post("/transactions/categorize", requireAuth, async (req, res) => {
  const body = CategorizeTransactionBody.parse(req.body);
  try {
    const category = await categorizeDescription(body.description);
    res.json({ category });
  } catch {
    res.json({ category: "Others" });
  }
});

export default router;
