import {
  UtensilsCrossed,
  Plane,
  Receipt,
  ShoppingBag,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export const EXPENSE_CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Others"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  Food: { icon: UtensilsCrossed, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  Travel: { icon: Plane, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" },
  Bills: { icon: Receipt, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  Shopping: { icon: ShoppingBag, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  Others: { icon: MoreHorizontal, color: "text-muted-foreground", bg: "bg-muted" },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.Others;
}
