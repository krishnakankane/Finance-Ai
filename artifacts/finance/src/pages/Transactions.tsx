import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Sparkles, Inbox, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategorizeTransaction,
  useGetProfile,
  type Transaction,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatDate, parseMoneyToCents } from "@/lib/format";
import { categoryMeta, EXPENSE_CATEGORIES } from "@/lib/categories";
import { EmptyState } from "@/components/EmptyState";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Gift", "Others"];

interface FormState {
  type: "income" | "expense";
  amount: string;
  category: string;
  description: string;
  date: string;
}

const emptyForm: FormState = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function Transactions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: profile } = useGetProfile();
  const currency = profile?.currency ?? "USD";

  const { data: transactions, isLoading } = useListTransactions({
    ...(filterCategory !== "all" ? { category: filterCategory } : {}),
    ...(filterType !== "all" ? { type: filterType } : {}),
    ...(search ? { search } : {}),
  });

  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const categorize = useCategorizeTransaction();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/transactions"] });
    qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    qc.invalidateQueries({ queryKey: ["/notifications"] });
  };

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({
      type: (t.type as "income" | "expense") ?? "expense",
      amount: (t.amount / 100).toString(),
      category: t.category,
      description: t.description ?? "",
      date: new Date(t.date).toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  async function autoCategorize() {
    if (!form.description.trim()) {
      toast({ title: "Add a description first", description: "We need a description to auto-categorize." });
      return;
    }
    try {
      const res = await categorize.mutateAsync({ data: { description: form.description } });
      setForm((f) => ({ ...f, category: res.category }));
      toast({ title: "Categorized", description: `Suggested: ${res.category}` });
    } catch {
      toast({ title: "Couldn't auto-categorize", variant: "destructive" });
    }
  }

  async function submit() {
    const cents = parseMoneyToCents(form.amount);
    if (cents <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const payload = {
      amount: cents,
      type: form.type,
      category: form.category,
      description: form.description,
      date: new Date(form.date).toISOString(),
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "Transaction updated" });
      } else {
        await create.mutateAsync({ data: payload });
        toast({ title: "Transaction added" });
      }
      setOpen(false);
      invalidate();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await remove.mutateAsync({ id });
      toast({ title: "Deleted" });
      invalidate();
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  const categoryOptions = useMemo(
    () => (form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [form.type],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Track every dollar in and out.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Add transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as "income" | "expense", category: v === "income" ? "Salary" : "Food" }))}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="e.g. Lunch with team"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Category</Label>
                  {form.type === "expense" && (
                    <Button type="button" variant="ghost" size="sm" onClick={autoCategorize} disabled={categorize.isPending}>
                      <Sparkles className="size-3.5" /> Auto-categorize
                    </Button>
                  )}
                </div>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={create.isPending || update.isPending}>
                {editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 border-card-border">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search descriptions…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-card-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading…</div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No transactions yet"
            description="Add your first transaction to start tracking."
            action={<Button onClick={openCreate}><Plus className="size-4" /> Add transaction</Button>}
          />
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((t) => {
              const meta = categoryMeta(t.category);
              const Icon = meta.icon;
              const positive = t.type === "income";
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <div className={`size-10 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.description || t.category}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</div>
                  </div>
                  <div className={`text-sm font-semibold flex items-center gap-1 ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {formatMoney(t.amount, currency)}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
