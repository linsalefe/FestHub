"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Settings {
  tenant_id: number;
  tax_rate: number;
  profit_margin: number;
  events_per_month: number;
  company_name: string | null;
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

  const fetchData = () => {
    api.get("/api/settings").then((r) => setSettings(r.data));
    api.get("/api/settings/fixed-costs").then((r) => setFixedCosts(r.data));
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
    });
    toast.success("Configuracoes salvas!");
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Parameters */}
      <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle className="text-lg">Parametros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-stone-500">Impostos (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) =>
                      setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Margem desejada (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.profit_margin}
                    onChange={(e) =>
                      setSettings({ ...settings, profit_margin: parseFloat(e.target.value) || 0 })
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Festas / mes</Label>
                  <Input
                    type="number"
                    value={settings.events_per_month}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        events_per_month: parseInt(e.target.value) || 1,
                      })
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
              <Button onClick={saveSettings} className="bg-amber-600 hover:bg-amber-700" style={{ borderRadius: 8 }}>
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fixed Costs */}
      <Card className="border-[#E7E5E4]" style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle className="text-lg">Custos Fixos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fixedCosts.map((fc) => (
            <div key={fc.id} className="flex items-center justify-between py-2 border-b border-[#E7E5E4] last:border-0">
              <span className="text-sm text-stone-700">{fc.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(fc.value)}</span>
                <button onClick={() => deleteFixedCost(fc.id)} className="text-stone-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Nome do custo"
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

          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Total custos fixos / mes</span>
            <span className="font-bold">{formatCurrency(totalFixed)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Rateio por festa</span>
            <span className="font-bold text-amber-600">{formatCurrency(perEvent)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
