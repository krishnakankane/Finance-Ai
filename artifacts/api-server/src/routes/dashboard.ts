import { Router, type IRouter } from "express";
import { db, transactionsTable, profilesTable, budgetsTable } from "@workspace/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;

  const profile = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  const currency = profile[0]?.currency ?? "USD";

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const totals = await db
    .select({
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .groupBy(transactionsTable.type);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of totals) {
    if (r.type === "income") totalIncome = r.total;
    else if (r.type === "expense") totalExpense = r.total;
  }

  const monthTotals = await db
    .select({
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, monthStart),
        lte(transactionsTable.date, monthEnd),
      ),
    )
    .groupBy(transactionsTable.type);

  let monthIncome = 0;
  let monthExpense = 0;
  for (const r of monthTotals) {
    if (r.type === "income") monthIncome = r.total;
    else if (r.type === "expense") monthExpense = r.total;
  }

  const recent = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.date))
    .limit(5);

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
        gte(transactionsTable.date, monthStart),
        lte(transactionsTable.date, monthEnd),
      ),
    )
    .groupBy(transactionsTable.category);

  const monthlyRows = await db
    .select({
      month: sql<string>`to_char(${transactionsTable.date}, 'YYYY-MM')`,
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .groupBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM')`, transactionsTable.type)
    .orderBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM')`);

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const r of monthlyRows) {
    const m = monthlyMap.get(r.month) ?? { income: 0, expense: 0 };
    if (r.type === "income") m.income = r.total;
    else if (r.type === "expense") m.expense = r.total;
    monthlyMap.set(r.month, m);
  }
  const monthlySpend = Array.from(monthlyMap.entries()).map(([month, v]) => ({ month, ...v }));

  const month = monthKey(now);
  const budgets = await db
    .select()
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));
  const budgetProgress = budgets.map((b) => {
    const cat = categoryRows.find((c) => c.category === b.category);
    return { category: b.category, budget: b.amount, spent: cat?.total ?? 0 };
  });

  res.json({
    balance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    savings: Math.max(0, totalIncome - totalExpense),
    monthIncome,
    monthExpense,
    currency,
    recentTransactions: recent,
    categoryBreakdown: categoryRows.map((r) => ({ category: r.category, amount: r.total })),
    monthlySpend,
    budgetProgress,
  });
});

export default router;
