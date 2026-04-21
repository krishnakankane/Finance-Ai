import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "primary";
}

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-muted text-foreground",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  negative: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  primary: "bg-primary/10 text-primary",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: Props) {
  return (
    <Card className="p-5 flex flex-col gap-3 border-card-border">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={cn("size-9 rounded-lg flex items-center justify-center", TONES[tone])}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
