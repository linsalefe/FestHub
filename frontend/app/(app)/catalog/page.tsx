"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Decoracao",
    cost: "",
    price: "",
  });

  const fetchItems = () => {
    api.get("/api/catalog").then((r) => setItems(r.data));
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

  const grouped = categories.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat || (cat === "Decoracao" && i.category === "Decoração")),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[#7880A0]">
          {items.length} itens no catalogo
        </p>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Cancelar" : "Novo Item"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-[#E2E4EE] border-[#4A5BA8]/30 bg-[#EEF0F8]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do item"
                  style={{ borderRadius: 8 }}
                />
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
                <Input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="0.00"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Preco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreate} className="w-full bg-[#5AAF50] hover:bg-[#4A9F40]" style={{ borderRadius: 8 }}>
                  <Check className="h-4 w-4 mr-1" /> Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {grouped.map(
        (group) =>
          group.items.length > 0 && (
            <div key={group.category}>
              <h3 className="text-lg font-semibold text-[#1E2247] mb-3">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item) => {
                  const margin =
                    item.price > 0
                      ? ((item.price - item.cost) / item.price) * 100
                      : 0;
                  return (
                    <Card
                      key={item.id}
                      className="border-[#E2E4EE]"
                      style={{ borderRadius: 12 }}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-[#1E2247]">
                              {item.name}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-xs mt-1"
                            >
                              {item.category}
                            </Badge>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-[#7880A0] hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-xs text-[#7880A0]">Custo</p>
                            <p className="font-medium text-[#7880A0]">
                              {formatCurrency(item.cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#7880A0]">Preco</p>
                            <p className="font-medium text-[#4A5BA8]">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#7880A0]">Margem</p>
                            <p
                              className={`font-medium ${
                                margin >= 40
                                  ? "text-[#5AAF50]"
                                  : margin >= 20
                                  ? "text-[#D07840]"
                                  : "text-red-600"
                              }`}
                            >
                              {formatPercent(margin)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}
