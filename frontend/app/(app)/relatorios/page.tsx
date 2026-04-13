"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Package, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#4A5BA8", "#E8A030", "#5AAF50", "#7B9ACC", "#D07840", "#9B59B6", "#E74C3C", "#1ABC9C"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthRevenue {
  month: number;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  events_count: number;
}
interface ThemeRevenue {
  theme_name: string;
  theme_emoji: string;
  count: number;
  revenue: number;
}
interface Funnel {
  total_leads: number;
  total_budgets: number;
  budget_sent: number;
  approved: number;
  paid: number;
  done: number;
  conversion_rate: number;
}
interface TopClient {
  client_name: string;
  events_count: number;
  total_revenue: number;
}
interface TicketTrend {
  month: number;
  year: number;
  avg_ticket: number;
  count: number;
}
interface ItemRank {
  name: string;
  category: string;
  times_used: number;
  total_revenue: number;
}

export default function RelatoriosPage() {
  const [months, setMonths] = useState(12);
  const [revenueData, setRevenueData] = useState<MonthRevenue[]>([]);
  const [themeData, setThemeData] = useState<ThemeRevenue[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [ticketData, setTicketData] = useState<TicketTrend[]>([]);
  const [itemsRank, setItemsRank] = useState<ItemRank[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async (m: number) => {
    setLoading(true);
    try {
      const [rev, theme, fun, clients, ticket, items] = await Promise.all([
        api.get(`/api/reports/revenue-by-month?months=${m}`),
        api.get("/api/reports/revenue-by-theme"),
        api.get("/api/reports/conversion-funnel"),
        api.get("/api/reports/top-clients"),
        api.get(`/api/reports/avg-ticket-trend?months=${m}`),
        api.get("/api/reports/items-ranking"),
      ]);
      setRevenueData(rev.data);
      setThemeData(theme.data);
      setFunnel(fun.data);
      setTopClients(clients.data);
      setTicketData(ticket.data);
      setItemsRank(items.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(months);
  }, [months]);

  const chartRevenue = revenueData.map((d) => ({
    name: `${MONTHS[d.month - 1]}/${String(d.year).slice(2)}`,
    receitas: d.revenue,
    despesas: d.expenses,
    lucro: d.profit,
  }));

  const chartTicket = ticketData.map((d) => ({
    name: `${MONTHS[d.month - 1]}/${String(d.year).slice(2)}`,
    ticket: d.avg_ticket,
    festas: d.count,
  }));

  const funnelSteps = funnel
    ? [
        { name: "Leads", value: funnel.total_leads },
        { name: "Orçamentos", value: funnel.total_budgets },
        { name: "Enviados", value: funnel.budget_sent },
        { name: "Aprovados", value: funnel.approved },
        { name: "Pagos", value: funnel.paid },
        { name: "Realizados", value: funnel.done },
      ]
    : [];

  const filterOptions = [
    { value: 3, label: "3 meses" },
    { value: 6, label: "6 meses" },
    { value: 12, label: "12 meses" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[350px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EEF0F8]">
            <BarChart3 className="h-6 w-6 text-[#4A5BA8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E2247]">Relatórios</h1>
            <p className="text-sm text-[#7880A0]">Análise completa do seu negócio</p>
          </div>
        </div>
        <div className="flex gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                months === opt.value
                  ? "bg-[#4A5BA8] text-white"
                  : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#F0F1F6]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Faturamento Mensal */}
        <Card className="lg:col-span-2 border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#4A5BA8]" />
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A5BA8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4A5BA8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8A030" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8A030" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#7880A0" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#7880A0" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 8, borderColor: "#E2E4EE" }}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="#4A5BA8" fill="url(#colorRev)" strokeWidth={2} name="Receitas" />
                  <Area type="monotone" dataKey="despesas" stroke="#E8A030" fill="url(#colorExp)" strokeWidth={2} name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Receita por Tema */}
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#E8A030]" />
              Receita por Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {themeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={themeData.map((t) => ({ name: `${t.theme_emoji} ${t.theme_name}`, value: t.revenue }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {themeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#7880A0] text-sm">
                  Sem dados de temas
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Funil de Conversão */}
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#5AAF50]" />
              Funil de Conversão
              {funnel && (
                <span className="ml-auto text-sm font-normal text-[#5AAF50]">
                  {funnel.conversion_rate}% conversão
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col justify-center gap-2">
              {funnelSteps.map((step, i) => {
                const maxVal = funnelSteps[0]?.value || 1;
                const pct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
                return (
                  <div key={step.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#7880A0] w-20 text-right shrink-0">{step.name}</span>
                    <div className="flex-1 h-8 bg-[#F0F1F6] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-2 text-xs font-medium text-white transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      >
                        {step.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. Top Clientes */}
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#4A5BA8]" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {topClients.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClients.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#7880A0" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="client_name" type="category" width={100} tick={{ fontSize: 11 }} stroke="#7880A0" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="total_revenue" fill="#4A5BA8" radius={[0, 6, 6, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#7880A0] text-sm">
                  Sem dados de clientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Evolução Ticket Médio */}
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#E8A030]" />
              Evolução do Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartTicket}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#7880A0" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#7880A0" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value, name) => [name === "ticket" ? formatCurrency(Number(value)) : value, name === "ticket" ? "Ticket Médio" : "Festas"]} />
                  <Line type="monotone" dataKey="ticket" stroke="#E8A030" strokeWidth={2} dot={{ r: 4, fill: "#E8A030" }} name="ticket" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 6. Itens Mais Vendidos */}
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-[#5AAF50]" />
              Itens Mais Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {itemsRank.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemsRank.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#7880A0" angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#7880A0" />
                    <Tooltip />
                    <Bar dataKey="times_used" fill="#5AAF50" radius={[6, 6, 0, 0]} name="Vezes usado" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#7880A0] text-sm">
                  Sem dados de itens
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
