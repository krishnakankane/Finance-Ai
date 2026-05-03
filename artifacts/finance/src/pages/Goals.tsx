import { useState } from "react";
import { Plus, Trash2, Pencil, Target, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useGetProfile,
  type Goal,
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
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatDate, parseMoneyToCents } from "@/lib/format";
import { cn } from "@/lib/utils";

interface GoalForm {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
}

const empty: GoalForm = { name: "", targetAmount: "", currentAmount: "", deadline: "" };

export default function Goals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useGetProfile();
  const currency = profile?.currency ?? "USD";

  const { data: goals, isLoading } = useListGoals();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const remove = useDeleteGoal();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(empty);

  function openCreate() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({
      name: g.name,
      targetAmount: (g.targetAmount / 100).toString(),
      currentAmount: (g.currentAmount / 100).toString(),
      deadline: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const target = parseMoneyToCents(form.targetAmount);
    if (target <= 0) { toast({ title: "Enter a target amount", variant: "destructive" }); return; }
    const payload = {
      name: form.name,
      targetAmount: target,
      currentAmount: parseMoneyToCents(form.currentAmount),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "Goal updated" });
      } else {
        await create.mutateAsync({ data: payload });
        toast({ title: "Goal created" });
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["/goals"] });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await remove.mutateAsync({ id });
      toast({ title: "Goal deleted" });
      qc.invalidateQueries({ queryKey: ["/goals"] });
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Savings goals"
        subtitle="Save toward what matters most."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="shadow-md shadow-primary/20">
                <Plus className="size-4" /> New goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{editing ? "Edit goal" : "New savings goal"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label>Goal name</Label>
                  <Input placeholder="e.g. Emergency fund" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Target amount</Label>
                    <Input inputMode="decimal" placeholder="0.00" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Saved so far</Label>
                    <Input inputMode="decimal" placeholder="0.00" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={create.isPending || update.isPending}>
                  {editing ? "Save changes" : "Create goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !goals || goals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Create your first savings goal and track your progress."
            action={<Button onClick={openCreate}><Plus className="size-4" /> New goal</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            const done = g.currentAmount >= g.targetAmount;
            return (
              <div key={g.id} className={cn("rounded-2xl border bg-card p-5", done ? "border-success/30 bg-success/5" : "border-border")}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", done ? "bg-success/15 text-success" : "bg-primary/15 text-primary")}>
                    {done ? <CheckCircle2 className="size-5" /> : <Target className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{g.name}</div>
                    {g.deadline && (
                      <div className="text-xs text-muted-foreground">By {formatDate(g.deadline)}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => openEdit(g)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(g.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={pct}
                    className={cn("h-2", done && "[&>div]:bg-success")}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{formatMoney(g.currentAmount, currency)}</span>
                    <span className="text-muted-foreground">of {formatMoney(g.targetAmount, currency)}</span>
                  </div>
                  <div className={cn("text-xs font-medium", done ? "text-success" : "text-muted-foreground")}>
                    {done ? "🎉 Goal reached!" : `${pct}% complete · ${formatMoney(g.targetAmount - g.currentAmount, currency)} to go`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
