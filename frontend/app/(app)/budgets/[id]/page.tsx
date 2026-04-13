"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  Search,
  X,
  ArrowLeft,
  FileDown,
  BarChart3,
  CheckSquare,
  Sparkles,
  Link,
  FileSignature,
  DollarSign,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface BudgetItem {
  id: number;
  budget_id: number;
  catalog_item_id: number | null;
  name: string;
  cost: number;
  price: number;
  quantity: number;
}

interface VariableCost {
  id: number;
  budget_id: number;
  name: string;
  value: number;
}

interface Client {
  id: number;
  name: string;
  phone: string | null;
}

interface Theme {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  cost: number;
  price: number;
}

interface PackageOption {
  id: number;
  name: string;
  description?: string;
}

interface ChecklistItem {
  id: number;
  budget_id: number;
  description: string;
  is_done: boolean;
}

interface Scenario {
  id: number;
  budget_id: number;
  name: string;
}

interface Budget {
  id: number;
  status: string;
  client_id: number | null;
  theme_id: number | null;
  event_date: string | null;
  event_address: string | null;
  discount: number;
  payment_condition: string;
  validity_days: number;
  notes: string | null;
  total_cached: number;
  client: { id: number; name: string } | null;
  theme: Theme | null;
  items: BudgetItem[];
  variable_costs: VariableCost[];
}

interface Calculation {
  items_total: number;
  items_cost: number;
  variable_total: number;
  fixed_cost_per_event: number;
  total_cost: number;
  subtotal: number;
  tax_rate: number;
  tax_value: number;
  discount: number;
  total: number;
  profit: number;
  margin_real: number;
}

const statuses = [
  { value: "draft", label: "Rascunho", color: "bg-[#F0F1F6] text-[#7880A0]" },
  { value: "sent", label: "Enviado", color: "bg-[#F0F4FA] text-[#7B9ACC]" },
  { value: "approved", label: "Aprovado", color: "bg-[#EEF7ED] text-[#5AAF50]" },
  { value: "paid", label: "Pago", color: "bg-[#EEF0F8] text-[#4A5BA8]" },
  { value: "done", label: "Realizado", color: "bg-[#FFF8EC] text-[#E8A030]" },
];

