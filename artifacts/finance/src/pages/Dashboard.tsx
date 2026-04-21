import { Link } from "wouter";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatMonthLabel, formatDate } from "@/lib/format";
import { categoryMeta } from "@/lib/categories";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const currency = data.currency;
  const hasAnyData = data.totalIncome > 0 || data.totalExpense > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your money at a glance.</p>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="size-4" /> Add transaction
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Balance"
          value={formatMoney(data.balance, currency)}
          icon={Wallet}
          tone="primary"
          hint="All-time net"
        />
        <StatCard
          label="Total income"
          value={formatMoney(data.totalIncome, currency)}
          icon={TrendingUp}
          tone="positive"
          hint={`${formatMoney(data.monthIncome, currency)} this month`}
        />
        <StatCard
          label="Total expenses"
          value={formatMoney(data.totalExpense, currency)}
          icon={TrendingDown}
          tone="negative"
          hint={`${formatMoney(data.monthExpense, currency)} this month`}
        />
        <StatCard
          label="Savings"
          value={formatMoney(data.savings, currency)}
          icon={PiggyBank}
          tone="positive"
          hint="Income minus expenses"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Cash flow</h2>
              <p className="text-xs text-muted-foreground">Income vs expenses by month</p>
            </div>
          </div>
          {data.monthlySpend.length === 0 ? (
            <EmptyState icon={Inbox} title="No activity yet" description="Add your first transaction to see your cash flow." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySpend.map((m) => ({ ...m, month: formatMonthLabel(m.month), income: m.income / 100, expense: m.expense / 100 }))}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-2))" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(var(--chart-1))" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5 border-card-border">
          <div className="mb-4">
            <h2 className="font-semibold">Spending by category</h2>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
          {data.categoryBreakdown.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing spent yet" description="Categories will appear once you log expenses." />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown.map((c) => ({ ...c, amount: c.amount / 100 }))}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {data.categoryBreakdown.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1">{c.category}</span>
                    <span className="font-medium">{formatMoney(c.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Recent transactions</h2>
              <p className="text-xs text-muted-foreground">Your latest activity</p>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No transactions yet"
              description="Track your first transaction to get started."
              action={
                <Link href="/transactions">
                  <Button><Plus className="size-4" /> Add transaction</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {data.recentTransactions.map((t) => {
                const meta = categoryMeta(t.category);
                const Icon = meta.icon;
                const positive = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.description || t.category}</div>
                      <div className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {formatMoney(t.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 border-card-border">
          <div className="mb-4">
            <h2 className="font-semibold">Budget progress</h2>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
          {data.budgetProgress.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set"
              description="Create a budget to track your spending limits."
              action={
                <Link href="/budgets">
                  <Button variant="outline" size="sm">Set a budget</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {data.budgetProgress.map((b) => {
                const pct = b.budget > 0 ? Math.min(100, Math.round((b.spent / b.budget) * 100)) : 0;
                const over = b.spent > b.budget;
                return (
                  <div key={b.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className={over ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {formatMoney(b.spent, currency)} / {formatMoney(b.budget, currency)}
                      </span>
                    </div>
                    <Progress value={pct} className={over ? "[&>div]:bg-destructive" : ""} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {!hasAnyData && (
        <Card className="p-8 border-card-border bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <Wallet className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Welcome to Finova</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get started by adding your first transaction. We'll auto-categorize it for you and start building insights.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link href="/transactions"><Button>Add transaction</Button></Link>
                <Link href="/budgets"><Button variant="outline">Set a budget</Button></Link>
                <Link href="/goals"><Button variant="outline">Create a goal</Button></Link>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
