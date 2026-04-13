"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Check,
  Search,
  Package,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { toast } from "sonner";

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  cost: number;
  price: number;
  is_active: boolean;
}

const categories = ["Decoracao", "Baloes", "Brindes", "Tecidos", "Iluminacao"];

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  Decoracao: { bg: "bg-[#EEF0F8]", text: "text-[#4A5BA8]", icon: "🎨" },
  "Decoração": { bg: "bg-[#EEF0F8]", text: "text-[#4A5BA8]", icon: "🎨" },
  Baloes: { bg: "bg-[#FFF8EC]", text: "text-[#E8A030]", icon: "🎈" },
  Brindes: { bg: "bg-[#EEF7ED]", text: "text-[#5AAF50]", icon: "🎁" },
  Tecidos: { bg: "bg-[#F8EEF8]", text: "text-[#9B59B6]", icon: "🧵" },
  Iluminacao: { bg: "bg-[#FFF3F0]", text: "text-[#E74C3C]", icon: "💡" },
};

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", cost: "", price: "" });
  const [form, setForm] = useState({
    name: "",
    category: "Decoracao",
    cost: "",
    price: "",
  });

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/catalog");
      setItems(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    await api.post("/api/catalog", {
      name: form.name,
      category: form.category,
      cost: parseFloat(form.cost) || 0,
      price: parseFloat(form.price) || 0,
    });
    setForm({ name: "", category: "Decoracao", cost: "", price: "" });
    setShowForm(false);
    fetchItems();
    toast.success("Item adicionado!");
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/catalog/${id}`);
    fetchItems();
    toast.success("Item removido!");
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      cost: String(item.cost),
      price: String(item.price),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await api.put(`/api/catalog/${editingId}`, {
      name: editForm.name,
      cost: parseFloat(editForm.cost) || 0,
      price: parseFloat(editForm.price) || 0,
    });
    setEditingId(null);
    fetchItems();
    toast.success("Item atualizado!");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      const matchSearch = !q || i.name.toLowerCase().includes(q);
      const matchCat = !filterCat || i.category === filterCat || (filterCat === "Decoracao" && i.category === "Decoração");
      return matchSearch && matchCat;
    });
  }, [items, search, filterCat]);

  const grouped = useMemo(() => {
    const cats = categories.map((cat) => ({
      category: cat,
      items: filtered.filter((i) => i.category === cat || (cat === "Decoracao" && i.category === "Decoração")),
    }));
    return cats.filter((g) => g.items.length > 0);
  }, [filtered]);

  // Stats
  const avgMargin = useMemo(() => {
    const withMargin = items.filter((i) => i.price > 0);
    if (withMargin.length === 0) return 0;
    return withMargin.reduce((s, i) => s + ((i.price - i.cost) / i.price) * 100, 0) / withMargin.length;
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#7880A0]">Total de Itens</p>
            <p className="text-2xl font-bold text-[#1E2247]">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#7880A0]">Margem Média</p>
            <p className={`text-2xl font-bold ${avgMargin >= 40 ? "text-[#5AAF50]" : avgMargin >= 20 ? "text-[#E8A030]" : "text-red-500"}`}>
              {formatPercent(avgMargin)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#7880A0]">Categorias</p>
            <p className="text-2xl font-bold text-[#4A5BA8]">{grouped.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7880A0]" />
            <Input
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ borderRadius: 8 }}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCat("")}
              className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                !filterCat ? "bg-[#4A5BA8] text-white" : "bg-white text-[#7880A0] border border-[#E2E4EE]"
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(filterCat === c ? "" : c)}
                className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                  filterCat === c ? "bg-[#4A5BA8] text-white" : "bg-white text-[#7880A0] border border-[#E2E4EE]"
                }`}
              >
                {(categoryColors[c]?.icon || "") + " " + c}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="text-white font-semibold shrink-0"
          style={{ background: "linear-gradient(135deg, #E8A030, #D07840)", borderRadius: 8 }}
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Cancelar" : "Novo Item"}
        </Button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-[#4A5BA8]/30 bg-[#EEF0F8]" style={{ borderRadius: 12 }}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs">Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do item" style={{ borderRadius: 8 }} />
                  </div>
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Custo (R$)</Label>
                    <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" style={{ borderRadius: 8 }} />
                  </div>
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" style={{ borderRadius: 8 }} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleCreate} className="w-full bg-[#5AAF50] hover:bg-[#4A9F40]" style={{ borderRadius: 8 }}>
                      <Check className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Package className="h-16 w-16 text-[#E2E4EE] mx-auto mb-4" />
          <p className="text-lg font-medium text-[#7880A0]">Nenhum item encontrado</p>
        </div>
      )}

      {/* Grouped Items */}
      {grouped.map((group) => {
        const catStyle = categoryColors[group.category] || categoryColors.Decoracao;
        return (
          <div key={group.category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{catStyle.icon}</span>
              <h3 className="text-lg font-semibold text-[#1E2247]">{group.category}</h3>
              <Badge variant="secondary" className="text-xs">{group.items.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {group.items.map((item, idx) => {
                  const margin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
                  const isEditing = editingId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card className="border-[#E2E4EE] hover:shadow-md transition-all duration-200" style={{ borderRadius: 12 }}>
                        <CardContent className="pt-5 pb-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-8 text-sm"
                                placeholder="Nome"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px]">Custo</Label>
                                  <Input
                                    type="number"
                                    value={editForm.cost}
                                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px]">Preço</Label>
                                  <Input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={saveEdit} size="sm" className="bg-[#5AAF50] hover:bg-[#4A9F40]">
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-[#1E2247]">{item.name}</p>
                                  <Badge className={`${catStyle.bg} ${catStyle.text} border-0 text-xs mt-1`}>
                                    {item.category}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => startEdit(item)} className="p-1 text-[#7880A0] hover:text-[#4A5BA8] rounded">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} className="p-1 text-[#7880A0] hover:text-red-500 rounded">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-[#7880A0]">Custo</p>
                                  <p className="font-medium text-[#7880A0]">{formatCurrency(item.cost)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#7880A0]">Preço</p>
                                  <p className="font-medium text-[#4A5BA8]">{formatCurrency(item.price)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#7880A0]">Margem</p>
                                  <p className={`font-medium ${margin >= 40 ? "text-[#5AAF50]" : margin >= 20 ? "text-[#D07840]" : "text-red-600"}`}>
                                    {formatPercent(margin)}
                                  </p>
                                </div>
                              </div>

                              {/* Margin bar */}
                              <div className="mt-2 h-1.5 w-full bg-[#F0F1F6] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    margin >= 40 ? "bg-[#5AAF50]" : margin >= 20 ? "bg-[#E8A030]" : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(margin, 100)}%` }}
                                />
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
