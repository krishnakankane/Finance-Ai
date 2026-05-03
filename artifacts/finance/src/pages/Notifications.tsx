import { Bell, Check, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: typeof Bell; iconClass: string; bg: string; border: string }> = {
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    bg: "bg-warning/10",
    border: "border-l-warning",
  },
  danger: {
    icon: AlertCircle,
    iconClass: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-l-destructive",
  },
  info: {
    icon: Info,
    iconClass: "text-primary",
    bg: "bg-primary/10",
    border: "border-l-primary",
  },
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();

  async function handleRead(id: number) {
    await markRead.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/notifications"] });
  }

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread alert${unread !== 1 ? "s" : ""}` : "All caught up!"}
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Budget alerts and important updates will appear here when triggered."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-2xl border border-border border-l-4 bg-card p-4 flex items-start gap-4 transition-colors",
                  meta.border,
                  !n.read && "bg-primary/5",
                )}
              >
                <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                  <Icon className={cn("size-4", meta.iconClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8 text-xs rounded-lg"
                    onClick={() => handleRead(n.id)}
                  >
                    <Check className="size-3.5" /> Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
