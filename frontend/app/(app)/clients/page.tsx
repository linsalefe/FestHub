"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Check, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { toast } from "sonner";

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });

  const fetchClients = () => {
    const params = search ? `?q=${search}` : "";
    api.get(`/api/clients${params}`).then((r) => setClients(r.data));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          style={{ borderRadius: 8 }}
        />
        <Button
          onClick={() => setShowForm(!showForm)}
          className="text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
            borderRadius: 8,
          }}
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Cancelar" : "Novo Cliente"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-[#4A5BA8]/30 bg-[#EEF0F8]" style={{ borderRadius: 12 }}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-[#EEF0F8]">
                    <AvatarFallback className="bg-[#EEF0F8] text-[#4A5BA8] font-bold">
                      {client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#1E2247]">{client.name}</p>
                    {client.city && (
                      <p className="text-xs text-[#7880A0] flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {client.city}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(client.id)} className="text-[#7880A0] hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {client.phone && (
                  <p className="text-sm text-[#7880A0] flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {client.phone}
                  </p>
                )}
                {client.email && (
                  <p className="text-sm text-[#7880A0] flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> {client.email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
