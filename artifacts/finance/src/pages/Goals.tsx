import { useState } from "react";
import { Plus, Trash2, Pencil, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useGetProfile,
  type Goal,
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
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatDate, parseMoneyToCents } from "@/lib/format";

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

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

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
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const target = parseMoneyToCents(form.targetAmount);
    if (target <= 0) {
      toast({ title: "Enter a target amount", variant: "destructive" });
      return;
    }
    const current = parseMoneyToCents(form.currentAmount);
    const payload = {
      name: form.name,
      targetAmount: target,
      currentAmount: current,
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
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Savings goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Save toward what matters most.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> New goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
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
                <Label>Deadline (optional)</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={create.isPending || update.isPending}>
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !goals || goals.length === 0 ? (
        <Card className="border-card-border">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Create a savings goal to track your progress."
            action={<Button onClick={openCreate}><Plus className="size-4" /> New goal</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            const done = g.currentAmount >= g.targetAmount;
            return (
              <Card key={g.id} className="p-5 border-card-border">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                    <Target className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{g.name}</div>
                    {g.deadline && <div className="text-xs text-muted-foreground">By {formatDate(g.deadline)}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(g)} aria-label="Edit"><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                </div>
                <Progress value={pct} />
                <div className="flex justify-between text-sm mt-2">
                  <span className="font-medium">{formatMoney(g.currentAmount, currency)}</span>
                  <span className="text-muted-foreground">of {formatMoney(g.targetAmount, currency)}</span>
                </div>
                <div className={`text-xs mt-1 ${done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {done ? "Goal reached " : `${pct}% complete`}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
