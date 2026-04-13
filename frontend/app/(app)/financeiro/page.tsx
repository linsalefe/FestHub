"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Check,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  X,
  MessageCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  reference_date: string;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  budget_id: number | null;
  client_id: number | null;
  client_name: string | null;
  client_phone: string | null;
  budget_info: string | null;
  installment_number: number | null;
  total_installments: number | null;
  notes: string | null;
}

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  pending_income: number;
  pending_expense: number;
  overdue_count: number;
}

interface MonthlySummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

interface ClientOption {
  id: number;
  name: string;
}

interface BudgetOption {
  id: number;
  total_cached: number;
  client: { name: string } | null;
  status: string;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const incomeCategories = ["Venda de servico", "Sinal/Entrada", "Pagamento parcial", "Quitacao", "Outro"];
const expenseCategories = ["Material", "Transporte", "Fornecedor", "Ajudante", "Custo fixo", "Outro"];
const paymentMethods = ["PIX", "Dinheiro", "Cartao credito", "Cartao debito", "Transferencia", "Boleto"];

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Pago", bg: "bg-[#EEF7ED]", text: "text-[#5AAF50]" },
  pending: { label: "Pendente", bg: "bg-[#FFF8EC]", text: "text-[#D07840]" },
  overdue: { label: "Vencido", bg: "bg-red-50", text: "text-red-600" },
  cancelled: { label: "Cancelado", bg: "bg-[#F0F1F6]", text: "text-[#7880A0]" },
};

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E2E4EE] bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-[#7880A0] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTab, setFilterTab] = useState("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("income");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "PIX",
    reference_date: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "paid",
    client_id: "",
    budget_id: "",
    notes: "",
  });

  // From budget dialog
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/transactions").then((r) => setTransactions(r.data)),
      api.get("/api/transactions/summary").then((r) => setSummary(r.data)),
      api.get("/api/transactions/monthly").then((r) => setMonthly(r.data)),
      api.get("/api/clients").then((r) => setClients(r.data)),
      api.get("/api/budgets?status=approved").then((r) => setBudgets(r.data)).catch(() => {
        api.get("/api/budgets").then((r) => setBudgets(r.data)).catch(() => {});
      }),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const chartData = useMemo(() => {
    return monthly.map((m) => ({
      name: `${monthNames[m.month - 1]}/${String(m.year).slice(2)}`,
      Receitas: m.income,
      Despesas: m.expense,
    }));
  }, [monthly]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (filterTab === "income") list = list.filter((t) => t.type === "income");
    if (filterTab === "expense") list = list.filter((t) => t.type === "expense");
    if (filterTab === "pending") list = list.filter((t) => t.status === "pending");
    if (filterTab === "overdue") list = list.filter((t) => t.status === "overdue" || (t.status === "pending" && t.due_date && t.due_date < new Date().toISOString().split("T")[0]));
    if (filterType) list = list.filter((t) => t.type === filterType);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    return list;
  }, [transactions, filterTab, filterType, filterStatus]);

  const openNewDialog = (type: "income" | "expense") => {
    setDialogType(type);
    setEditingId(null);
    setForm({
      description: "",
      amount: "",
      category: type === "income" ? incomeCategories[0] : expenseCategories[0],
      payment_method: "PIX",
      reference_date: new Date().toISOString().split("T")[0],
      due_date: "",
      status: "paid",
      client_id: "",
      budget_id: "",
      notes: "",
    });
    setShowDialog(true);
  };

  const openEditDialog = (t: Transaction) => {
    setDialogType(t.type as "income" | "expense");
    setEditingId(t.id);
    setForm({
      description: t.description,
      amount: String(t.amount),
      category: t.category,
      payment_method: t.payment_method || "PIX",
      reference_date: t.reference_date,
      due_date: t.due_date || "",
      status: t.status,
      client_id: t.client_id ? String(t.client_id) : "",
      budget_id: t.budget_id ? String(t.budget_id) : "",
      notes: t.notes || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error("Preencha descricao e valor");
      return;
    }
    const payload = {
      type: dialogType,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method || null,
      reference_date: form.reference_date,
      due_date: form.due_date || null,
      status: form.status,
      client_id: form.client_id ? parseInt(form.client_id) : null,
      budget_id: form.budget_id ? parseInt(form.budget_id) : null,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api.put(`/api/transactions/${editingId}`, payload);
        toast.success("Transacao atualizada!");
      } else {
        await api.post("/api/transactions", payload);
        toast.success("Transacao criada!");
      }
      setShowDialog(false);
      fetchAll();
    } catch {
      toast.error("Erro ao salvar transacao");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      toast.success("Transacao excluida!");
      fetchAll();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handlePay = async (id: number) => {
    try {
      await api.patch(`/api/transactions/${id}/pay`);
      toast.success("Marcado como pago!");
      fetchAll();
    } catch {
      toast.error("Erro ao marcar como pago");
    }
  };

  const handleFromBudget = async (budgetId: number) => {
    try {
      await api.post(`/api/transactions/from-budget/${budgetId}`);
      toast.success("Transacoes geradas do orcamento!");
      setShowBudgetDialog(false);
      fetchAll();
    } catch {
      toast.error("Erro ao gerar transacoes");
    }
  };

  const tabs = [
    { key: "all", label: "Todos" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
    { key: "pending", label: "Pendentes" },
    { key: "overdue", label: "Vencidos" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-quicksand)] text-3xl font-bold text-[#1E2247] tracking-tight">
            Financeiro
          </h1>
          <p className="text-[#7880A0] text-sm mt-1">Controle suas receitas e despesas</p>
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
            onClick={() => openNewDialog("income")}
            className="text-white font-semibold"
            style={{ background: "#5AAF50", borderRadius: 12 }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Receita
          </Button>
          <Button
            onClick={() => openNewDialog("expense")}
            className="text-white font-semibold"
            style={{ background: "#DC2626", borderRadius: 12 }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summary ? (
          <>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-[#EEF7ED] flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#5AAF50]" />
                  </div>
                  <span className="text-xs text-[#7880A0]">Receitas</span>
                </div>
                <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-[#5AAF50]">
                  {formatCurrency(summary.total_income)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-xs text-[#7880A0]">Despesas</span>
                </div>
                <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-red-500">
                  {formatCurrency(summary.total_expense)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${summary.balance >= 0 ? "bg-[#EEF0F8]" : "bg-red-50"}`}>
                    <DollarSign className={`h-4 w-4 ${summary.balance >= 0 ? "text-[#4A5BA8]" : "text-red-500"}`} />
                  </div>
                  <span className="text-xs text-[#7880A0]">Saldo</span>
                </div>
                <p className={`font-[family-name:var(--font-quicksand)] text-lg font-bold ${summary.balance >= 0 ? "text-[#4A5BA8]" : "text-red-500"}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-[#FFF8EC] flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#D07840]" />
                  </div>
                  <span className="text-xs text-[#7880A0]">A receber</span>
                </div>
                <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-[#D07840]">
                  {formatCurrency(summary.pending_income)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="text-xs text-[#7880A0]">A pagar</span>
                </div>
                <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-orange-500">
                  {formatCurrency(summary.pending_expense)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-xs text-[#7880A0]">Vencidos</span>
                </div>
                <p className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-red-500">
                  {summary.overdue_count}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-[#E2E4EE] rounded-2xl shadow-sm">
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Monthly Chart */}
      <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
            <TrendingUp className="inline h-5 w-5 mr-2 text-[#4A5BA8] -mt-0.5" />
            Evolucao Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E4EE" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7880A0" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#7880A0" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <ReTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Receitas" fill="#5AAF50" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Despesas" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-[#E2E4EE] rounded-2xl shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg font-semibold text-[#1E2247] font-[family-name:var(--font-quicksand)]">
              Transacoes
            </CardTitle>
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    filterTab === tab.key
                      ? "bg-[#4A5BA8] text-white"
                      : "bg-[#F0F1F6] text-[#7880A0] hover:bg-[#E2E4EE]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-[#E2E4EE] mb-3" />
              <p className="text-[#7880A0] text-sm">Nenhuma transacao encontrada</p>
              <p className="text-[#7880A0] text-xs mt-1">Clique em &quot;Nova Receita&quot; ou &quot;Nova Despesa&quot; para comecar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs text-[#7880A0] font-medium px-3 pb-1 border-b border-[#E2E4EE]">
                <span className="col-span-1">Data</span>
                <span className="col-span-3">Descricao</span>
                <span className="col-span-2">Categoria</span>
                <span className="col-span-2">Cliente</span>
                <span className="col-span-1 text-right">Valor</span>
                <span className="col-span-1">Status</span>
                <span className="col-span-2 text-right">Acoes</span>
              </div>
              {filteredTransactions.map((t) => {
                const isOverdue = t.status === "pending" && t.due_date && t.due_date < new Date().toISOString().split("T")[0];
                const displayStatus = isOverdue ? "overdue" : t.status;
                const sc = statusConfig[displayStatus] || statusConfig.paid;
                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-[#FAFBFE] transition-colors"
                  >
                    <span className="col-span-1 text-xs text-[#7880A0]">
                      {formatDate(t.reference_date)}
                    </span>
                    <div className="col-span-3 flex items-center gap-2">
                      {t.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4 text-[#5AAF50] shrink-0" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-sm text-[#1E2247] truncate">{t.description}</span>
                    </div>
                    <span className="col-span-2 text-xs text-[#7880A0] truncate">{t.category}</span>
                    <span className="col-span-2 text-xs text-[#7880A0] truncate">{t.client_name || "-"}</span>
                    <span className={`col-span-1 text-sm font-semibold text-right ${t.type === "income" ? "text-[#5AAF50]" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                    <span className="col-span-1">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </span>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {(t.status === "pending" || isOverdue) && (
                        <>
                          <button
                            onClick={() => handlePay(t.id)}
                            title="Marcar como pago"
                            className="p-1.5 rounded-lg text-[#5AAF50] hover:bg-[#EEF7ED] transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          {t.client_phone && t.type === "income" && (
                            <a
                              href={whatsappLink(
                                t.client_phone,
                                `Olá ${t.client_name}! 😊\n\nPassando para lembrar sobre o pagamento pendente:\n\n📋 ${t.description}\n💰 Valor: ${formatCurrency(t.amount)}${t.due_date ? `\n📅 Vencimento: ${formatDate(t.due_date)}` : ""}\n\nQualquer dúvida, estou à disposição!`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Cobrar via WhatsApp"
                              className="p-1.5 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => openEditDialog(t)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-[#7880A0] hover:bg-[#EEF0F8] hover:text-[#4A5BA8] transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-[#7880A0] hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="font-[family-name:var(--font-quicksand)] text-xl font-bold text-[#1E2247]">
                {editingId ? "Editar Transacao" : "Nova Transacao"}
              </h2>
              <button onClick={() => setShowDialog(false)} className="text-[#7880A0] hover:text-[#1E2247]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            {!editingId && (
              <div className="flex gap-2 px-6 pb-4">
                <button
                  onClick={() => {
                    setDialogType("income");
                    setForm((f) => ({ ...f, category: incomeCategories[0] }));
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    dialogType === "income"
                      ? "bg-[#5AAF50] text-white"
                      : "bg-[#F0F1F6] text-[#7880A0]"
                  }`}
                >
                  Receita
                </button>
                <button
                  onClick={() => {
                    setDialogType("expense");
                    setForm((f) => ({ ...f, category: expenseCategories[0] }));
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    dialogType === "expense"
                      ? "bg-red-500 text-white"
                      : "bg-[#F0F1F6] text-[#7880A0]"
                  }`}
                >
                  Despesa
                </button>
              </div>
            )}

            <div className="px-6 pb-6 space-y-4">
              <div>
                <Label className="text-xs text-[#7880A0]">Descricao</Label>
                <Input
                  className="mt-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Pagamento decoracao festa"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Valor (R$)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0,00"
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#7880A0]">Categoria</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {(dialogType === "income" ? incomeCategories : expenseCategories).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Forma de pagamento</Label>
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
                  <Label className="text-xs text-[#7880A0]">Status</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Data</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.reference_date}
                    onChange={(e) => setForm({ ...form, reference_date: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#7880A0]">Data de vencimento</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Cliente (opcional)</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={form.client_id}
                    onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  >
                    <option value="">Nenhum</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-[#7880A0]">Orcamento (opcional)</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={form.budget_id}
                    onChange={(e) => setForm({ ...form, budget_id: e.target.value })}
                  >
                    <option value="">Nenhum</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} - {b.client?.name || "Sem cliente"} ({formatCurrency(b.total_cached)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#7880A0]">Observacoes</Label>
                <Textarea
                  className="mt-1"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Notas adicionais..."
                  style={{ borderRadius: 8 }}
                />
              </div>
              <Button
                onClick={handleSave}
                className="w-full text-white font-semibold"
                style={{
                  background: dialogType === "income" ? "#5AAF50" : "#DC2626",
                  borderRadius: 12,
                }}
              >
                {editingId ? "Atualizar" : "Salvar"}
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
                Gerar do Orcamento
              </h2>
              <button onClick={() => setShowBudgetDialog(false)} className="text-[#7880A0] hover:text-[#1E2247]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-[#7880A0] mb-4">
                Selecione um orcamento para gerar as transacoes automaticamente
              </p>
              {budgets.length === 0 ? (
                <p className="text-sm text-[#7880A0] text-center py-4">Nenhum orcamento disponivel</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {budgets.map((b) => (
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
