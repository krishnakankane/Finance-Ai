import { useState } from "react";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBudgets,
  useUpsertBudget,
  useDeleteBudget,
  useGetDashboardSummary,
  useGetProfile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatMonthLabel, currentMonth, parseMoneyToCents } from "@/lib/format";
import { EXPENSE_CATEGORIES, categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/utils";

export default function Budgets() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState("");

  const { data: profile } = useGetProfile();
  const currency = profile?.currency ?? "USD";

  const { data: budgets, isLoading } = useListBudgets({ month });
  const { data: summary } = useGetDashboardSummary();
  const upsert = useUpsertBudget();
  const remove = useDeleteBudget();

  const monthOptions = (() => {
    const opts: string[] = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      opts.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return opts;
  })();

  function spentFor(cat: string): number {
    if (month !== currentMonth()) return 0;
    return summary?.categoryBreakdown.find((c) => c.category === cat)?.amount ?? 0;
  }

  async function submit() {
    const cents = parseMoneyToCents(amount);
    if (cents <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    try {
      await upsert.mutateAsync({ data: { category, amount: cents, month } });
      toast({ title: "Budget saved" });
      setOpen(false);
      setAmount("");
      qc.invalidateQueries({ queryKey: ["/budgets"] });
      qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await remove.mutateAsync({ id });
      toast({ title: "Budget deleted" });
      qc.invalidateQueries({ queryKey: ["/budgets"] });
      qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Set monthly limits and stay on track."
        action={
          <div className="flex gap-2 flex-wrap">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[160px] rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-md shadow-primary/20"><Plus className="size-4" /> Set budget</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Set monthly budget</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monthly limit</Label>
                    <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">Applies to <strong>{formatMonthLabel(month)}</strong>. Updating overwrites any existing budget for this category.</p>
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={submit} disabled={upsert.isPending}>Save budget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={PiggyBank}
            title="No budgets for this month"
            description="Set a spending limit per category to track how you're doing."
            action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Set budget</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const meta = categoryMeta(b.category);
            const Icon = meta.icon;
            const spent = spentFor(b.category);
            const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
            const over = spent > b.amount;
            const warn = !over && pct >= 80;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center", meta.bg, meta.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{b.category}</div>
                    <div className="text-xs text-muted-foreground">{formatMonthLabel(b.month)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className={cn("font-semibold", over && "text-destructive", warn && "text-warning")}>
                      {formatMoney(spent, currency)} <span className="font-normal text-muted-foreground">/ {formatMoney(b.amount, currency)}</span>
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn(
                      "h-2 rounded-full",
                      over && "[&>div]:bg-destructive",
                      warn && "[&>div]:bg-warning",
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pct}% used</span>
                    <span>{formatMoney(Math.max(0, b.amount - spent), currency)} remaining</span>
                  </div>
                  {over && (
                    <div className="text-xs text-destructive font-medium pt-1">
                      Over budget by {formatMoney(spent - b.amount, currency)}
                    </div>
                  )}
                  {warn && (
                    <div className="text-xs text-warning font-medium pt-1">
                      Approaching your limit — {100 - pct}% remaining
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
