import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/reports/monthly", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const months = Math.max(1, Math.min(24, Number(req.query.months ?? 6)));
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const monthlyRows = await db
    .select({
      month: sql<string>`to_char(${transactionsTable.date}, 'YYYY-MM')`,
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), gte(transactionsTable.date, start)))
    .groupBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM')`, transactionsTable.type)
    .orderBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM')`);

  const map = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    map.set(key, { income: 0, expense: 0 });
  }
  for (const r of monthlyRows) {
    const m = map.get(r.month) ?? { income: 0, expense: 0 };
    if (r.type === "income") m.income = r.total;
    else if (r.type === "expense") m.expense = r.total;
    map.set(r.month, m);
  }

  const categoryRows = await db
    .select({
      category: transactionsTable.category,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, start),
      ),
    )
    .groupBy(transactionsTable.category);

  res.json({
    monthlySpend: Array.from(map.entries()).map(([month, v]) => ({ month, ...v })),
    categoryBreakdown: categoryRows.map((r) => ({ category: r.category, amount: r.total })),
  });
});

router.get("/reports/weekly", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char(${transactionsTable.date}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, start),
      ),
    )
    .groupBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM-DD')`);

  const map = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  for (const r of rows) map.set(r.day, r.total);

  const days = Array.from(map.entries()).map(([day, amount]) => ({ day, amount }));
  const totalSpent = days.reduce((s, d) => s + d.amount, 0);
  res.json({ days, totalSpent });
});

export default router;
