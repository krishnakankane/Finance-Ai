import { SignIn } from "@clerk/react";
import { Wallet } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <Wallet className="size-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">Finova</div>
              <div className="text-sm text-muted-foreground">AI Personal Finance</div>
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Take control of your money.
            <span className="block text-primary">With a little help from AI.</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Track expenses, set budgets, hit savings goals, and get personalized insights — all in one beautiful dashboard.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Smart auto-categorization for every transaction",
              "Budget alerts so you never overspend",
              "AI predictions for next month's spending",
              "Monthly & weekly reports as PDF",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-primary mt-2" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <SignIn routing="hash" signUpUrl="#/sign-up" />
        </div>
      </div>
    </div>
  );
}
