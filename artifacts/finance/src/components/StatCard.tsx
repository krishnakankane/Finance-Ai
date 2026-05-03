import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "income" | "expense" | "savings";
  trend?: { value: string; positive: boolean };
}

const TONE: Record<NonNullable<Props["tone"]>, { card: string; icon: string; iconBg: string }> = {
  primary: {
    card: "stat-primary",
    icon: "text-success",
    iconBg: "bg-success/15",
  },
  income: {
    card: "stat-income",
    icon: "text-[hsl(var(--chart-2))]",
    iconBg: "bg-[hsl(var(--chart-2)/0.15)]",
  },
  expense: {
    card: "stat-expense",
    icon: "text-destructive",
    iconBg: "bg-destructive/15",
  },
  savings: {
    card: "stat-savings",
    icon: "text-[hsl(var(--chart-4))]",
    iconBg: "bg-[hsl(var(--chart-4)/0.15)]",
  },
};

export function StatCard({ label, value, icon: Icon, hint, tone = "primary", trend }: Props) {
  const s = TONE[tone];
  return (
    <div className={cn("relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden", s.card)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", s.iconBg)}>
          <Icon className={cn("size-5", s.icon)} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend.positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
      </div>
      {hint && (
        <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 mt-auto">{hint}</div>
      )}
    </div>
  );
}
