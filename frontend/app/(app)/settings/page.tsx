"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Building2,
  Calculator,
  Wallet,
  Palette,
  HelpCircle,
  Phone,
  AtSign,
  MapPin,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Settings {
  tenant_id: number;
  tax_rate: number;
  profit_margin: number;
  events_per_month: number;
  company_name: string | null;
  company_phone: string | null;
  company_instagram: string | null;
  company_address: string | null;
  company_whatsapp: string | null;
  logo_url: string | null;
  accent_color: string | null;
}

interface FixedCost {
  id: number;
  name: string;
  value: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [newFcName, setNewFcName] = useState("");
  const [newFcValue, setNewFcValue] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sRes, fcRes] = await Promise.all([
        api.get("/api/settings"),
        api.get("/api/settings/fixed-costs"),
      ]);
      setSettings(sRes.data);
      setFixedCosts(fcRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    await api.put("/api/settings", {
      tax_rate: settings.tax_rate,
      profit_margin: settings.profit_margin,
      events_per_month: settings.events_per_month,
      company_name: settings.company_name,
      company_phone: settings.company_phone,
      company_instagram: settings.company_instagram,
      company_address: settings.company_address,
      company_whatsapp: settings.company_whatsapp,
      logo_url: settings.logo_url,
      accent_color: settings.accent_color,
    });
    toast.success("Configurações salvas com sucesso!");
  };

  const addFixedCost = async () => {
    if (!newFcName) return;
    await api.post("/api/settings/fixed-costs", {
      name: newFcName,
      value: parseFloat(newFcValue) || 0,
    });
    setNewFcName("");
    setNewFcValue("");
    fetchData();
    toast.success("Custo fixo adicionado!");
  };

  const deleteFixedCost = async (id: number) => {
    await api.delete(`/api/settings/fixed-costs/${id}`);
    fetchData();
    toast.success("Custo fixo removido!");
  };

  const totalFixed = fixedCosts.reduce((s, fc) => s + fc.value, 0);
  const perEvent =
    settings && settings.events_per_month > 0
      ? totalFixed / settings.events_per_month
      : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="bg-[#F0F1F6] p-1 rounded-xl">
          <TabsTrigger value="empresa" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Building2 className="h-4 w-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="precificacao" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Calculator className="h-4 w-4" /> Precificação
          </TabsTrigger>
          <TabsTrigger value="custos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Wallet className="h-4 w-4" /> Custos Fixos
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Palette className="h-4 w-4" /> Aparência
          </TabsTrigger>
        </TabsList>

        {/* Tab: Empresa */}
        <TabsContent value="empresa">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#4A5BA8]" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Nome da Empresa
                        </Label>
                        <Input
                          value={settings.company_name || ""}
                          onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                          placeholder="Sua empresa de festas"
                          style={{ borderRadius: 8 }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Telefone
                        </Label>
                        <Input
                          value={settings.company_phone || ""}
                          onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          style={{ borderRadius: 8 }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                          <AtSign className="h-3 w-3" /> AtSign
                        </Label>
                        <Input
                          value={settings.company_instagram || ""}
                          onChange={(e) => setSettings({ ...settings, company_instagram: e.target.value })}
                          placeholder="@suaempresa"
                          style={{ borderRadius: 8 }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                          <Phone className="h-3 w-3" /> WhatsApp
                        </Label>
                        <Input
                          value={settings.company_whatsapp || ""}
                          onChange={(e) => setSettings({ ...settings, company_whatsapp: e.target.value })}
                          placeholder="(11) 99999-9999"
                          style={{ borderRadius: 8 }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Endereço
                      </Label>
                      <Input
                        value={settings.company_address || ""}
                        onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                        placeholder="Rua Exemplo, 123 - Cidade/UF"
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#7880A0] flex items-center gap-1">
                        <Globe className="h-3 w-3" /> URL do Logo
                      </Label>
                      <Input
                        value={settings.logo_url || ""}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        placeholder="https://..."
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <Button
                      onClick={saveSettings}
                      style={{ background: "linear-gradient(135deg, #E8A030, #D07840)", borderRadius: 8 }}
                      className="text-white font-semibold"
                    >
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Precificação */}
        <TabsContent value="precificacao">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#E8A030]" />
                  Parâmetros de Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1E2247] flex items-center gap-1">
                          Impostos (%)
                          <span title="Porcentagem de impostos que incide sobre suas vendas (MEI: 5-6%, Simples: 6-15%)">
                            <HelpCircle className="h-3.5 w-3.5 text-[#7880A0]" />
                          </span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.tax_rate}
                          onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                          style={{ borderRadius: 8 }}
                        />
                        <p className="text-xs text-[#7880A0]">Normalmente entre 6% e 15%</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1E2247] flex items-center gap-1">
                          Margem desejada (%)
                          <span title="Porcentagem de lucro mínimo que você quer em cada festa">
                            <HelpCircle className="h-3.5 w-3.5 text-[#7880A0]" />
                          </span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.profit_margin}
                          onChange={(e) => setSettings({ ...settings, profit_margin: parseFloat(e.target.value) || 0 })}
                          style={{ borderRadius: 8 }}
                        />
                        <p className="text-xs text-[#7880A0]">Recomendamos mínimo de 30%</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1E2247] flex items-center gap-1">
                          Festas / mês
                          <span title="Média de festas que você realiza por mês — usado para ratear custos fixos">
                            <HelpCircle className="h-3.5 w-3.5 text-[#7880A0]" />
                          </span>
                        </Label>
                        <Input
                          type="number"
                          value={settings.events_per_month}
                          onChange={(e) => setSettings({ ...settings, events_per_month: parseInt(e.target.value) || 1 })}
                          style={{ borderRadius: 8 }}
                        />
                        <p className="text-xs text-[#7880A0]">Usado no rateio de custos fixos</p>
                      </div>
                    </div>
                    <Button
                      onClick={saveSettings}
                      style={{ background: "linear-gradient(135deg, #E8A030, #D07840)", borderRadius: 8 }}
                      className="text-white font-semibold"
                    >
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Custos Fixos */}
        <TabsContent value="custos">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#5AAF50]" />
                  Custos Fixos Mensais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fixedCosts.map((fc, idx) => (
                  <motion.div
                    key={fc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between py-3 border-b border-[#E2E4EE] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#E8A030]" />
                      <span className="text-sm text-[#1E2247]">{fc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1E2247]">{formatCurrency(fc.value)}</span>
                      <button onClick={() => deleteFixedCost(fc.id)} className="text-[#7880A0] hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Nome do custo (ex: Aluguel)"
                    value={newFcName}
                    onChange={(e) => setNewFcName(e.target.value)}
                    className="flex-1"
                    style={{ borderRadius: 8 }}
                  />
                  <Input
                    placeholder="Valor"
                    type="number"
                    step="0.01"
                    value={newFcValue}
                    onChange={(e) => setNewFcValue(e.target.value)}
                    className="w-32"
                    style={{ borderRadius: 8 }}
                  />
                  <Button size="sm" variant="outline" onClick={addFixedCost} style={{ borderRadius: 8 }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FFF8EC]">
                    <p className="text-xs text-[#7880A0]">Total custos fixos / mês</p>
                    <p className="text-xl font-bold text-[#E8A030]">{formatCurrency(totalFixed)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#EEF0F8]">
                    <p className="text-xs text-[#7880A0]">Rateio por festa</p>
                    <p className="text-xl font-bold text-[#4A5BA8]">{formatCurrency(perEvent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Aparência */}
        <TabsContent value="aparencia">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-[#9B59B6]" />
                  Aparência dos PDFs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[#1E2247]">Cor Accent (PDFs e Contratos)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={settings.accent_color || "#4A5BA8"}
                          onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                          className="w-16 h-16 rounded-xl border border-[#E2E4EE] cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={settings.accent_color || "#4A5BA8"}
                            onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                            placeholder="#4A5BA8"
                            style={{ borderRadius: 8 }}
                          />
                          <p className="text-xs text-[#7880A0] mt-1">Esta cor será usada nos cabeçalhos dos PDFs de orçamento e contrato</p>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-4 p-4 rounded-xl border border-[#E2E4EE]">
                        <p className="text-xs text-[#7880A0] mb-2">Preview</p>
                        <div
                          className="h-8 rounded-lg flex items-center px-4"
                          style={{ backgroundColor: settings.accent_color || "#4A5BA8" }}
                        >
                          <span className="text-white text-sm font-medium">
                            {settings.company_name || "Sua Empresa"} — Cabeçalho do PDF
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={saveSettings}
                      style={{ background: "linear-gradient(135deg, #E8A030, #D07840)", borderRadius: 8 }}
                      className="text-white font-semibold"
                    >
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
