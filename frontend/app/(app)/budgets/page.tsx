"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Copy,
  Trash2,
  FileText,
  Calendar,
  Search,
  MessageCircle,
  Clock,
  AlertTriangle,
  FileSignature,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface Budget {
  id: number;
  status: string;
  event_date: string | null;
  total_cached: number;
  validity_days: number | null;
  created_at: string;
  client: { id: number; name: string; phone?: string } | null;
  theme: { id: number; name: string; emoji: string; color: string } | null;
  items: { id: number; cost: number; price: number; quantity: number }[];
  variable_costs: { id: number; value: number }[];
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

type SortOption = "recent" | "value" | "expiring";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBudgets = async () => {
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await api.get(`/api/budgets${params}`);
      setBudgets(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [filter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = budgets.filter(
      (b) =>
        !q ||
        b.client?.name.toLowerCase().includes(q) ||
        b.theme?.name.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sort === "value") return (b.total_cached || 0) - (a.total_cached || 0);
      if (sort === "expiring") {
        const daysA = getValidityDays(a);
        const daysB = getValidityDays(b);
        return (daysA ?? 999) - (daysB ?? 999);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [budgets, search, sort]);

  const handleCreate = async () => {
    const res = await api.post("/api/budgets", {});
    router.push(`/budgets/${res.data.id}`);
  };

  const handleDuplicate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.post(`/api/budgets/${id}/duplicate`);
    toast.success("Orçamento duplicado!");
    fetchBudgets();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/api/budgets/${id}`);
    toast.success("Orçamento excluído!");
    fetchBudgets();
  };

  const getValidityDays = (b: Budget): number | null => {
    if (b.status !== "sent" || !b.validity_days || !b.created_at) return null;
    const created = new Date(b.created_at);
    const expiry = new Date(created.getTime() + b.validity_days * 86400000);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  };

  const getMargin = (b: Budget): number => {
    const totalCost = b.items.reduce((s, i) => s + (i.cost || 0) * (i.quantity || 1), 0);
    const total = b.total_cached || 0;
    if (total <= 0) return 0;
    return ((total - totalCost) / total) * 100;
  };

  const handleWhatsApp = (b: Budget, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!b.client?.phone) return;
    const msg = `Olá ${b.client.name}! 🎉\n\nSegue o orçamento da sua festa:\n\n${b.theme ? `🎨 Tema: ${b.theme.emoji} ${b.theme.name}\n` : ""}${b.event_date ? `📅 Data: ${formatDate(b.event_date)}\n` : ""}💰 Valor: ${formatCurrency(b.total_cached || 0)}\n\nAcesse os detalhes e me diga o que acha!`;
    window.open(whatsappLink(b.client.phone, msg), "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-24 ml-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === opt.value
                  ? "bg-[#4A5BA8] text-white"
                  : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#F0F1F6]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleCreate}
          className="text-white font-semibold shrink-0"
          style={{ background: "linear-gradient(135deg, #E8A030, #D07840)", borderRadius: 8 }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7880A0]" />
          <Input
            placeholder="Buscar por cliente ou tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            style={{ borderRadius: 8 }}
          />
        </div>
        <div className="flex gap-1">
          {(["recent", "value", "expiring"] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                sort === s
                  ? "bg-[#4A5BA8] text-white"
                  : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#F0F1F6]"
              }`}
            >
              {s === "recent" ? "Recente" : s === "value" ? "Maior valor" : "Vencendo"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-[#E2E4EE] mx-auto mb-4" />
            <p className="text-lg font-medium text-[#7880A0]">Nenhum orçamento encontrado</p>
            <p className="text-sm text-[#7880A0] mt-1">Crie seu primeiro orçamento clicando no botão acima</p>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((b, idx) => {
            const sm = statusMap[b.status] || statusMap.draft;
            const validityDays = getValidityDays(b);
            const margin = getMargin(b);

            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className="border-[#E2E4EE] cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  style={{ borderRadius: 12 }}
                  onClick={() => router.push(`/budgets/${b.id}`)}
                >
                  <CardContent className="pt-5 pb-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${sm.color} border-0`} style={{ borderRadius: 6 }}>{sm.label}</Badge>
                        {validityDays !== null && (
                          <Badge
                            className={`border-0 text-[10px] ${
                              validityDays < 0
                                ? "bg-red-50 text-red-600"
                                : validityDays <= 3
                                ? "bg-[#FFF8EC] text-[#E8A030]"
                                : "bg-[#EEF7ED] text-[#5AAF50]"
                            }`}
                          >
                            <Clock className="h-3 w-3 mr-0.5" />
                            {validityDays < 0 ? "Vencido" : `Vence em ${validityDays}d`}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-[#7880A0]">#{b.id}</span>
                    </div>

                    {/* Client & Theme */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-[#EEF0F8] shrink-0">
                        <AvatarFallback className="bg-[#EEF0F8] text-[#4A5BA8] text-xs font-bold">
                          {b.client?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1E2247] truncate">{b.client?.name || "Sem cliente"}</p>
                        {b.theme && (
                          <p className="text-sm text-[#7880A0] truncate">
                            {b.theme.emoji} {b.theme.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-[#7880A0]">
                      <span>{b.items.length} itens</span>
                      {b.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(b.event_date)}
                        </span>
                      )}
                      <span className={`font-medium ${margin >= 30 ? "text-[#5AAF50]" : margin >= 15 ? "text-[#E8A030]" : "text-red-500"}`}>
                        {margin.toFixed(0)}% margem
                      </span>
                    </div>

                    {/* Value & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E4EE]">
                      <span className="text-lg font-bold text-[#1E2247]">
                        {formatCurrency(b.total_cached)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.client?.phone && (
                          <button
                            onClick={(e) => handleWhatsApp(b, e)}
                            className="p-1.5 text-[#25D366] hover:bg-[#25D366]/10 rounded"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDuplicate(b.id, e)}
                          className="p-1.5 text-[#7880A0] hover:text-[#4A5BA8] rounded"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(b.id, e)}
                          className="p-1.5 text-[#7880A0] hover:text-red-600 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
