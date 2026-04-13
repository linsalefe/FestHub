"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check, Pencil, UserX, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#4A5BA8" },
  user: { label: "Usuario", color: "#7B9ACC" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const fetchUsers = () => {
    api.get("/api/users").then((r) => setUsers(r.data));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "user" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }
    await api.post("/api/users", {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    });
    resetForm();
    fetchUsers();
    toast.success("Usuario criado!");
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name || !form.email) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }
    await api.put(`/api/users/${editingId}`, {
      name: form.name,
      email: form.email,
      role: form.role,
    });
    resetForm();
    fetchUsers();
    toast.success("Usuario atualizado!");
  };

  const handleToggleActive = async (user: User) => {
    await api.delete(`/api/users/${user.id}`);
    fetchUsers();
    toast.success(
      user.is_active ? "Usuario desativado!" : "Usuario ativado!"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[#7880A0]">
          {users.length} usuarios cadastrados
        </p>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setForm({ name: "", email: "", password: "", role: "user" });
              setShowForm(true);
            }
          }}
          className="text-white font-semibold"
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
          {showForm ? "Cancelar" : "Novo Usuario"}
        </Button>
      </div>

      {showForm && (
        <Card
          className="border-[#E2E4EE] border-[#4A5BA8]/30 bg-[#EEF0F8]"
          style={{ borderRadius: 12 }}
        >
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">Nome*</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Email*</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  style={{ borderRadius: 8 }}
                />
              </div>
              {!editingId && (
                <div>
                  <Label className="text-xs">Senha*</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Senha"
                    style={{ borderRadius: 8 }}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs">Perfil</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-[#E2E4EE] rounded-lg text-sm bg-white"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="user">Usuario</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={editingId ? handleUpdate : handleCreate}
                  className="w-full bg-[#5AAF50] hover:bg-[#4A9F40]"
                  style={{ borderRadius: 8 }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle className="text-[#1E2247]">Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E4EE]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#7880A0] uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#7880A0] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#7880A0] uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#7880A0] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#7880A0] uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const rl = roleLabels[user.role] || roleLabels.user;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#E2E4EE] last:border-0 hover:bg-[#F8F9FC] transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-[#1E2247]">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-[#7880A0]">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className="text-white border-0"
                          style={{
                            backgroundColor: rl.color,
                            borderRadius: 6,
                          }}
                        >
                          {rl.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <Badge
                            className="border-0"
                            style={{
                              backgroundColor: "#EEF7ED",
                              color: "#5AAF50",
                              borderRadius: 6,
                            }}
                          >
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            className="border-0"
                            style={{
                              backgroundColor: "#F0F1F6",
                              color: "#7880A0",
                              borderRadius: 6,
                            }}
                          >
                            Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-[#7880A0] hover:text-[#4A5BA8] rounded"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-1.5 rounded ${
                              user.is_active
                                ? "text-[#7880A0] hover:text-red-600"
                                : "text-[#7880A0] hover:text-[#5AAF50]"
                            }`}
                            title={
                              user.is_active ? "Desativar" : "Ativar"
                            }
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[#7880A0]">Nenhum usuario encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
