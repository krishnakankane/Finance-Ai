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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney, formatMonthLabel } from "@/lib/format";

export default function Reports() {
  const { toast } = useToast();
  const { data: profile } = useGetProfile();
  const currency = profile?.currency ?? "USD";

  const { data: monthly } = useGetMonthlyReport({ months: 6 });
  const { data: weekly } = useGetWeeklyReport();

  function downloadMonthlyPDF() {
    if (!monthly) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Finova — Monthly Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 27);

    autoTable(doc, {
      startY: 35,
      head: [["Month", "Income", "Expense", "Net"]],
      body: monthly.monthlySpend.map((m) => [
        formatMonthLabel(m.month),
        formatMoney(m.income, currency),
        formatMoney(m.expense, currency),
        formatMoney(m.income - m.expense, currency),
      ]),
      headStyles: { fillColor: [99, 102, 241] },
    });

    autoTable(doc, {
      head: [["Category", "Total spent"]],
      body: monthly.categoryBreakdown.map((c) => [c.category, formatMoney(c.amount, currency)]),
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save(`finova-monthly-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "Report downloaded" });
  }

  function downloadWeeklyPDF() {
    if (!weekly) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Finova — Weekly Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Last 7 days · Generated ${new Date().toLocaleDateString()}`, 14, 27);

    autoTable(doc, {
      startY: 35,
      head: [["Day", "Spent"]],
      body: weekly.days.map((d) => [d.day, formatMoney(d.amount, currency)]),
      foot: [["Total", formatMoney(weekly.totalSpent, currency)]],
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save(`finova-weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "Report downloaded" });
  }

  const monthlyChart = (monthly?.monthlySpend ?? []).map((m) => ({
    month: formatMonthLabel(m.month),
    Income: m.income / 100,
    Expense: m.expense / 100,
  }));
  const weeklyChart = (weekly?.days ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString(undefined, { weekday: "short" }),
    Spent: d.amount / 100,
  }));
  const monthlyHasData = monthlyChart.some((m) => m.Income > 0 || m.Expense > 0);
  const weeklyHasData = (weekly?.totalSpent ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize your income and spending. Export as PDF.</p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="space-y-4">
          <Card className="p-5 border-card-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Last 6 months</h2>
                <p className="text-xs text-muted-foreground">Income vs expense</p>
              </div>
              <Button variant="outline" onClick={downloadMonthlyPDF} disabled={!monthlyHasData}>
                <Download className="size-4" /> Download PDF
              </Button>
            </div>
            {!monthlyHasData ? (
              <EmptyState icon={BarChart3} title="No monthly data" description="Add transactions to populate your monthly report." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(v: number) => formatMoney(Math.round(v * 100), currency)}
                    />
                    <Legend />
                    <Bar dataKey="Income" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expense" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <Card className="p-5 border-card-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">This week</h2>
                <p className="text-xs text-muted-foreground">Daily spending — total {formatMoney(weekly?.totalSpent ?? 0, currency)}</p>
              </div>
              <Button variant="outline" onClick={downloadWeeklyPDF} disabled={!weeklyHasData}>
                <Download className="size-4" /> Download PDF
              </Button>
            </div>
            {!weeklyHasData ? (
              <EmptyState icon={BarChart3} title="No spending this week" description="Your weekly chart appears once you log expenses." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
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
