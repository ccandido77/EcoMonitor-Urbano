import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, SEVERITY_LABELS } from "../../../../shared/occurrences";
import type { OccurrenceCategory } from "../../../../drizzle/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEVERITY_CHART_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.occurrences.stats.useQuery({});

  const statCards = stats
    ? [
        {
          label: "Total de Ocorrências",
          value: stats.total,
          icon: MapPin,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "Pendentes",
          value: stats.byStatus.find((s) => s.status === "pending")?.total ?? 0,
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Em Análise",
          value: stats.byStatus.find((s) => s.status === "in_analysis")?.total ?? 0,
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Resolvidas",
          value: stats.byStatus.find((s) => s.status === "resolved")?.total ?? 0,
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
      ]
    : [];

  // Prepare chart data
  const categoryData = stats?.byCategory.map((c) => ({
    name: CATEGORY_LABELS[c.category as OccurrenceCategory] ?? c.category,
    value: c.total,
    color: CATEGORY_COLORS[c.category as OccurrenceCategory] ?? "#6b7280",
  })) ?? [];

  const severityData = stats?.bySeverity.map((s) => ({
    name: SEVERITY_LABELS[s.severity as keyof typeof SEVERITY_LABELS] ?? s.severity,
    value: s.total,
    color: SEVERITY_CHART_COLORS[s.severity as keyof typeof SEVERITY_CHART_COLORS] ?? "#6b7280",
  })) ?? [];

  const trendData = stats?.dailyTrend.map((d) => ({
    date: format(new Date(d.date), "dd/MM", { locale: ptBR }),
    total: d.total,
  })) ?? [];

  return (
    <AdminLayout>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.label} className="border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{card.value}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trend chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Tendência — Últimos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.42 0.13 155)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.42 0.13 155)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                        formatter={(v) => [v, "Ocorrências"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#2d6a4f"
                        strokeWidth={2}
                        fill="url(#colorTotal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Category pie chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                        formatter={(v, n, p) => [v, p.payload.name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => (
                          <span style={{ fontSize: "11px", color: "#374151" }}>{v}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Severity bar chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Distribuição por Gravidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {severityData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={severityData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                        formatter={(v) => [v, "Ocorrências"]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {severityData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status summary */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Resumo por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.byStatus.map((s) => {
                    const pct = stats.total > 0 ? Math.round((s.total / stats.total) * 100) : 0;
                    const colorMap: Record<string, string> = {
                      pending: "bg-amber-500",
                      in_analysis: "bg-blue-500",
                      resolved: "bg-emerald-500",
                      rejected: "bg-red-500",
                    };
                    return (
                      <div key={s.status}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status}
                          </span>
                          <span className="font-medium text-foreground">
                            {s.total} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${colorMap[s.status] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!stats?.byStatus.length) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Sem dados disponíveis
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
