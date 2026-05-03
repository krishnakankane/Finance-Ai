import { Download, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useGetMonthlyReport,
  useGetWeeklyReport,
  useGetProfile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatMonthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

export default function Reports() {
  const { toast } = useToast();
  const { data: profile } = useGetProfile();
  const currency = profile?.currency ?? "USD";

  const { data: monthly } = useGetMonthlyReport({ months: 6 });
  const { data: weekly } = useGetWeeklyReport();

  function downloadMonthlyPDF() {
    if (!monthly) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text("Finova", 14, 18);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 50);
    doc.text("Monthly Financial Report", 14, 27);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 140);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 34);
    autoTable(doc, {
      startY: 42,
      head: [["Month", "Income", "Expense", "Net"]],
      body: monthly.monthlySpend.map((m) => [
        formatMonthLabel(m.month),
        formatMoney(m.income, currency),
        formatMoney(m.expense, currency),
        formatMoney(m.income - m.expense, currency),
      ]),
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });
    autoTable(doc, {
      head: [["Category", "Total spent"]],
      body: monthly.categoryBreakdown.map((c) => [c.category, formatMoney(c.amount, currency)]),
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });
    doc.save(`finova-monthly-${new Date().toISOString().slice(0, 7)}.pdf`);
    toast({ title: "Report downloaded" });
  }

  function downloadWeeklyPDF() {
    if (!weekly) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text("Finova", 14, 18);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 50);
    doc.text("Weekly Spending Report", 14, 27);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 140);
    doc.text(`Last 7 days · Generated ${new Date().toLocaleDateString()}`, 14, 34);
    autoTable(doc, {
      startY: 42,
      head: [["Day", "Spent"]],
      body: weekly.days.map((d) => [d.day, formatMoney(d.amount, currency)]),
      foot: [["Total", formatMoney(weekly.totalSpent, currency)]],
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });
    doc.save(`finova-weekly-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "Report downloaded" });
  }

  const monthlyChart = (monthly?.monthlySpend ?? []).map((m) => ({
    month: formatMonthLabel(m.month),
    Income: m.income / 100,
    Expense: m.expense / 100,
  }));
  const weeklyChart = (weekly?.days ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    Spent: d.amount / 100,
  }));
  const monthlyHasData = monthlyChart.some((m) => m.Income > 0 || m.Expense > 0);
  const weeklyHasData = (weekly?.totalSpent ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Visualize your finances and export as PDF."
      />

      <Tabs defaultValue="monthly">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">Monthly (6 months)</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <div className="font-semibold">Income vs expense by month</div>
                <div className="text-xs text-muted-foreground mt-0.5">Last 6 months</div>
              </div>
              <Button variant="outline" onClick={downloadMonthlyPDF} disabled={!monthlyHasData} className="gap-1.5">
                <Download className="size-4" /> Download PDF
              </Button>
            </div>
            {!monthlyHasData ? (
              <EmptyState icon={BarChart3} title="No monthly data" description="Add transactions to see your monthly report." compact />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChart} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Income" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expense" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <div className="font-semibold">Daily spending this week</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Total: <span className="font-semibold text-foreground">{formatMoney(weekly?.totalSpent ?? 0, currency)}</span>
                </div>
              </div>
              <Button variant="outline" onClick={downloadWeeklyPDF} disabled={!weeklyHasData} className="gap-1.5">
                <Download className="size-4" /> Download PDF
              </Button>
            </div>
            {!weeklyHasData ? (
              <EmptyState icon={BarChart3} title="No spending this week" description="Log expenses to see your weekly breakdown." compact />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                    />
                    <Bar dataKey="Spent" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
