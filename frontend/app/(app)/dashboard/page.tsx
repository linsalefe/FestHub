"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  FileText,
  Target,
  Users,
  Plus,
  Package,
  CalendarDays,
  UserPlus,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useAuth } from "@/contexts/auth-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stats {
  total_budgets: number;
  approved_count: number;
  total_revenue: number;
  avg_ticket: number;
  conversion_rate: number;
  total_clients: number;
  monthly_revenue?: { month: string; value: number }[];
}

interface Pipeline {
  draft: number;
  sent: number;
  approved: number;
  paid: number;
  done: number;
}

interface PipelineStage {
  id: number;
  name: string;
  color: string;
  order: number;
  count?: number;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  start_time?: string;
}

interface Lead {
  id: number;
  name: string;
  event_type: string;
  estimated_value: number;
  created_at?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  paid: "Pago",
  done: "Realizado",
};

const statusColors: Record<string, string> = {
  draft: "#7880A0",
  sent: "#7B9ACC",
  approved: "#5AAF50",
  paid: "#4A5BA8",
  done: "#E8A030",
};

const defaultMonthlyData = [
  { month: "Jan", value: 4200 },
  { month: "Fev", value: 5800 },
  { month: "Mar", value: 4900 },
  { month: "Abr", value: 7200 },
  { month: "Mai", value: 6100 },
  { month: "Jun", value: 8400 },
  { month: "Jul", value: 7800 },
  { month: "Ago", value: 9200 },
  { month: "Set", value: 8600 },
  { month: "Out", value: 10500 },
  { month: "Nov", value: 11200 },
  { month: "Dez", value: 13000 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return (
    <Card className="border-[#E2E4EE] rounded-2xl shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Chart Tooltip                                              */
/* ------------------------------------------------------------------ */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E2E4EE] bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-[#7880A0] mb-1">{label}</p>
      <p className="font-[family-name:var(--font-quicksand)] text-sm font-bold text-[#1E2247]">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  /* Fetch all data */
  useEffect(() => {
    api.get("/api/dashboard/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/api/dashboard/pipeline").then((r) => setPipeline(r.data)).catch(() => {});
    api
      .get("/api/pipelines")
      .then((r) => {
        const stages: PipelineStage[] = Array.isArray(r.data)
          ? r.data
          : r.data?.results ?? r.data?.stages ?? [];
        setPipelineStages(stages);
      })
      .catch(() => {});
    api
      .get("/api/calendar")
      .then((r) => {
        const items: CalendarEvent[] = Array.isArray(r.data)
          ? r.data
          : r.data?.results ?? r.data?.events ?? [];
        setEvents(items.slice(0, 5));
      })
      .catch(() => {});
    api
      .get("/api/leads")
      .then((r) => {
        const items: Lead[] = Array.isArray(r.data)
          ? r.data
          : r.data?.results ?? r.data?.leads ?? [];
        setLeads(items.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  /* Derived */
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const firstName = user?.name?.split(" ")[0] ?? "";

  const revenueData = useMemo(
    () => stats?.monthly_revenue ?? defaultMonthlyData,
    [stats],
  );

  const pipelineTotal = pipeline
    ? Object.values(pipeline).reduce((a, b) => a + b, 0)
    : 0;

  const pipelineBarData = useMemo(() => {
    if (!pipeline) return [];
    return (Object.keys(statusLabels) as Array<keyof Pipeline>).map((key) => ({
      name: statusLabels[key],
      count: pipeline[key] || 0,
      color: statusColors[key],
    }));
  }, [pipeline]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8 pb-8">
      {/* ------ Header ------ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-quicksand)] text-3xl font-bold text-[#1E2247] tracking-tight">
            {greeting}, {firstName}! <span className="inline-block animate-pulse">&#10024;</span>
          </h1>
          <p className="text-[#7880A0] text-sm mt-1 font-[family-name:var(--font-dm-sans)]">
            Aqui esta o resumo do seu negocio hoje.
          </p>
        </div>
        <Button
          onClick={() => router.push("/budgets")}
          className="text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #E8A030 0%, #D07840 100%)",
            borderRadius: 12,
            padding: "10px 20px",
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Orcamento
        </Button>
      </div>

      {/* ------ Stat Cards ------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats ? (
          <>
            {/* Faturamento */}
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7880A0] font-[family-name:var(--font-dm-sans)]">Faturamento</p>
                    <p className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-[#5AAF50] mt-1">
                      {formatCurrency(stats.total_revenue)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-[#EEF7ED] flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#5AAF50]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orcamentos */}
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7880A0] font-[family-name:var(--font-dm-sans)]">Orcamentos</p>
                    <p className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-[#7B9ACC] mt-1">
                      {stats.total_budgets}
                    </p>
                    <p className="text-xs text-[#7880A0] mt-0.5">
                      {formatPercent(stats.conversion_rate)} conversao
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-[#F0F4FA] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#7B9ACC]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Medio */}
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7880A0] font-[family-name:var(--font-dm-sans)]">Ticket Medio</p>
                    <p className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-[#D07840] mt-1">
                      {formatCurrency(stats.avg_ticket)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-[#FFF8EC] flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#D07840]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clientes */}
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7880A0] font-[family-name:var(--font-dm-sans)]">Clientes</p>
                    <p className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-[#4A5BA8] mt-1">
                      {stats.total_clients}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-[#EEF0F8] flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#4A5BA8]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      {/* ------ Revenue Area Chart + Pipeline Bar ------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart - 2 cols */}
        <Card className="border-[#E2E4EE] rounded-2xl shadow-sm lg:col-span-2 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
                <TrendingUp className="inline h-5 w-5 mr-2 text-[#4A5BA8] -mt-0.5" />
                Faturamento Mensal
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A5BA8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4A5BA8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#7880A0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#7880A0" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ReTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4A5BA8"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#4A5BA8", fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Bar Chart - 1 col */}
        <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineBarData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#7880A0" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#7880A0" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <ReTooltip
                      cursor={{ fill: "#F0F1F6" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E4EE",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {pipelineBarData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <SectionSkeleton rows={5} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------ Pipeline Stages Summary ------ */}
      {pipelineStages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#7880A0] uppercase tracking-wider mb-3 font-[family-name:var(--font-dm-sans)]">
            Estagios do Pipeline
          </h3>
          <div className="flex flex-wrap gap-3">
            {pipelineStages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-stretch rounded-xl border border-[#E2E4EE] bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-1.5" style={{ backgroundColor: stage.color || "#4A5BA8" }} />
                <div className="px-4 py-3">
                  <p className="text-xs text-[#7880A0] font-[family-name:var(--font-dm-sans)]">{stage.name}</p>
                  <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-[#1E2247]">
                    {stage.count ?? 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------ Pipeline Progress Bars (original) ------ */}
      <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
            Pipeline de Orcamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pipeline ? (
            <div className="space-y-3">
              {(Object.keys(statusLabels) as Array<keyof Pipeline>).map((key) => {
                const count = pipeline[key] || 0;
                const pct = pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-[#7880A0] w-24 font-[family-name:var(--font-dm-sans)]">
                      {statusLabels[key]}
                    </span>
                    <div className="flex-1 h-6 bg-[#F0F1F6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: statusColors[key] }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs font-[family-name:var(--font-quicksand)] font-semibold min-w-[32px] justify-center">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <SectionSkeleton rows={5} />
          )}
        </CardContent>
      </Card>

      {/* ------ Events + Leads row ------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Proximos Eventos */}
        <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
                <CalendarDays className="inline h-5 w-5 mr-2 text-[#E8A030] -mt-0.5" />
                Proximos Eventos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4A5BA8] text-xs hover:text-[#4A5BA8]/80"
                onClick={() => router.push("/calendar")}
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FAFBFE] transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#FFF8EC] flex items-center justify-center shrink-0">
                      <span className="font-[family-name:var(--font-quicksand)] text-xs font-bold text-[#D07840]">
                        {formatShortDate(evt.date)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1E2247] truncate">{evt.title}</p>
                      {evt.start_time && (
                        <p className="text-xs text-[#7880A0]">{evt.start_time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7880A0] py-4 text-center font-[family-name:var(--font-dm-sans)]">
                Nenhum evento proximo encontrado.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leads Recentes */}
        <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
                <UserPlus className="inline h-5 w-5 mr-2 text-[#5AAF50] -mt-0.5" />
                Leads Recentes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4A5BA8] text-xs hover:text-[#4A5BA8]/80"
                onClick={() => router.push("/leads")}
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leads.length > 0 ? (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#FAFBFE] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1E2247] truncate">{lead.name}</p>
                      <p className="text-xs text-[#7880A0]">{lead.event_type}</p>
                    </div>
                    <span className="font-[family-name:var(--font-quicksand)] text-sm font-bold text-[#4A5BA8] ml-3 shrink-0">
                      {formatCurrency(lead.estimated_value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7880A0] py-4 text-center font-[family-name:var(--font-dm-sans)]">
                Nenhum lead recente encontrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------ Quick Actions ------ */}
      <div>
        <h3 className="text-sm font-semibold text-[#7880A0] uppercase tracking-wider mb-3 font-[family-name:var(--font-dm-sans)]">
          Acoes Rapidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="border-[#E2E4EE] rounded-2xl cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-white group"
            onClick={() => router.push("/budgets")}
          >
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#EEF0F8] flex items-center justify-center group-hover:bg-[#4A5BA8] transition-colors duration-200">
                <FileText className="h-6 w-6 text-[#4A5BA8] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="font-semibold text-[#1E2247] text-sm">Novo Orcamento</p>
                <p className="text-xs text-[#7880A0]">Criar orcamento</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-[#E2E4EE] rounded-2xl cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-white group"
            onClick={() => router.push("/catalog")}
          >
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#FFF8EC] flex items-center justify-center group-hover:bg-[#E8A030] transition-colors duration-200">
                <Package className="h-6 w-6 text-[#E8A030] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="font-semibold text-[#1E2247] text-sm">Ver Catalogo</p>
                <p className="text-xs text-[#7880A0]">Itens de decoracao</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-[#E2E4EE] rounded-2xl cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-white group"
            onClick={() => router.push("/calendar")}
          >
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#EEF7ED] flex items-center justify-center group-hover:bg-[#5AAF50] transition-colors duration-200">
                <CalendarDays className="h-6 w-6 text-[#5AAF50] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="font-semibold text-[#1E2247] text-sm">Calendario</p>
                <p className="text-xs text-[#7880A0]">Proximos eventos</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-[#E2E4EE] rounded-2xl cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-white group"
            onClick={() => router.push("/leads")}
          >
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#F0F4FA] flex items-center justify-center group-hover:bg-[#7B9ACC] transition-colors duration-200">
                <UserPlus className="h-6 w-6 text-[#7B9ACC] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="font-semibold text-[#1E2247] text-sm">Leads</p>
                <p className="text-xs text-[#7880A0]">Gerenciar leads</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