export default function BudgetEditorPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [calc, setCalc] = useState<Calculation | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [newVcName, setNewVcName] = useState("");
  const [newVcValue, setNewVcValue] = useState("");

  // Package state
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [showPackageSelect, setShowPackageSelect] = useState(false);
  const [applyingPackage, setApplyingPackage] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [generatingChecklist, setGeneratingChecklist] = useState(false);

  // Scenarios state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [generatingScenarios, setGeneratingScenarios] = useState(false);

  // Transactions + Contract state
  const [budgetTransactions, setBudgetTransactions] = useState<any[]>([]);
  const [hasContract, setHasContract] = useState(false);

  const fetchBudget = useCallback(() => {
    api.get(`/api/budgets/${budgetId}`).then((r) => setBudget(r.data));
    api.get(`/api/budgets/${budgetId}/calculate`).then((r) => setCalc(r.data));
  }, [budgetId]);

  const fetchChecklist = useCallback(() => {
    api
      .get(`/api/checklists/budget/${budgetId}`)
      .then((r) => setChecklist(r.data))
      .catch(() => setChecklist([]));
  }, [budgetId]);

  const fetchBudgetExtras = useCallback(() => {
    api.get(`/api/transactions?budget_id=${budgetId}`).then((r) => setBudgetTransactions(r.data)).catch(() => {});
    api.get(`/api/contracts?budget_id=${budgetId}`).then((r) => {
      const contracts = r.data as any[];
      setHasContract(contracts.some((c: any) => c.budget_id === parseInt(budgetId)));
    }).catch(() => {});
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
    fetchChecklist();
    fetchBudgetExtras();
    api.get("/api/clients").then((r) => setClients(r.data));
    api.get("/api/themes").then((r) => setThemes(r.data));
    api.get("/api/catalog").then((r) => setCatalog(r.data));
  }, [fetchBudget, fetchChecklist, fetchBudgetExtras]);

  const updateBudget = async (data: Record<string, unknown>) => {
    await api.put(`/api/budgets/${budgetId}`, data);
    fetchBudget();
  };

  const changeStatus = async (status: string) => {
    await api.patch(`/api/budgets/${budgetId}/status`, { status });
    fetchBudget();
    toast.success(`Status alterado para ${statuses.find((s) => s.value === status)?.label}`);
  };

  const addCatalogItem = async (item: CatalogItem) => {
    await api.post(`/api/budgets/${budgetId}/items`, {
      catalog_item_id: item.id,
      name: item.name,
      cost: item.cost,
      price: item.price,
      quantity: 1,
    });
    fetchBudget();
    toast.success(`${item.name} adicionado!`);
  };

  const addCustomItem = async () => {
    await api.post(`/api/budgets/${budgetId}/items`, {
      name: "Novo item",
      cost: 0,
      price: 0,
      quantity: 1,
    });
    fetchBudget();
  };

  const updateItem = async (itemId: number, data: Partial<BudgetItem>) => {
    const item = budget?.items.find((i) => i.id === itemId);
    if (!item) return;
    await api.put(`/api/budgets/${budgetId}/items/${itemId}`, {
      ...item,
      ...data,
    });
    fetchBudget();
  };

  const removeItem = async (itemId: number) => {
    await api.delete(`/api/budgets/${budgetId}/items/${itemId}`);
    fetchBudget();
  };

  const addVariableCost = async () => {
    if (!newVcName) return;
    await api.post(`/api/budgets/${budgetId}/variable-costs`, {
      name: newVcName,
      value: parseFloat(newVcValue) || 0,
    });
    setNewVcName("");
    setNewVcValue("");
    fetchBudget();
  };

  const removeVariableCost = async (vcId: number) => {
    await api.delete(`/api/budgets/${budgetId}/variable-costs/${vcId}`);
    fetchBudget();
  };

  // --- Apply Package ---
  const handleOpenPackageSelect = async () => {
    try {
      const r = await api.get("/api/packages");
      setPackages(r.data);
      setShowPackageSelect(true);
    } catch {
      toast.error("Erro ao carregar pacotes");
    }
  };

  const handleApplyPackage = async (packageId: number) => {
    setApplyingPackage(true);
    try {
      await api.post("/api/packages/apply-to-budget", {
        package_id: packageId,
        budget_id: parseInt(budgetId),
      });
      fetchBudget();
      toast.success("Pacote aplicado com sucesso!");
    } catch {
      toast.error("Erro ao aplicar pacote");
    } finally {
      setApplyingPackage(false);
      setShowPackageSelect(false);
    }
  };

  // --- Generate PDF ---
  const handleGeneratePdf = async () => {
    try {
      const r = await api.get(`/api/budgets/${budgetId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento-${budgetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  // --- Generate Scenarios ---
  const handleGenerateScenarios = async () => {
    setGeneratingScenarios(true);
    try {
      const r = await api.post(`/api/budgets/${budgetId}/generate-scenarios`);
      setScenarios(r.data);
      toast.success("Cenarios gerados com sucesso!");
    } catch {
      toast.error("Erro ao gerar cenarios");
    } finally {
      setGeneratingScenarios(false);
    }
  };

  // --- Checklist ---
  const toggleChecklistItem = async (item: ChecklistItem) => {
    try {
      await api.put(`/api/checklists/${item.id}`, {
        ...item,
        is_done: !item.is_done,
      });
      fetchChecklist();
    } catch {
      toast.error("Erro ao atualizar item");
    }
  };

  const handleGenerateChecklist = async () => {
    setGeneratingChecklist(true);
    try {
      await api.post(`/api/checklists/budget/${budgetId}/generate`);
      fetchChecklist();
      toast.success("Checklist gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar checklist");
    } finally {
      setGeneratingChecklist(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    try {
      await api.post(`/api/checklists/budget/${budgetId}`, {
        description: newChecklistItem.trim(),
        is_done: false,
      });
      setNewChecklistItem("");
      fetchChecklist();
    } catch {
      toast.error("Erro ao adicionar item");
    }
  };

  const handleGenerateContract = async () => {
    try {
      const r = await api.post(`/api/contracts/from-budget/${budgetId}`);
      toast.success("Contrato gerado com sucesso!");
      setHasContract(true);
      router.push(`/contratos`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao gerar contrato");
    }
  };

  const handleRegisterPayment = async () => {
    try {
      await api.post(`/api/transactions/from-budget/${budgetId}`);
      toast.success("Pagamentos registrados com sucesso!");
      fetchBudgetExtras();
    } catch {
      toast.error("Erro ao registrar pagamento");
    }
  };

  if (!budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#7880A0]">Carregando...</p>
      </div>
    );
  }

  const filteredCatalog = catalog.filter((c) =>
    c.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/budgets")}
            className="text-[#7880A0] hover:text-[#1E2247]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-[#1E2247]">
            Orcamento #{budget.id}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => changeStatus(s.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  budget.status === s.value
                    ? s.color + " ring-2 ring-offset-1 ring-[#E2E4EE]"
                    : "bg-[#F0F1F6] text-[#7880A0] hover:bg-[#E2E4EE]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePdf}
            style={{ borderRadius: 8 }}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Gerar PDF
          </Button>
          {(() => {
            const client = clients.find((c) => c.id === budget.client_id);
            if (!client?.phone) return null;
            const theme = themes.find((t) => t.id === budget.theme_id);
            const msg = `Olá ${client.name}! 🎉\n\nSegue o orçamento da sua festa:\n\n${theme ? `🎨 Tema: ${theme.emoji} ${theme.name}\n` : ""}${budget.event_date ? `📅 Data: ${formatDate(budget.event_date)}\n` : ""}💰 Valor: ${formatCurrency(calc?.total || 0)}\n\nAcesse os detalhes e me diga o que acha!`;
            return (
              <a
                href={whatsappLink(client.phone, msg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            );
          })()}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateScenarios}
            disabled={generatingScenarios}
            style={{ borderRadius: 8 }}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            {generatingScenarios ? "Gerando..." : "Gerar Cenarios"}
          </Button>
        </div>
      </div>

      {/* Scenarios links */}
      {scenarios.length > 0 && (
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-[#4A5BA8]" />
              <span className="text-sm font-medium text-[#1E2247]">
                Cenarios Gerados
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/budgets/${s.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#EEF0F8] text-[#4A5BA8] rounded-lg hover:bg-[#DDE1F0] transition-colors"
                >
                  <Link className="h-3 w-3" />
                  {s.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Event Data */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Cliente</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={budget.client_id || ""}
                    onChange={(e) =>
                      updateBudget({
                        client_id: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Selecionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-[#7880A0]">Data do Evento</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={budget.event_date || ""}
                    onChange={(e) => updateBudget({ event_date: e.target.value || null })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#7880A0]">Tema</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                    value={budget.theme_id || ""}
                    onChange={(e) =>
                      updateBudget({
                        theme_id: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Selecionar tema</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.emoji} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-[#7880A0]">Condicao de Pagamento</Label>
                  <Input
                    className="mt-1"
                    value={budget.payment_condition}
                    onChange={(e) => updateBudget({ payment_condition: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Items */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Itens do Orcamento</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenPackageSelect}
                      disabled={applyingPackage}
                      style={{ borderRadius: 8 }}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      {applyingPackage ? "Aplicando..." : "Aplicar Pacote"}
                    </Button>
                    {showPackageSelect && packages.length > 0 && (
                      <div className="absolute right-0 top-full mt-1 z-20 w-64 bg-white border border-[#E2E4EE] rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <span className="text-xs font-medium text-[#7880A0]">
                            Selecione um pacote
                          </span>
                          <button onClick={() => setShowPackageSelect(false)}>
                            <X className="h-3 w-3 text-[#7880A0]" />
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {packages.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => handleApplyPackage(pkg.id)}
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[#EEF0F8] transition-colors"
                            >
                              {pkg.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCatalog(!showCatalog)}
                    style={{ borderRadius: 8 }}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Catalogo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCustomItem}
                    style={{ borderRadius: 8 }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Personalizado
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Catalog Picker */}
              {showCatalog && (
                <div className="mb-4 p-4 bg-[#EEF0F8] rounded-lg border border-[#E2E4EE]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[#1E2247]">Adicionar do catalogo</p>
                    <button onClick={() => setShowCatalog(false)}>
                      <X className="h-4 w-4 text-[#7880A0]" />
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7880A0]" />
                    <Input
                      placeholder="Buscar item..."
                      className="pl-9"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {filteredCatalog.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addCatalogItem(item)}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E2E4EE] hover:border-[#4A5BA8] text-left text-sm"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-xs text-[#7880A0] ml-2 shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items table */}
              {budget.items.length === 0 ? (
                <p className="text-sm text-[#7880A0] text-center py-8">
                  Nenhum item adicionado
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-[#7880A0] font-medium px-2">
                    <span className="col-span-4">Nome</span>
                    <span className="col-span-2">Qtd</span>
                    <span className="col-span-2">Custo</span>
                    <span className="col-span-2">Preco</span>
                    <span className="col-span-1">Total</span>
                    <span className="col-span-1"></span>
                  </div>
                  {budget.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-center bg-[#F0F1F6] px-2 py-2 rounded-lg"
                    >
                      <Input
                        className="col-span-4 h-8 text-sm"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        style={{ borderRadius: 6 }}
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                        }
                        style={{ borderRadius: 6 }}
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        type="number"
                        step="0.01"
                        value={item.cost}
                        onChange={(e) =>
                          updateItem(item.id, { cost: parseFloat(e.target.value) || 0 })
                        }
                        style={{ borderRadius: 6 }}
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                        }
                        style={{ borderRadius: 6 }}
                      />
                      <span className="col-span-1 text-xs text-[#7880A0] font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="col-span-1 text-[#7880A0] hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable Costs */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Despesas Variaveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budget.variable_costs.map((vc) => (
                <div key={vc.id} className="flex items-center gap-2">
                  <span className="text-sm text-[#1E2247] flex-1">{vc.name}</span>
                  <span className="text-sm font-medium">{formatCurrency(vc.value)}</span>
                  <button
                    onClick={() => removeVariableCost(vc.id)}
                    className="text-[#7880A0] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da despesa"
                  value={newVcName}
                  onChange={(e) => setNewVcName(e.target.value)}
                  className="flex-1"
                  style={{ borderRadius: 8 }}
                />
                <Input
                  placeholder="Valor"
                  type="number"
                  step="0.01"
                  value={newVcValue}
                  onChange={(e) => setNewVcValue(e.target.value)}
                  className="w-32"
                  style={{ borderRadius: 8 }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addVariableCost}
                  style={{ borderRadius: 8 }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observacoes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observacoes sobre o orcamento..."
                value={budget.notes || ""}
                onChange={(e) => updateBudget({ notes: e.target.value })}
                rows={3}
                style={{ borderRadius: 8 }}
              />
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-[#4A5BA8]" />
                  Checklist
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateChecklist}
                  disabled={generatingChecklist}
                  style={{ borderRadius: 8 }}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {generatingChecklist ? "Gerando..." : "Gerar Checklist"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.length === 0 ? (
                <p className="text-sm text-[#7880A0] text-center py-4">
                  Nenhum item no checklist
                </p>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0F1F6] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.is_done}
                        onChange={() => toggleChecklistItem(item)}
                        className="h-4 w-4 rounded border-[#E2E4EE] text-[#4A5BA8] focus:ring-[#4A5BA8]"
                      />
                      <span
                        className={`text-sm ${
                          item.is_done
                            ? "line-through text-[#7880A0]"
                            : "text-[#1E2247]"
                        }`}
                      >
                        {item.description}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Novo item do checklist..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChecklistItem();
                  }}
                  className="flex-1"
                  style={{ borderRadius: 8 }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddChecklistItem}
                  style={{ borderRadius: 8 }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {/* Total */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7880A0]">Subtotal</span>
                  <span>{calc ? formatCurrency(calc.subtotal) : "..."}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7880A0]">
                    Impostos ({calc?.tax_rate ?? 0}%)
                  </span>
                  <span>{calc ? formatCurrency(calc.tax_value) : "..."}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7880A0]">Desconto</span>
                  <span className="text-red-500">
                    -{calc ? formatCurrency(calc.discount) : "..."}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-[#1E2247]">TOTAL</span>
                  <span className="text-2xl font-bold text-[#4A5BA8]">
                    {calc ? formatCurrency(calc.total) : "..."}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#7880A0]">Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={budget.discount}
                  onChange={(e) =>
                    updateBudget({ discount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analise de Custos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#7880A0]">Custo dos itens</span>
                <span>{calc ? formatCurrency(calc.items_cost) : "..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7880A0]">Despesas variaveis</span>
                <span>{calc ? formatCurrency(calc.variable_total) : "..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7880A0]">Custos fixos (rateio)</span>
                <span>
                  {calc ? formatCurrency(calc.fixed_cost_per_event) : "..."}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7880A0]">Impostos</span>
                <span>{calc ? formatCurrency(calc.tax_value) : "..."}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Custo total</span>
                <span>{calc ? formatCurrency(calc.total_cost) : "..."}</span>
              </div>
            </CardContent>
          </Card>

          {/* Profit indicator */}
          {calc && (
            <Card
              className={`border-2 ${
                calc.profit >= 0 ? "border-[#5AAF50]/30 bg-[#EEF7ED]" : "border-red-200 bg-red-50"
              }`}
              style={{ borderRadius: 12 }}
            >
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-[#7880A0]">Lucro Estimado</p>
                <p
                  className={`text-2xl font-bold ${
                    calc.profit >= 0 ? "text-[#5AAF50]" : "text-red-600"
                  }`}
                >
                  {formatCurrency(calc.profit)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    calc.profit >= 0 ? "text-[#5AAF50]" : "text-red-500"
                  }`}
                >
                  Margem: {formatPercent(calc.margin_real)}
                </p>
                {calc.margin_real < 20 && calc.margin_real > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-[#D07840] text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Margem abaixo de 20%
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract & Payment Actions */}
          <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-[#4A5BA8]" />
                Contrato & Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {hasContract ? (
                  <Badge className="bg-[#EEF7ED] text-[#5AAF50] text-xs">Contrato gerado</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateContract}
                    className="w-full"
                    style={{ borderRadius: 8 }}
                  >
                    <FileSignature className="h-4 w-4 mr-1" />
                    Gerar Contrato
                  </Button>
                )}
                {budgetTransactions.length > 0 ? (
                  <Badge className="bg-[#EEF7ED] text-[#5AAF50] text-xs">Pagamento registrado</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRegisterPayment}
                    className="w-full"
                    style={{ borderRadius: 8 }}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Registrar Pagamento
                  </Button>
                )}
              </div>

              {budgetTransactions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-[#7880A0]">Pagamentos</p>
                  {budgetTransactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="h-3 w-3 text-[#5AAF50]" />
                        <span className="text-[#1E2247] truncate max-w-[120px]">{t.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#5AAF50]">
                          {(t.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          t.status === "paid" ? "bg-[#EEF7ED] text-[#5AAF50]" : "bg-[#FFF8EC] text-[#D07840]"
                        }`}>
                          {t.status === "paid" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
