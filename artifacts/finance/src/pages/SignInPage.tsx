import { SignIn } from "@clerk/react";
import { TrendingUp, ShieldCheck, Zap, BarChart3, ArrowUpRight } from "lucide-react";

const FEATURES = [
  { icon: Zap,         text: "AI auto-categorization for every transaction" },
  { icon: ShieldCheck, text: "Budget alerts before you overspend" },
  { icon: BarChart3,   text: "Spending predictions powered by GPT" },
  { icon: ArrowUpRight,text: "Monthly & weekly PDF reports" },
];


export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">

      {/* ── Left brand panel ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] shrink-0 sidebar-gradient flex-col justify-between p-10 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-80px] size-[350px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-60px] size-[280px] rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
              <TrendingUp className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Finova</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted">AI Personal Finance</div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.1]">
              Smart money<br />
              <span style={{
                background: "linear-gradient(135deg, hsl(158 72% 60%), hsl(198 85% 64%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                starts here.
              </span>
            </h1>
            <p className="mt-4 text-white/60 text-base leading-relaxed max-w-xs">
              AI-powered insights, smart budgets, and beautiful reports — your finances, finally under control.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="size-3.5 text-primary" />
                </div>
                <span className="text-sm text-white/75">{text}</span>
              </div>
            ))}
          </div>

        </div>

        <div className="relative z-10 text-[11px] text-sidebar-muted/50">
          © {new Date().getFullYear()} Finova · Built for clarity
        </div>
      </div>

      {/* ── Right sign-in panel ───────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <div className="text-lg font-bold">Finova</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Personal Finance</div>
          </div>
        </div>

        <SignIn routing="hash" signUpUrl="#/sign-up" />
      </div>
    </div>
  );
}
