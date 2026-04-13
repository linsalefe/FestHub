"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Check,
  Package,
  ClipboardList,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  price: number;
}

interface PackageItem {
  id: number;
  catalog_item_id: number;
  catalog_item: CatalogItem;
  quantity: number;
}

interface PackageData {
  id: number;
  name: string;
  description: string | null;
  total_price: number;
  items: PackageItem[];
}

interface SelectedItem {
  catalog_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [applyDialog, setApplyDialog] = useState<{
    open: boolean;
    packageId: number | null;
  }>({ open: false, packageId: null });
  const [budgetId, setBudgetId] = useState("");

  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  const fetchData = () => {
    api.get("/api/packages").then((r) => setPackages(r.data));
    api.get("/api/catalog").then((r) => setCatalogItems(r.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetCreateForm = () => {
    setForm({ name: "", description: "" });
    setSelectedItems([]);
    setItemSearch("");
    setShowCreateDialog(false);
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Informe o nome do pacote");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pacote");
      return;
    }
    await api.post("/api/packages", {
      name: form.name,
      description: form.description || null,
      items: selectedItems.map((si) => ({
        catalog_item_id: si.catalog_item_id,
        quantity: si.quantity,
      })),
    });
    resetCreateForm();
    fetchData();
    toast.success("Pacote criado!");
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/packages/${id}`);
    fetchData();
    toast.success("Pacote removido!");
  };

  const handleApplyToBudget = async () => {
    if (!applyDialog.packageId || !budgetId) {
      toast.error("Informe o ID do orcamento");
      return;
    }
    await api.post("/api/packages/apply-to-budget", {
      package_id: applyDialog.packageId,
      budget_id: parseInt(budgetId),
    });
    setApplyDialog({ open: false, packageId: null });
    setBudgetId("");
    toast.success("Pacote aplicado ao orcamento!");
  };

  const toggleItem = (item: CatalogItem) => {
    const exists = selectedItems.find(
      (si) => si.catalog_item_id === item.id
    );
    if (exists) {
      setSelectedItems(
        selectedItems.filter((si) => si.catalog_item_id !== item.id)
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          catalog_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateItemQuantity = (catalogItemId: number, quantity: number) => {
    setSelectedItems(
      selectedItems.map((si) =>
        si.catalog_item_id === catalogItemId
          ? { ...si, quantity: Math.max(1, quantity) }
          : si
      )
    );
  };

  const filteredCatalog = catalogItems.filter((ci) =>
    ci.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[#7880A0]">{packages.length} pacotes</p>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo Pacote
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-[#E2E4EE] mx-auto mb-4" />
            <p className="text-[#7880A0] font-medium">
              Nenhum pacote cadastrado
            </p>
            <p className="text-sm text-[#7880A0] mt-1">
              Crie pacotes com itens do catalogo para agilizar seus orcamentos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="border-[#E2E4EE]"
              style={{ borderRadius: 12 }}
            >
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#1E2247]">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-sm text-[#7880A0] mt-0.5">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-1.5 text-[#7880A0] hover:text-red-600 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#7880A0]">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    {pkg.items.length} itens
                  </span>
                  <Badge
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: "#EEF0F8",
                      color: "#4A5BA8",
                      borderRadius: 6,
                    }}
                  >
                    {formatCurrency(pkg.total_price)}
                  </Badge>
                </div>

                <div className="space-y-1 pt-1">
                  {pkg.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs text-[#7880A0] py-0.5"
                    >
                      <span>{item.catalog_item?.name || `Item #${item.catalog_item_id}`}</span>
                      <span className="font-medium">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E2E4EE] flex items-center justify-between">
                  <span className="text-lg font-bold text-[#1E2247]">
                    {formatCurrency(pkg.total_price)}
                  </span>
                  <Button
                    onClick={() =>
                      setApplyDialog({ open: true, packageId: pkg.id })
                    }
                    className="text-white text-xs"
                    style={{
                      background: "linear-gradient(135deg, #4A5BA8, #3A4B98)",
                      borderRadius: 8,
                    }}
                    size="sm"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Aplicar em Orcamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Package Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">Novo Pacote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome*</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do pacote"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div>
              <Label className="text-xs">Descricao</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descricao do pacote"
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Item picker */}
            <div>
              <Label className="text-xs">Itens do Catalogo</Label>
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Buscar item..."
                className="mt-1"
                style={{ borderRadius: 8 }}
              />
              <div className="mt-2 max-h-40 overflow-y-auto border border-[#E2E4EE] rounded-lg">
                {filteredCatalog.map((ci) => {
                  const isSelected = selectedItems.some(
                    (si) => si.catalog_item_id === ci.id
                  );
                  return (
                    <button
                      key={ci.id}
                      onClick={() => toggleItem(ci)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#F8F9FC] transition-colors ${
                        isSelected ? "bg-[#EEF0F8]" : ""
                      }`}
                    >
                      <span className="text-[#1E2247]">
                        {ci.name}{" "}
                        <span className="text-[#7880A0] text-xs">
                          ({ci.category})
                        </span>
                      </span>
                      <span className="text-xs text-[#4A5BA8] font-medium">
                        {formatCurrency(ci.price)}
                      </span>
                    </button>
                  );
                })}
                {filteredCatalog.length === 0 && (
                  <p className="text-center text-xs text-[#7880A0] py-4">
                    Nenhum item encontrado
                  </p>
                )}
              </div>
            </div>

            {/* Selected items with quantity */}
            {selectedItems.length > 0 && (
              <div>
                <Label className="text-xs">
                  Itens selecionados ({selectedItems.length})
                </Label>
                <div className="mt-1 space-y-2">
                  {selectedItems.map((si) => (
                    <div
                      key={si.catalog_item_id}
                      className="flex items-center gap-3 bg-[#EEF0F8] rounded-lg px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-[#1E2247]">
                        {si.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-[#7880A0]">Qtd:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={si.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              si.catalog_item_id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 h-7 text-center text-sm"
                          style={{ borderRadius: 6 }}
                        />
                      </div>
                      <button
                        onClick={() => toggleItem({ id: si.catalog_item_id } as CatalogItem)}
                        className="text-[#7880A0] hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetCreateForm}
              style={{ borderRadius: 8 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#5AAF50] hover:bg-[#4A9F40] text-white"
              style={{ borderRadius: 8 }}
            >
              <Check className="h-4 w-4 mr-1" /> Criar Pacote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Budget Dialog */}
      <Dialog
        open={applyDialog.open}
        onOpenChange={(open) => {
          setApplyDialog({ open, packageId: open ? applyDialog.packageId : null });
          if (!open) setBudgetId("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">
              Aplicar em Orcamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">ID do Orcamento*</Label>
              <Input
                type="number"
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                placeholder="Ex: 1"
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApplyDialog({ open: false, packageId: null });
                setBudgetId("");
              }}
              style={{ borderRadius: 8 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyToBudget}
              className="text-white"
              style={{
                background: "linear-gradient(135deg, #4A5BA8, #3A4B98)",
                borderRadius: 8,
              }}
            >
              <Check className="h-4 w-4 mr-1" /> Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
