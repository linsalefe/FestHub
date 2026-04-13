"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Check, Phone, Mail, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  category: string | null;
  notes: string | null;
}

const CATEGORIES = [
  "Baloes",
  "Doces",
  "Bolo",
  "Flores",
  "Tecidos",
  "Iluminacao",
  "Moveis",
  "Outros",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Baloes: { bg: "#EEF0F8", text: "#4A5BA8" },
  Doces: { bg: "#FDF3E7", text: "#D07840" },
  Bolo: { bg: "#FEF2E4", text: "#E8A030" },
  Flores: { bg: "#EEF7ED", text: "#5AAF50" },
  Tecidos: { bg: "#F3EEF8", text: "#7C5BA8" },
  Iluminacao: { bg: "#FFF8E1", text: "#C49000" },
  Moveis: { bg: "#E8F0F8", text: "#4A7BA8" },
  Outros: { bg: "#F0F0F4", text: "#7880A0" },
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  category: "",
  notes: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [form, setForm] = useState(emptyForm);

  const fetchSuppliers = () => {
    api
      .get("/api/suppliers")
      .then((r) => setSuppliers(r.data))
      .catch(() => toast.error("Erro ao carregar fornecedores"));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Nome e obrigatorio");
      return;
    }
    try {
      await api.post("/api/suppliers", {
        ...form,
        phone: form.phone || null,
        email: form.email || null,
        category: form.category || null,
        notes: form.notes || null,
      });
      setForm(emptyForm);
      setShowForm(false);
      fetchSuppliers();
      toast.success("Fornecedor adicionado!");
    } catch {
      toast.error("Erro ao criar fornecedor");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/suppliers/${id}`);
      fetchSuppliers();
      toast.success("Fornecedor removido!");
    } catch {
      toast.error("Erro ao remover fornecedor");
    }
  };

  const filtered =
    filterCategory === "all"
      ? suppliers
      : suppliers.filter((s) => s.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterCategory === "all"
                ? "bg-[#4A5BA8] text-white"
                : "bg-[#EEF0F8] text-[#7880A0] hover:bg-[#E2E4EE]"
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat];
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
                style={{
                  backgroundColor: active ? colors.text : colors.bg,
                  color: active ? "#fff" : colors.text,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="text-white font-semibold shrink-0"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          {showForm ? (
            <X className="h-4 w-4 mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          {showForm ? "Cancelar" : "Novo Fornecedor"}
        </Button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card
          className="border-[#4A5BA8]/30 bg-[#EEF0F8]"
          style={{ borderRadius: 12 }}
        >
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do fornecedor"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val ?? "" })}
                >
                  <SelectTrigger
                    className="w-full"
                    style={{ borderRadius: 8 }}
                  >
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Observacoes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas..."
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreate}
                  className="w-full bg-[#5AAF50] hover:bg-[#4A9F40]"
                  style={{ borderRadius: 8 }}
                >
                  <Check className="h-4 w-4 mr-1" /> Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier) => {
          const colors = supplier.category
            ? CATEGORY_COLORS[supplier.category] || CATEGORY_COLORS.Outros
            : CATEGORY_COLORS.Outros;
          return (
            <Card
              key={supplier.id}
              className="border-[#E2E4EE]"
              style={{ borderRadius: 12 }}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1E2247]">
                        {supplier.name}
                      </p>
                      {supplier.category && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          <Tag className="h-3 w-3" />
                          {supplier.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="text-[#7880A0] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  {supplier.phone && (
                    <p className="text-sm text-[#7880A0] flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {supplier.phone}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-[#7880A0] flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {supplier.email}
                    </p>
                  )}
                  {supplier.notes && (
                    <p className="text-xs text-[#7880A0] mt-2 italic">
                      {supplier.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#7880A0]">
          <p className="text-sm">Nenhum fornecedor encontrado.</p>
        </div>
      )}
    </div>
  );
}
