"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  Search,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowUpDown,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface Budget {
  id: number;
  status: string;
  total_cached: number;
  event_date: string | null;
  created_at: string;
}

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  budgets?: Budget[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-[#F0F1F6] text-[#7880A0]" },
  sent: { label: "Enviado", color: "bg-[#F0F4FA] text-[#7B9ACC]" },
  approved: { label: "Aprovado", color: "bg-[#EEF7ED] text-[#5AAF50]" },
  paid: { label: "Pago", color: "bg-[#EEF0F8] text-[#4A5BA8]" },
  done: { label: "Realizado", color: "bg-[#FFF8EC] text-[#E8A030]" },
};

type SortOption = "name" | "recent" | "revenue";

const GRADIENT_COLORS = [
  "from-[#4A5BA8] to-[#7B9ACC]",
  "from-[#E8A030] to-[#D07840]",
  "from-[#5AAF50] to-[#3D8B36]",
  "from-[#9B59B6] to-[#7D3C98]",
  "from-[#E74C3C] to-[#C0392B]",
  "from-[#1ABC9C] to-[#16A085]",
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const router = useRouter();

  const fetchClients = async () => {
    try {
      const res = await api.get("/api/clients");
      // Fetch budgets for each client to get stats
      const clientsWithBudgets = await Promise.all(
        res.data.map(async (c: Client) => {
          try {
            const bRes = await api.get(`/api/budgets?client_id=${c.id}`);
            return { ...c, budgets: bRes.data };
          } catch {
            return { ...c, budgets: [] };
          }
        })
      );
      setClients(clientsWithBudgets);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "revenue") {
        const aRev = (a.budgets || []).reduce((s, bb) => s + (bb.total_cached || 0), 0);
        const bRev = (b.budgets || []).reduce((s, bb) => s + (bb.total_cached || 0), 0);
        return bRev - aRev;
      }
      return 0; // recent = default order
    });
    return list;
  }, [clients, search, sort]);

  const handleCreate = async () => {
    if (!form.name) return;
    await api.post("/api/clients", form);
    setForm({ name: "", phone: "", email: "", city: "" });
    setShowForm(false);
    fetchClients();
    toast.success("Cliente adicionado!");
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/clients/${id}`);
    fetchClients();
    toast.success("Cliente removido!");
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      city: c.city || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await api.put(`/api/clients/${editingId}`, editForm);
    setEditingId(null);
    fetchClients();
    toast.success("Cliente atualizado!");
  };

  const getClientRevenue = (c: Client) =>
    (c.budgets || [])
      .filter((b) => ["approved", "paid", "done"].includes(b.status))
      .reduce((s, b) => s + (b.total_cached || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7880A0]" />
            <Input
              placeholder="Buscar por nome, telefone ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ borderRadius: 8 }}
            />
          </div>
          <div className="flex gap-1">
            {(["name", "recent", "revenue"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                  sort === s
                    ? "bg-[#4A5BA8] text-white"
                    : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#F0F1F6]"
                }`}
              >
                {s === "name" ? "A-Z" : s === "recent" ? "Recente" : "Faturamento"}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="text-white font-semibold shrink-0"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Cancelar" : "Novo Cliente"}
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
                    <Label className="text-xs">Nome*</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderRadius: 8 }} />
                  </div>
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderRadius: 8 }} />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderRadius: 8 }} />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ borderRadius: 8 }} />
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
      {filtered.length === 0 && !loading && (
        <div className="py-16 text-center">
          <Users className="h-16 w-16 text-[#E2E4EE] mx-auto mb-4" />
          <p className="text-lg font-medium text-[#7880A0]">
            {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </p>
          <p className="text-sm text-[#7880A0] mt-1">
            {search ? "Tente outros termos de busca" : "Comece cadastrando seu primeiro cliente"}
          </p>
        </div>
      )}

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((client, idx) => {
            const isExpanded = expanded === client.id;
            const revenue = getClientRevenue(client);
            const budgetCount = (client.budgets || []).length;
            const gradientClass = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];

            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className={isExpanded ? "md:col-span-2 lg:col-span-3" : ""}
              >
                <Card
                  className="border-[#E2E4EE] hover:shadow-lg transition-all duration-200 overflow-hidden"
                  style={{ borderRadius: 12 }}
                >
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0`}>
                            <span className="text-lg font-bold text-white">{client.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E2247]">{client.name}</p>
                            {client.city && (
                              <p className="text-xs text-[#7880A0] flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {client.city}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : client.id)}
                            className="p-1.5 text-[#7880A0] hover:text-[#4A5BA8] rounded"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleDelete(client.id)} className="p-1.5 text-[#7880A0] hover:text-red-500 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="mt-3 space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <a href={`tel:${client.phone}`} className="text-[#7880A0] hover:text-[#4A5BA8] flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" /> {client.phone}
                            </a>
                            <a
                              href={whatsappLink(client.phone, `Olá ${client.name}!`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#25D366] hover:text-[#1da851]"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                        {client.email && (
                          <a href={`mailto:${client.email}`} className="text-sm text-[#7880A0] hover:text-[#4A5BA8] flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> {client.email}
                          </a>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="mt-3 flex items-center gap-4 pt-3 border-t border-[#E2E4EE]">
                        <div>
                          <p className="text-[10px] text-[#7880A0] uppercase">Orçamentos</p>
                          <p className="text-sm font-semibold text-[#1E2247]">{budgetCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7880A0] uppercase">Faturamento</p>
                          <p className="text-sm font-semibold text-[#5AAF50]">{formatCurrency(revenue)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-[#E2E4EE]"
                        >
                          <div className="p-5 space-y-4">
                            {/* Inline Edit */}
                            {editingId === client.id ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-xs">Nome</Label>
                                  <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Telefone</Label>
                                  <Input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Email</Label>
                                  <Input
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  <Button onClick={saveEdit} size="sm" className="bg-[#5AAF50] hover:bg-[#4A9F40]">
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button onClick={() => startEdit(client)} size="sm" variant="outline" className="text-xs">
                                Editar dados
                              </Button>
                            )}

                            {/* Budget History */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E2247] mb-2">Histórico de Orçamentos</p>
                              {(client.budgets || []).length === 0 ? (
                                <p className="text-sm text-[#7880A0]">Nenhum orçamento encontrado</p>
                              ) : (
                                <div className="space-y-2">
                                  {(client.budgets || []).map((b) => {
                                    const st = statusLabels[b.status] || statusLabels.draft;
                                    return (
                                      <div
                                        key={b.id}
                                        className="flex items-center justify-between p-2 bg-[#FAFBFE] rounded-lg cursor-pointer hover:bg-[#EEF0F8]"
                                        onClick={() => router.push(`/budgets/${b.id}`)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-[#7880A0]" />
                                          <span className="text-sm text-[#1E2247]">#{b.id}</span>
                                          <Badge className={`${st.color} border-0 text-[10px] px-1.5 py-0 h-4`}>{st.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {b.event_date && <span className="text-xs text-[#7880A0]">{formatDate(b.event_date)}</span>}
                                          <span className="text-sm font-semibold">{formatCurrency(b.total_cached || 0)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => router.push("/budgets")}
                                size="sm"
                                className="text-white"
                                style={{ background: "linear-gradient(135deg, #E8A030, #D07840)" }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Novo orçamento
                              </Button>
                              {client.phone && (
                                <a
                                  href={whatsappLink(client.phone, `Olá ${client.name}! Tudo bem?`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                                >
                                  <MessageCircle className="h-3 w-3" /> WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
