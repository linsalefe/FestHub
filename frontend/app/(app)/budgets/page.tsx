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
  draft: { label: "Rascunho", color: "bg-[#F0F1F6] text-[#7880A0]" },
  sent: { label: "Enviado", color: "bg-[#F0F4FA] text-[#7B9ACC]" },
  approved: { label: "Aprovado", color: "bg-[#EEF7ED] text-[#5AAF50]" },
  paid: { label: "Pago", color: "bg-[#EEF0F8] text-[#4A5BA8]" },
  done: { label: "Realizado", color: "bg-[#FFF8EC] text-[#E8A030]" },
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
                  ? "bg-[#4A5BA8] text-white"
                  : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#F0F1F6]"
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
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-[#E2E4EE] mx-auto mb-4" />
            <p className="text-[#7880A0] font-medium">Nenhum orcamento encontrado</p>
            <p className="text-sm text-[#7880A0] mt-1">
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
                className="border-[#E2E4EE] cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderRadius: 12 }}
                onClick={() => router.push(`/budgets/${b.id}`)}
              >
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${sm.color} border-0`} style={{ borderRadius: 6 }}>
                      {sm.label}
                    </Badge>
                    <span className="text-xs text-[#7880A0]">#{b.id}</span>
                  </div>

                  <div>
                    <p className="font-semibold text-[#1E2247]">
                      {b.client?.name || "Sem cliente"}
                    </p>
                    {b.theme && (
                      <p className="text-sm text-[#7880A0]">
                        {b.theme.emoji} {b.theme.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#7880A0]">
                    <span>{b.items.length} itens</span>
                    {b.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.event_date)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E4EE]">
                    <span className="text-lg font-bold text-[#1E2247]">
                      {formatCurrency(b.total_cached)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleDuplicate(b.id, e)}
                        className="p-1.5 text-[#7880A0] hover:text-[#4A5BA8] rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(b.id, e)}
                        className="p-1.5 text-[#7880A0] hover:text-red-600 rounded"
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
