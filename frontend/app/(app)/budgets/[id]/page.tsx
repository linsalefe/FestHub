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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
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
  { value: "draft", label: "Rascunho", color: "bg-stone-200 text-stone-700" },
  { value: "sent", label: "Enviado", color: "bg-blue-100 text-blue-700" },
  { value: "approved", label: "Aprovado", color: "bg-emerald-100 text-emerald-700" },
  { value: "paid", label: "Pago", color: "bg-amber-100 text-amber-700" },
  { value: "done", label: "Realizado", color: "bg-purple-100 text-purple-700" },
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

  const fetchBudget = useCallback(() => {
    api.get(`/api/budgets/${budgetId}`).then((r) => setBudget(r.data));
    api.get(`/api/budgets/${budgetId}/calculate`).then((r) => setCalc(r.data));
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
    api.get("/api/clients").then((r) => setClients(r.data));
    api.get("/api/themes").then((r) => setThemes(r.data));
    api.get("/api/catalog").then((r) => setCatalog(r.data));
  }, [fetchBudget]);

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

  if (!budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-stone-400">Carregando...</p>
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
            className="text-stone-400 hover:text-stone-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-stone-800">
            Orcamento #{budget.id}
          </h2>
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                budget.status === s.value
                  ? s.color + " ring-2 ring-offset-1 ring-stone-300"
                  : "bg-stone-100 text-stone-400 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Event Data */}
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-stone-500">Cliente</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E7E5E4] rounded-lg text-sm bg-white"
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
                  <Label className="text-xs text-stone-500">Data do Evento</Label>
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
                  <Label className="text-xs text-stone-500">Tema</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-[#E7E5E4] rounded-lg text-sm bg-white"
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
                  <Label className="text-xs text-stone-500">Condicao de Pagamento</Label>
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
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Itens do Orcamento</CardTitle>
                <div className="flex gap-2">
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
                <div className="mb-4 p-4 bg-stone-50 rounded-lg border border-[#E7E5E4]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-stone-700">Adicionar do catalogo</p>
                    <button onClick={() => setShowCatalog(false)}>
                      <X className="h-4 w-4 text-stone-400" />
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
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
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E7E5E4] hover:border-amber-400 text-left text-sm"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-xs text-stone-400 ml-2 shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items table */}
              {budget.items.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">
                  Nenhum item adicionado
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-stone-500 font-medium px-2">
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
                      className="grid grid-cols-12 gap-2 items-center bg-stone-50 px-2 py-2 rounded-lg"
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
                      <span className="col-span-1 text-xs text-stone-600 font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="col-span-1 text-stone-400 hover:text-red-500"
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
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Despesas Variaveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budget.variable_costs.map((vc) => (
                <div key={vc.id} className="flex items-center gap-2">
                  <span className="text-sm text-stone-700 flex-1">{vc.name}</span>
                  <span className="text-sm font-medium">{formatCurrency(vc.value)}</span>
                  <button
                    onClick={() => removeVariableCost(vc.id)}
                    className="text-stone-400 hover:text-red-500"
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
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
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
        </div>

        {/* Right column - Summary */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {/* Total */}
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span>{calc ? formatCurrency(calc.subtotal) : "..."}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">
                    Impostos ({calc?.tax_rate ?? 0}%)
                  </span>
                  <span>{calc ? formatCurrency(calc.tax_value) : "..."}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Desconto</span>
                  <span className="text-red-500">
                    -{calc ? formatCurrency(calc.discount) : "..."}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-stone-800">TOTAL</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {calc ? formatCurrency(calc.total) : "..."}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-stone-500">Desconto (R$)</Label>
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
          <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analise de Custos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Custo dos itens</span>
                <span>{calc ? formatCurrency(calc.items_cost) : "..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Despesas variaveis</span>
                <span>{calc ? formatCurrency(calc.variable_total) : "..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Custos fixos (rateio)</span>
                <span>
                  {calc ? formatCurrency(calc.fixed_cost_per_event) : "..."}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Impostos</span>
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
                calc.profit >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              }`}
              style={{ borderRadius: 12 }}
            >
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-stone-500">Lucro Estimado</p>
                <p
                  className={`text-2xl font-bold ${
                    calc.profit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(calc.profit)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    calc.profit >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  Margem: {formatPercent(calc.margin_real)}
                </p>
                {calc.margin_real < 20 && calc.margin_real > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-amber-600 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Margem abaixo de 20%
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
