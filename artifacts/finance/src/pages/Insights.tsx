import { Sparkles, RefreshCw, Lightbulb, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAiInsights, useRefreshAiInsights } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";

export default function Insights() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetAiInsights();
  const refresh = useRefreshAiInsights();

  async function handleRefresh() {
    try {
      await refresh.mutateAsync();
      toast({ title: "Insights updated" });
      qc.invalidateQueries({ queryKey: ["/ai/insights"] });
    } catch (e) {
      toast({ title: "Refresh failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
            AI Insights <Sparkles className="size-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Personalized analysis of your spending patterns.</p>
        </div>
        <Button onClick={handleRefresh} disabled={refresh.isPending || !data?.hasEnoughData}>
          <RefreshCw className={`size-4 ${refresh.isPending ? "animate-spin" : ""}`} />
          {data?.createdAt ? "Refresh" : "Generate"}
        </Button>
      </div>

      {!data?.hasEnoughData ? (
        <Card className="border-card-border">
          <EmptyState
            icon={Sparkles}
            title="Not enough data yet"
            description="Add transactions across at least two months to unlock AI insights about your spending."
          />
        </Card>
      ) : !data.createdAt ? (
        <Card className="border-card-border">
          <EmptyState
            icon={Sparkles}
            title="Ready to generate"
            description="Click Generate to get your first AI-powered analysis."
            action={<Button onClick={handleRefresh} disabled={refresh.isPending}><Sparkles className="size-4" /> Generate insights</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-6 border-card-border bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-primary" />
              <h2 className="font-semibold">Summary</h2>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{data.summary}</p>
            <div className="text-xs text-muted-foreground mt-4">Generated {formatDate(data.createdAt)}</div>
          </Card>

          <Card className="p-6 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-primary" />
              <h2 className="font-semibold">Next month forecast</h2>
            </div>
            {data.predictedNextMonth ? (
              <p className="text-sm leading-relaxed">{data.predictedNextMonth}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No forecast available.</p>
            )}
          </Card>

          <Card className="lg:col-span-3 p-6 border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="size-4 text-primary" />
              <h2 className="font-semibold">Suggestions for you</h2>
            </div>
            {data.suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm leading-relaxed">{s}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
