import { Bell, Check, AlertTriangle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
  danger: { icon: AlertCircle, bg: "bg-rose-500/10", color: "text-rose-600 dark:text-rose-400" },
  info: { icon: Bell, bg: "bg-primary/10", color: "text-primary" },
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();

  async function handleRead(id: number) {
    await markRead.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/notifications"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Budget alerts and account updates.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data || data.length === 0 ? (
        <Card className="border-card-border">
          <EmptyState icon={Bell} title="You're all caught up" description="Notifications will appear here when budget limits are approached or exceeded." />
        </Card>
      ) : (
        <Card className="border-card-border divide-y divide-border">
          {data.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div key={n.id} className={cn("flex items-start gap-3 p-4", !n.read && "bg-primary/5")}>
                <div className={cn("size-10 rounded-lg flex items-center justify-center", meta.bg, meta.color)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{n.title}</div>
                    {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => handleRead(n.id)}>
                    <Check className="size-4" /> Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
