"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Target,
  Users,
  Plus,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";

interface Stats {
  total_budgets: number;
  approved_count: number;
  total_revenue: number;
  avg_ticket: number;
  conversion_rate: number;
  total_clients: number;
}

interface Pipeline {
  draft: number;
  sent: number;
  approved: number;
  paid: number;
  done: number;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  paid: "Pago",
  done: "Realizado",
};

const statusColors: Record<string, string> = {
  draft: "bg-stone-300",
  sent: "bg-blue-400",
  approved: "bg-emerald-400",
  paid: "bg-amber-400",
  done: "bg-purple-400",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get("/api/dashboard/stats").then((r) => setStats(r.data));
    api.get("/api/dashboard/pipeline").then((r) => setPipeline(r.data));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const pipelineTotal = pipeline
    ? Object.values(pipeline).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">
          {greeting}! ✨
        </h2>
        <Button
          onClick={() => router.push("/budgets")}
          className="text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #FBBF24, #D97706)",
            borderRadius: 8,
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo Orcamento
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Faturamento</p>
                <p className="text-2xl font-bold text-stone-800">
                  {stats ? formatCurrency(stats.total_revenue) : "..."}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Orcamentos</p>
                <p className="text-2xl font-bold text-stone-800">
                  {stats?.total_budgets ?? "..."}
                </p>
                <p className="text-xs text-stone-400">
                  {stats ? `${formatPercent(stats.conversion_rate)} conversao` : ""}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Ticket Medio</p>
                <p className="text-2xl font-bold text-stone-800">
                  {stats ? formatCurrency(stats.avg_ticket) : "..."}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Clientes</p>
                <p className="text-2xl font-bold text-stone-800">
                  {stats?.total_clients ?? "..."}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-stone-800">
            Pipeline de Orcamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pipeline && (
            <div className="space-y-3">
              {(Object.keys(statusLabels) as Array<keyof Pipeline>).map(
                (key) => {
                  const count = pipeline[key] || 0;
                  const pct =
                    pipelineTotal > 0
                      ? (count / pipelineTotal) * 100
                      : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-stone-600 w-24">
                        {statusLabels[key]}
                      </span>
                      <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColors[key]} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="border-[#E7E5E4] cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderRadius: 12 }}
          onClick={() => router.push("/budgets")}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">Novo Orcamento</p>
              <p className="text-sm text-stone-500">
                Crie um orcamento para seu proximo evento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-[#E7E5E4] cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderRadius: 12 }}
          onClick={() => router.push("/catalog")}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">Ver Catalogo</p>
              <p className="text-sm text-stone-500">
                Gerencie seus itens de decoracao
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
