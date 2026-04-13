"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Trash2, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Budget {
  id: number;
  status: string;
  event_date: string | null;
  total_cached: number;
  client: { id: number; name: string } | null;
  theme: { id: number; name: string; emoji: string; color: string } | null;
  items: { id: number }[];
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-stone-200 text-stone-700" },
  sent: { label: "Enviado", color: "bg-blue-100 text-blue-700" },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700" },
  paid: { label: "Pago", color: "bg-amber-100 text-amber-700" },
  done: { label: "Realizado", color: "bg-purple-100 text-purple-700" },
};

const filterOptions = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "approved", label: "Aprovado" },
  { value: "paid", label: "Pago" },
  { value: "done", label: "Realizado" },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filter, setFilter] = useState("");
  const router = useRouter();

  const fetchBudgets = () => {
    const params = filter ? `?status=${filter}` : "";
    api.get(`/api/budgets${params}`).then((r) => setBudgets(r.data));
  };

  useEffect(() => {
    fetchBudgets();
  }, [filter]);

  const handleCreate = async () => {
    const res = await api.post("/api/budgets", {});
    router.push(`/budgets/${res.data.id}`);
  };

  const handleDuplicate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await api.post(`/api/budgets/${id}/duplicate`);
    toast.success("Orcamento duplicado!");
    fetchBudgets();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/api/budgets/${id}`);
    toast.success("Orcamento excluido!");
    fetchBudgets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === opt.value
                  ? "bg-amber-600 text-white"
                  : "bg-white text-stone-600 border border-[#E7E5E4] hover:bg-stone-50"
              }`}
              style={{ borderRadius: 8 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleCreate}
          className="text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #FBBF24, #D97706)",
            borderRadius: 8,
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Nenhum orcamento encontrado</p>
            <p className="text-sm text-stone-400 mt-1">
              Crie seu primeiro orcamento clicando no botao acima
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const sm = statusMap[b.status] || statusMap.draft;
            return (
              <Card
                key={b.id}
                className="border-[#E7E5E4] cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderRadius: 12 }}
                onClick={() => router.push(`/budgets/${b.id}`)}
              >
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${sm.color} border-0`} style={{ borderRadius: 6 }}>
                      {sm.label}
                    </Badge>
                    <span className="text-xs text-stone-400">#{b.id}</span>
                  </div>

                  <div>
                    <p className="font-semibold text-stone-800">
                      {b.client?.name || "Sem cliente"}
                    </p>
                    {b.theme && (
                      <p className="text-sm text-stone-500">
                        {b.theme.emoji} {b.theme.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-stone-400">
                    <span>{b.items.length} itens</span>
                    {b.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.event_date)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4]">
                    <span className="text-lg font-bold text-stone-800">
                      {formatCurrency(b.total_cached)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleDuplicate(b.id, e)}
                        className="p-1.5 text-stone-400 hover:text-blue-600 rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(b.id, e)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
