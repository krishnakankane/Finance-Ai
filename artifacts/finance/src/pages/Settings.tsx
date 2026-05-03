import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, User, Palette, DollarSign } from "lucide-react";
import { parseMoneyToCents } from "@/lib/format";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "BRL"];

function Section({ icon: Icon, title, sub, children }: {
  icon: typeof User;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { theme, toggle } = useTheme();
  const { data: profile } = useGetProfile();
  const update = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setCurrency(profile.currency);
      setMonthlyIncome(((profile.monthlyIncome ?? 0) / 100).toString());
    }
  }, [profile]);

  async function save() {
    try {
      await update.mutateAsync({
        data: {
          displayName: displayName || null,
          currency,
          monthlyIncome: parseMoneyToCents(monthlyIncome),
        },
      });
      toast({ title: "Settings saved" });
      qc.invalidateQueries({ queryKey: ["/me"] });
      qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your profile and preferences." />

      <div className="space-y-4">
        <Section icon={User} title="Profile" sub="Your display info and financial baseline">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="max-w-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly income</Label>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={save} disabled={update.isPending} className="shadow-md shadow-primary/20">
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Section>

        <Section icon={DollarSign} title="Finance" sub="How Finova tracks your money">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>All amounts are stored in your selected currency ({currency}).</p>
            <p>Transactions older than today count toward your historical reports.</p>
            <p>AI insights require at least 2 months of expense data.</p>
          </div>
        </Section>

        <Section icon={Palette} title="Appearance" sub="Light or dark — your call">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Currently: <span className="font-medium text-foreground capitalize">{theme} mode</span>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-border rounded-xl p-1">
              <button
                onClick={() => theme === "dark" && toggle()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  theme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="size-3.5" /> Light
              </button>
              <button
                onClick={() => theme === "light" && toggle()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  theme === "dark" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Moon className="size-3.5" /> Dark
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
