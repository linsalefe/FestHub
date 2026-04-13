"use client";

import { useEffect, useState } from "react";
import {
  FileSignature,
  Plus,
  FileText,
  Download,
  Trash2,
  Edit3,
  ArrowRight,
  X,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface ContractData {
  id: number;
  contract_number: string;
  status: string;
  event_date: string;
  event_time: string | null;
  event_address: string | null;
  event_duration: string | null;
  montage_time: string | null;
  demontage_time: string | null;
  total_value: number;
  down_payment: number;
  down_payment_date: string | null;
  remaining_value: number;
  remaining_payment_date: string | null;
  payment_method: string | null;
  cancellation_policy: string | null;
  additional_clauses: string | null;
  client_document: string | null;
  client_address: string | null;
  notes: string | null;
  budget_id: number;
  client_id: number;
  client: { id: number; name: string; phone: string | null; email: string | null } | null;
  budget_summary: { id: number; total_cached: number; status: string } | null;
  created_at: string;
}

interface BudgetOption {
  id: number;
  total_cached: number;
  client: { id: number; name: string } | null;
  client_id: number | null;
  status: string;
  event_date: string | null;
  event_address: string | null;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Rascunho", bg: "bg-[#F0F1F6]", text: "text-[#7880A0]" },
  sent: { label: "Enviado", bg: "bg-[#F0F4FA]", text: "text-[#7B9ACC]" },
  signed: { label: "Assinado", bg: "bg-[#FFF8EC]", text: "text-[#D07840]" },
  active: { label: "Ativo", bg: "bg-[#EEF7ED]", text: "text-[#5AAF50]" },
  completed: { label: "Concluido", bg: "bg-[#EEF0F8]", text: "text-[#4A5BA8]" },
  cancelled: { label: "Cancelado", bg: "bg-red-50", text: "text-red-500" },
};

const statusFlow = ["draft", "sent", "signed", "active", "completed"];

const paymentMethods = ["PIX", "Dinheiro", "Cartao credito", "Cartao debito", "Transferencia", "Boleto"];

export default function ContratosPage() {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    budget_id: "",
    client_id: "",
    event_date: "",
    event_time: "",
    event_address: "",
    event_duration: "",
    montage_time: "",
    demontage_time: "",
    total_value: "",
    down_payment: "",
    down_payment_date: "",
    remaining_value: "",
    remaining_payment_date: "",
    payment_method: "PIX",
    cancellation_policy: "Em caso de cancelamento com menos de 7 dias do evento, sera cobrada multa de 30% do valor total.",
    additional_clauses: "",
    client_document: "",
    client_address: "",
    notes: "",
    status: "draft",
  });

  const fetchContracts = () => {
    setLoading(true);
    let url = "/api/contracts";
    if (filterStatus) url += `?status=${filterStatus}`;
    api.get(url).then((r) => setContracts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
    api.get("/api/budgets").then((r) => setBudgets(r.data)).catch(() => {});
  }, [filterStatus]);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({
      budget_id: "",
      client_id: "",
      event_date: "",
      event_time: "",
      event_address: "",
      event_duration: "",
      montage_time: "",
      demontage_time: "",
      total_value: "",
      down_payment: "",
      down_payment_date: "",
      remaining_value: "",
      remaining_payment_date: "",
      payment_method: "PIX",
      cancellation_policy: "Em caso de cancelamento com menos de 7 dias do evento, sera cobrada multa de 30% do valor total.",
      additional_clauses: "",
      client_document: "",
      client_address: "",
      notes: "",
      status: "draft",
    });
    setShowDialog(true);
  };

  const openEditDialog = (c: ContractData) => {
    setEditingId(c.id);
    setForm({
      budget_id: String(c.budget_id),
      client_id: String(c.client_id),
      event_date: c.event_date || "",
      event_time: c.event_time || "",
      event_address: c.event_address || "",
      event_duration: c.event_duration || "",
      montage_time: c.montage_time || "",
      demontage_time: c.demontage_time || "",
      total_value: String(c.total_value),
      down_payment: String(c.down_payment),
      down_payment_date: c.down_payment_date || "",
      remaining_value: String(c.remaining_value),
      remaining_payment_date: c.remaining_payment_date || "",
      payment_method: c.payment_method || "PIX",
      cancellation_policy: c.cancellation_policy || "",
      additional_clauses: c.additional_clauses || "",
      client_document: c.client_document || "",
      client_address: c.client_address || "",
      notes: c.notes || "",
      status: c.status,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.budget_id || !form.client_id || !form.event_date || !form.total_value) {
      toast.error("Preencha os campos obrigatorios");
      return;
    }
    const payload = {
      budget_id: parseInt(form.budget_id),
      client_id: parseInt(form.client_id),
      event_date: form.event_date,
      event_time: form.event_time || null,
      event_address: form.event_address || null,
      event_duration: form.event_duration || null,
      montage_time: form.montage_time || null,
      demontage_time: form.demontage_time || null,
      total_value: parseFloat(form.total_value),
      down_payment: parseFloat(form.down_payment) || 0,
      down_payment_date: form.down_payment_date || null,
      remaining_value: parseFloat(form.remaining_value) || 0,
      remaining_payment_date: form.remaining_payment_date || null,
      payment_method: form.payment_method || null,
      cancellation_policy: form.cancellation_policy || null,
      additional_clauses: form.additional_clauses || null,
      client_document: form.client_document || null,
      client_address: form.client_address || null,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api.put(`/api/contracts/${editingId}`, { ...payload, status: form.status });
        toast.success("Contrato atualizado!");
      } else {
        await api.post("/api/contracts", payload);
        toast.success("Contrato criado!");
      }
      setShowDialog(false);
      fetchContracts();
    } catch {
      toast.error("Erro ao salvar contrato");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/contracts/${id}`);
      toast.success("Contrato excluido!");
      fetchContracts();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/api/contracts/${id}/status`, { status });
      toast.success(`Status alterado para ${statusConfig[status]?.label || status}`);
      fetchContracts();
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDownloadPdf = async (id: number, contractNumber: string) => {
    try {
      const r = await api.get(`/api/contracts/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato-${contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF gerado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleFromBudget = async (budgetId: number) => {
    try {
      const r = await api.post(`/api/contracts/from-budget/${budgetId}`);
      toast.success("Contrato gerado do orcamento!");
      setShowBudgetDialog(false);
      fetchContracts();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao gerar contrato");
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  const statusFilters = [
    { key: "", label: "Todos" },
    { key: "draft", label: "Rascunho" },
    { key: "sent", label: "Enviado" },
    { key: "signed", label: "Assinado" },
    { key: "active", label: "Ativo" },
    { key: "completed", label: "Concluido" },
    { key: "cancelled", label: "Cancelado" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-quicksand)] text-3xl font-bold text-[#1E2247] tracking-tight">
            Contratos
          </h1>
          <p className="text-[#7880A0] text-sm mt-1">Gerencie seus contratos de servico</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowBudgetDialog(true)}
            variant="outline"
            className="font-semibold"
            style={{ borderRadius: 12 }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Gerar do Orcamento
          </Button>
          <Button
            onClick={openNewDialog}
            className="text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #4A5BA8, #3A4B98)", borderRadius: 12 }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              filterStatus === f.key
                ? "bg-[#4A5BA8] text-white"
                : "bg-[#F0F1F6] text-[#7880A0] hover:bg-[#E2E4EE]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contract List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-[#E2E4EE] rounded-2xl">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-[#E2E4EE] rounded-2xl">
          <CardContent className="py-16 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-[#E2E4EE] mb-3" />
            <p className="text-[#7880A0] text-sm">Nenhum contrato encontrado</p>
            <p className="text-[#7880A0] text-xs mt-1">Crie um contrato ou gere a partir de um orcamento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((c) => {
            const sc = statusConfig[c.status] || statusConfig.draft;
            const nextStatus = getNextStatus(c.status);
            return (
              <Card
                key={c.id}
                className="border-[#E2E4EE] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-[#7880A0]">{c.contract_number}</span>
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-medium rounded-full ${sc.bg} ${sc.text}`}>
                      {sc.label}
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-quicksand)] text-base font-bold text-[#1E2247] mb-1">
                    {c.client?.name || "Sem cliente"}
                  </h3>

                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-[#7880A0]">
                      Evento: {formatDate(c.event_date)}
                      {c.event_time && ` as ${c.event_time.slice(0, 5)}`}
                    </p>
                    {c.event_address && (
                      <p className="text-xs text-[#7880A0] truncate">{c.event_address}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-[#4A5BA8]">
                      {formatCurrency(c.total_value)}
                    </span>
                    {c.down_payment > 0 && (
                      <span className="text-xs text-[#7880A0]">
                        Sinal: {formatCurrency(c.down_payment)}
                      </span>
                    )}
                  </div>

                  <Separator className="mb-3" />

                  <div className="flex items-center gap-1">
                    {nextStatus && c.status !== "cancelled" && (
                      <button
                        onClick={() => handleChangeStatus(c.id, nextStatus)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#EEF0F8] text-[#4A5BA8] hover:bg-[#DDE1F0] transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {statusConfig[nextStatus]?.label}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdf(c.id, c.contract_number)}
                      title="Gerar PDF"
                      className="p-1.5 rounded-lg text-[#7880A0] hover:bg-[#EEF0F8] hover:text-[#4A5BA8] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditDialog(c)}
                      title="Editar"
                      className="p-1.5 rounded-lg text-[#7880A0] hover:bg-[#EEF0F8] hover:text-[#4A5BA8] transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Excluir"
                      className="p-1.5 rounded-lg text-[#7880A0] hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contract Form Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="font-[family-name:var(--font-quicksand)] text-xl font-bold text-[#1E2247]">
                {editingId ? "Editar Contrato" : "Novo Contrato"}
              </h2>
              <button onClick={() => setShowDialog(false)} className="text-[#7880A0] hover:text-[#1E2247]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Dados do Evento */}
              <div>
                <h3 className="text-xs font-semibold text-[#7880A0] uppercase tracking-wider mb-3">Dados do Evento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Orcamento</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                      value={form.budget_id}
                      onChange={(e) => {
                        const bid = e.target.value;
                        setForm({ ...form, budget_id: bid });
                        if (bid) {
                          const b = budgets.find((x) => x.id === parseInt(bid));
                          if (b) {
                            setForm((f) => ({
                              ...f,
                              budget_id: bid,
                              client_id: b.client_id ? String(b.client_id) : f.client_id,
                              event_date: b.event_date || f.event_date,
                              event_address: b.event_address || f.event_address,
                              total_value: String(b.total_cached),
                              down_payment: String(Math.round(b.total_cached * 0.5 * 100) / 100),
                              remaining_value: String(Math.round(b.total_cached * 0.5 * 100) / 100),
                            }));
                          }
                        }
                      }}
                    >
                      <option value="">Selecionar...</option>
                      {budgets.map((b) => (
                        <option key={b.id} value={b.id}>
                          #{b.id} - {b.client?.name || "Sem cliente"} ({formatCurrency(b.total_cached)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Data do Evento</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Horario</Label>
                    <Input
                      className="mt-1"
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Duracao</Label>
                    <Input
                      className="mt-1"
                      value={form.event_duration}
                      onChange={(e) => setForm({ ...form, event_duration: e.target.value })}
                      placeholder="Ex: 4 horas"
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Endereco</Label>
                    <Input
                      className="mt-1"
                      value={form.event_address}
                      onChange={(e) => setForm({ ...form, event_address: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Horario Montagem</Label>
                    <Input
                      className="mt-1"
                      type="time"
                      value={form.montage_time}
                      onChange={(e) => setForm({ ...form, montage_time: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Horario Desmontagem</Label>
                    <Input
                      className="mt-1"
                      type="time"
                      value={form.demontage_time}
                      onChange={(e) => setForm({ ...form, demontage_time: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados do Cliente */}
              <div>
                <h3 className="text-xs font-semibold text-[#7880A0] uppercase tracking-wider mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#7880A0]">CPF/CNPJ</Label>
                    <Input
                      className="mt-1"
                      value={form.client_document}
                      onChange={(e) => setForm({ ...form, client_document: e.target.value })}
                      placeholder="000.000.000-00"
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Endereco do Cliente</Label>
                    <Input
                      className="mt-1"
                      value={form.client_address}
                      onChange={(e) => setForm({ ...form, client_address: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Valores */}
              <div>
                <h3 className="text-xs font-semibold text-[#7880A0] uppercase tracking-wider mb-3">Valores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Valor Total (R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={form.total_value}
                      onChange={(e) => {
                        const total = parseFloat(e.target.value) || 0;
                        setForm({
                          ...form,
                          total_value: e.target.value,
                          down_payment: String(Math.round(total * 0.5 * 100) / 100),
                          remaining_value: String(Math.round(total * 0.5 * 100) / 100),
                        });
                      }}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Sinal (R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={form.down_payment}
                      onChange={(e) => setForm({ ...form, down_payment: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Restante (R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={form.remaining_value}
                      onChange={(e) => setForm({ ...form, remaining_value: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Forma de Pagamento</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Data do Sinal</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={form.down_payment_date}
                      onChange={(e) => setForm({ ...form, down_payment_date: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Data do Restante</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={form.remaining_payment_date}
                      onChange={(e) => setForm({ ...form, remaining_payment_date: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Termos */}
              <div>
                <h3 className="text-xs font-semibold text-[#7880A0] uppercase tracking-wider mb-3">Termos</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-[#7880A0]">Politica de Cancelamento</Label>
                    <Textarea
                      className="mt-1"
                      value={form.cancellation_policy}
                      onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
                      rows={2}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Clausulas Adicionais</Label>
                    <Textarea
                      className="mt-1"
                      value={form.additional_clauses}
                      onChange={(e) => setForm({ ...form, additional_clauses: e.target.value })}
                      rows={2}
                      placeholder="Clausulas adicionais ao contrato..."
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#7880A0]">Observacoes</Label>
                    <Textarea
                      className="mt-1"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              {editingId && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-[#7880A0]">Status</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <Button
                onClick={handleSave}
                className="w-full text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #4A5BA8, #3A4B98)", borderRadius: 12 }}
              >
                {editingId ? "Atualizar Contrato" : "Criar Contrato"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* From Budget Dialog */}
      {showBudgetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-[#1E2247]">
                Gerar Contrato do Orcamento
              </h2>
              <button onClick={() => setShowBudgetDialog(false)} className="text-[#7880A0] hover:text-[#1E2247]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-[#7880A0] mb-4">
                Selecione um orcamento com cliente vinculado
              </p>
              {budgets.filter((b) => b.client_id).length === 0 ? (
                <p className="text-sm text-[#7880A0] text-center py-4">Nenhum orcamento com cliente</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {budgets
                    .filter((b) => b.client_id)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleFromBudget(b.id)}
                        className="w-full text-left p-3 rounded-lg border border-[#E2E4EE] hover:border-[#4A5BA8] hover:bg-[#FAFBFE] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1E2247]">
                            Orcamento #{b.id}
                          </span>
                          <span className="text-sm font-bold text-[#4A5BA8]">
                            {formatCurrency(b.total_cached)}
                          </span>
                        </div>
                        <p className="text-xs text-[#7880A0] mt-0.5">
                          {b.client?.name || "Sem cliente"}
                          {b.event_date && ` - ${formatDate(b.event_date)}`}
                        </p>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
