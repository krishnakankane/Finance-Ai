import { Sparkles, RefreshCw, Lightbulb, TrendingUp, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAiInsights, useRefreshAiInsights } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      {children}
    </div>
  );
}

export default function Insights() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetAiInsights();
  const refresh = useRefreshAiInsights();

  async function handleRefresh() {
    try {
      await refresh.mutateAsync();
      toast({ title: "Insights refreshed" });
      qc.invalidateQueries({ queryKey: ["/ai/insights"] });
    } catch (e) {
      toast({ title: "Refresh failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/15 flex items-center justify-center animate-pulse">
            <Sparkles className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Fetching insights…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AI Insights"
        subtitle="Personalized analysis of your spending patterns."
        action={
          <Button
            onClick={handleRefresh}
            disabled={refresh.isPending || !data?.hasEnoughData}
            className="shadow-md shadow-primary/20"
          >
            <RefreshCw className={cn("size-4", refresh.isPending && "animate-spin")} />
            {data?.createdAt ? "Refresh insights" : "Generate insights"}
          </Button>
        }
      />

      {!data?.hasEnoughData ? (
        <Card>
          <EmptyState
            icon={Activity}
            title="Not enough data yet"
            description="Add transactions across at least two months to unlock AI-powered spending analysis and predictions."
          />
        </Card>
      ) : !data.createdAt ? (
        <Card className="bg-gradient-to-br from-primary/8 to-transparent border-primary/20">
          <EmptyState
            icon={Sparkles}
            title="Ready to generate insights"
            description="Click the button above to get your first AI-powered financial analysis."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Summary */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Spending summary</div>
                <div className="text-xs text-muted-foreground">Generated {formatDate(data.createdAt)}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{data.summary}</p>
          </Card>

          {/* Forecast */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-chart-2/15 flex items-center justify-center">
                <TrendingUp className="size-4 text-[hsl(var(--chart-2))]" />
              </div>
              <div className="font-semibold">Next month forecast</div>
            </div>
            {data.predictedNextMonth ? (
              <p className="text-sm leading-relaxed text-foreground/90">{data.predictedNextMonth}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No forecast available yet.</p>
            )}
          </Card>

          {/* Suggestions */}
          <Card className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-5">
              <div className="size-8 rounded-xl bg-warning/15 flex items-center justify-center">
                <Lightbulb className="size-4 text-warning" />
              </div>
              <div className="font-semibold">Personalized suggestions</div>
            </div>
            {data.suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.suggestions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3">
                    <div className="size-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
