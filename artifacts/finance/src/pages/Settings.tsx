import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { parseMoneyToCents } from "@/lib/format";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "BRL"];

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize your Finova experience.</p>
      </div>

      <Card className="p-6 border-card-border space-y-4">
        <div>
          <h2 className="font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground">Used across your dashboard.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Monthly income</Label>
            <Input inputMode="decimal" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={update.isPending}>Save changes</Button>
        </div>
      </Card>

      <Card className="p-6 border-card-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <><Sun className="size-4" /> Light mode</> : <><Moon className="size-4" /> Dark mode</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
