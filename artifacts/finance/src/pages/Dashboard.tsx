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
  Activity,
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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { formatMoney, formatMonthLabel, formatDate } from "@/lib/format";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card text-card-foreground p-5", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="font-semibold text-[15px]">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/15 flex items-center justify-center animate-pulse">
            <Activity className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={Activity}
          title="Couldn't load dashboard"
          description="There was an error fetching your data. Make sure you're signed in and try again."
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  const currency = data.currency;
  const hasAnyData = data.totalIncome > 0 || data.totalExpense > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your financial overview at a glance."
        action={
          <Link href="/transactions">
            <Button className="shadow-md shadow-primary/20">
              <Plus className="size-4" /> Add transaction
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Net balance" value={formatMoney(data.balance, currency)} icon={Wallet} tone="primary" hint="All-time" />
        <StatCard label="Total income" value={formatMoney(data.totalIncome, currency)} icon={TrendingUp} tone="income" hint={`${formatMoney(data.monthIncome, currency)} this month`} />
        <StatCard label="Total expenses" value={formatMoney(data.totalExpense, currency)} icon={TrendingDown} tone="expense" hint={`${formatMoney(data.monthExpense, currency)} this month`} />
        <StatCard label="Net savings" value={formatMoney(data.savings, currency)} icon={PiggyBank} tone="savings" hint="Income minus expenses" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Cash flow" sub="Monthly income vs expenses" />
          {data.monthlySpend.length === 0 ? (
            <EmptyState icon={Inbox} title="No activity yet" description="Add your first transaction to see cash flow." compact />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySpend.map((m) => ({
                  month: formatMonthLabel(m.month),
                  Income: m.income / 100,
                  Expense: m.expense / 100,
                }))}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                  />
                  <Area type="monotone" dataKey="Income" stroke="hsl(var(--chart-2))" fill="url(#gIncome)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Expense" stroke="hsl(var(--chart-1))" fill="url(#gExpense)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.monthlySpend.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-[hsl(var(--chart-2))]" /> Income
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-[hsl(var(--chart-1))]" /> Expense
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Categories" sub="Spending breakdown this month" />
          {data.categoryBreakdown.length === 0 ? (
            <EmptyState icon={Inbox} title="No expenses yet" description="Categories appear once you log expenses." compact />
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown.map((c) => ({ name: c.category, value: c.amount / 100 }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-1">
                {data.categoryBreakdown.slice(0, 5).map((c, i) => (
                  <div key={c.category} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground text-xs">{c.category}</span>
                    <span className="text-xs font-semibold">{formatMoney(c.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Recent transactions"
            action={
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs h-7">View all →</Button>
              </Link>
            }
          />
          {data.recentTransactions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No transactions yet"
              description="Track your first transaction to get started."
              action={<Link href="/transactions"><Button size="sm"><Plus className="size-3.5" /> Add transaction</Button></Link>}
              compact
            />
          ) : (
            <div className="divide-y divide-border/60">
              {data.recentTransactions.map((t) => {
                const meta = categoryMeta(t.category);
                const Icon = meta.icon;
                const positive = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.description || t.category}</div>
                      <div className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</div>
                    </div>
                    <div className={`flex items-center gap-0.5 text-sm font-semibold shrink-0 ${positive ? "text-success" : "text-destructive"}`}>
                      {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {formatMoney(t.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Budget progress"
            sub="This month"
            action={
              <Link href="/budgets">
                <Button variant="ghost" size="sm" className="text-xs h-7">Manage →</Button>
              </Link>
            }
          />
          {data.budgetProgress.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set"
              description="Set monthly limits to stay on track."
              action={<Link href="/budgets"><Button size="sm" variant="outline">Set budget</Button></Link>}
              compact
            />
          ) : (
            <div className="space-y-4">
              {data.budgetProgress.map((b) => {
                const pct = b.budget > 0 ? Math.min(100, Math.round((b.spent / b.budget) * 100)) : 0;
                const over = b.spent > b.budget;
                const warn = !over && pct >= 80;
                return (
                  <div key={b.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.category}</span>
                      <span className={over ? "text-destructive font-semibold" : warn ? "text-warning font-semibold" : "text-muted-foreground"}>
                        {pct}%
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn(
                        "h-1.5",
                        over && "[&>div]:bg-destructive",
                        warn && "[&>div]:bg-warning",
                      )}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatMoney(b.spent, currency)}</span>
                      <span>{formatMoney(b.budget, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Welcome CTA */}
      {!hasAnyData && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <Wallet className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Welcome to Finova</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Get started by logging your first transaction. We'll auto-categorize it and build your financial picture over time.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link href="/transactions"><Button className="shadow-md shadow-primary/20">Add transaction</Button></Link>
                <Link href="/budgets"><Button variant="outline">Set a budget</Button></Link>
                <Link href="/goals"><Button variant="outline">Create a goal</Button></Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
