import { Router, type IRouter } from "express";
import { db, transactionsTable, aiInsightsTable, profilesTable } from "@workspace/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { generateInsights } from "../lib/ai";

const router: IRouter = Router();

async function buildInsightInput(userId: string) {
  const profile = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  const currency = profile[0]?.currency ?? "USD";

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const monthlyRows = await db
    .select({
      month: sql<string>`to_char(${transactionsTable.date}, 'YYYY-MM')`,
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)::int`,
    })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), gte(transactionsTable.date, start)))
    .groupBy(sql`to_char(${transactionsTable.date}, 'YYYY-MM')`, transactionsTable.type);

  const map = new Map<string, { income: number; expense: number }>();
  for (const r of monthlyRows) {
    const m = map.get(r.month) ?? { income: 0, expense: 0 };
    if (r.type === "income") m.income = r.total;
    else if (r.type === "expense") m.expense = r.total;
    map.set(r.month, m);
  }
  const monthlyTotals = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, ...v }));

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

  const recent = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.date))
    .limit(20);

  const monthsWithExpense = monthlyTotals.filter((m) => m.expense > 0).length;
  return {
    hasEnoughData: monthsWithExpense >= 2,
    input: {
      currency,
      monthlyTotals,
      categoryTotals: categoryRows.map((r) => ({ category: r.category, amount: r.total })),
      recentTransactions: recent.map((t) => ({
        date: t.date.toISOString(),
        category: t.category,
        amount: t.amount,
        description: t.description,
      })),
    },
  };
}

router.get("/ai/insights", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { hasEnoughData } = await buildInsightInput(userId);
  const cached = await db
    .select()
    .from(aiInsightsTable)
    .where(eq(aiInsightsTable.userId, userId))
    .orderBy(desc(aiInsightsTable.createdAt))
    .limit(1);
  if (cached.length === 0) {
    res.json({
      summary: hasEnoughData
        ? "Tap refresh to generate your first AI insights."
        : "Add transactions across at least two months to unlock AI insights.",
      suggestions: [],
      predictedNextMonth: null,
      createdAt: null,
      hasEnoughData,
    });
    return;
  }
  const c = cached[0]!;
  res.json({
    summary: c.summary,
    suggestions: c.suggestions ?? [],
    predictedNextMonth: c.predictedNextMonth,
    createdAt: c.createdAt.toISOString(),
    hasEnoughData,
  });
});

router.post("/ai/insights", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { hasEnoughData, input } = await buildInsightInput(userId);
  if (!hasEnoughData) {
    res.json({
      summary: "Add transactions across at least two months to unlock AI insights.",
      suggestions: [],
      predictedNextMonth: null,
      createdAt: null,
      hasEnoughData: false,
    });
    return;
  }
  try {
    const result = await generateInsights(input);
    const inserted = await db
      .insert(aiInsightsTable)
      .values({
        userId,
        summary: result.summary,
        suggestions: result.suggestions,
        predictedNextMonth: result.predictedNextMonth,
      })
      .returning();
    const row = inserted[0]!;
    res.json({
      summary: row.summary,
      suggestions: row.suggestions ?? [],
      predictedNextMonth: row.predictedNextMonth,
      createdAt: row.createdAt.toISOString(),
      hasEnoughData: true,
    });
  } catch (err) {
    req.log?.error({ err }, "AI insights generation failed");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
