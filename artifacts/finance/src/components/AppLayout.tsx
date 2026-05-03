import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useListNotifications } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard },
  { href: "/transactions",  label: "Transactions",  icon: ArrowLeftRight },
  { href: "/budgets",       label: "Budgets",       icon: PiggyBank },
  { href: "/goals",         label: "Goals",         icon: Target },
  { href: "/insights",      label: "AI Insights",   icon: Sparkles },
  { href: "/reports",       label: "Reports",       icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings",      label: "Settings",      icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { data: notifications } = useListNotifications();
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 flex flex-col",
        "sidebar-gradient border-r border-sidebar-border",
        "transition-transform duration-300 md:translate-x-0 md:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border/60">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/40">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <div className="font-bold text-white text-[15px] tracking-tight">Finova</div>
            <div className="text-[10px] text-sidebar-muted uppercase tracking-[0.15em]">AI Finance</div>
          </div>
          <button
            className="ml-auto md:hidden p-1.5 rounded-lg text-sidebar-muted hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-sidebar-muted">
            Navigation
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV.map((item) => {
            const active = item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-muted group-hover:text-primary",
                )} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notifications" && unread > 0 && (
                  <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {active && (
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI badge */}
        <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-white font-semibold">AI-Powered</div>
              <div className="text-[10px] text-sidebar-muted truncate">Smart insights active</div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 text-[10px] text-sidebar-muted/60">
          © {new Date().getFullYear()} Finova
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 border-b border-border flex items-center px-4 md:px-6 gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="rounded-xl size-9"
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? <Sun className="size-4 text-amber-400" />
              : <Moon className="size-4 text-slate-500" />
            }
          </Button>

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="rounded-xl size-9 relative">
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Button>
          </Link>

          <div className="pl-0.5">
            <UserButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
