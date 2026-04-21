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
import { Card } from "@/components/ui/card";
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
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatMonthLabel, currentMonth, parseMoneyToCents } from "@/lib/format";
import { EXPENSE_CATEGORIES, categoryMeta } from "@/lib/categories";

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
    if (cents <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
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
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Set monthly limits and stay on track.</p>
        </div>
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Set budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set monthly budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="text-xs text-muted-foreground">Applies to {formatMonthLabel(month)}.</div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={upsert.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !budgets || budgets.length === 0 ? (
        <Card className="border-card-border">
          <EmptyState
            icon={PiggyBank}
            title="No budgets for this month"
            description="Set a budget per category to see how you're tracking."
            action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Set budget</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const meta = categoryMeta(b.category);
            const Icon = meta.icon;
            const spent = spentFor(b.category);
            const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
            const over = spent > b.amount;
            return (
              <Card key={b.id} className="p-5 border-card-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`size-10 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{b.category}</div>
                    <div className="text-xs text-muted-foreground">{formatMonthLabel(b.month)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} aria-label="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Progress value={pct} className={over ? "[&>div]:bg-destructive" : ""} />
                  <div className="flex justify-between text-sm">
                    <span className={over ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {formatMoney(spent, currency)} spent
                    </span>
                    <span className="font-medium">{formatMoney(b.amount, currency)}</span>
                  </div>
                  {over && <div className="text-xs text-destructive">You're over budget by {formatMoney(spent - b.amount, currency)}.</div>}
                  {!over && pct >= 80 && <div className="text-xs text-amber-600 dark:text-amber-400">{pct}% used — close to your limit.</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
