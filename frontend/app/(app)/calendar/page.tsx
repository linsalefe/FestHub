"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Clock,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface CalendarEvent {
  id: number;
  title: string;
  event_date: string;
  event_time: string | null;
  event_address: string | null;
  status: "confirmed" | "tentative" | "cancelled";
  notes: string | null;
  client_id: number | null;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#5AAF50",
  tentative: "#E8A030",
  cancelled: "#DC2626",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  tentative: "Tentativo",
  cancelled: "Cancelado",
};

interface FormState {
  title: string;
  event_date: string;
  event_time: string;
  event_address: string;
  status: string;
  notes: string;
  client_id: string;
}

const emptyForm: FormState = {
  title: "",
  event_date: "",
  event_time: "",
  event_address: "",
  status: "confirmed",
  notes: "",
  client_id: "",
};

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = useCallback(() => {
    api
      .get(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`)
      .then((r) => setEvents(r.data))
      .catch(() => toast.error("Erro ao carregar eventos"));
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const eventsForDay = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.event_date + "T00:00:00");
      return d.getDate() === day;
    });

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const openCreateDialog = () => {
    setEditingEvent(null);
    const dateStr = selectedDay
      ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
      : "";
    setForm({ ...emptyForm, event_date: dateStr });
    setDialogOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time || "",
      event_address: event.event_address || "",
      status: event.status,
      notes: event.notes || "",
      client_id: event.client_id ? String(event.client_id) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date) {
      toast.error("Titulo e data sao obrigatorios");
      return;
    }
    const payload = {
      ...form,
      event_time: form.event_time || null,
      event_address: form.event_address || null,
      notes: form.notes || null,
      client_id: form.client_id ? Number(form.client_id) : null,
    };
    try {
      if (editingEvent) {
        await api.put(`/api/calendar/${editingEvent.id}`, payload);
        toast.success("Evento atualizado!");
      } else {
        await api.post("/api/calendar", payload);
        toast.success("Evento criado!");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingEvent(null);
      fetchEvents();
    } catch {
      toast.error("Erro ao salvar evento");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/calendar/${id}`);
      toast.success("Evento removido!");
      fetchEvents();
    } catch {
      toast.error("Erro ao remover evento");
    }
  };

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-[#EEF0F8] text-[#4A5BA8] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-[#1E2247] min-w-[200px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-[#EEF0F8] text-[#4A5BA8] transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#7880A0]">
            {events.length} evento{events.length !== 1 ? "s" : ""} no mes
          </span>
          <Button
            onClick={openCreateDialog}
            className="text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #E8A030, #D07840)",
              borderRadius: 8,
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-[#E2E4EE]" style={{ borderRadius: 12 }}>
        <CardContent className="p-0">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-[#E2E4EE]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-[#7880A0] uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-b border-[#E2E4EE] last:border-b-0"
            >
              {week.map((day, di) => {
                const dayEvents = day ? eventsForDay(day) : [];
                const selected = day === selectedDay;
                return (
                  <button
                    key={di}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                    className={`
                      min-h-[80px] p-2 text-left border-r border-[#E2E4EE] last:border-r-0 transition-colors relative
                      ${day ? "hover:bg-[#EEF0F8] cursor-pointer" : "bg-[#FAFBFE]"}
                      ${selected ? "bg-[#EEF0F8] ring-2 ring-[#4A5BA8] ring-inset" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <span
                          className={`
                            text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full
                            ${isToday(day) ? "bg-[#4A5BA8] text-white" : "text-[#1E2247]"}
                          `}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {dayEvents.map((ev) => (
                              <span
                                key={ev.id}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: STATUS_COLORS[ev.status],
                                }}
                                title={ev.title}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[#7880A0]">
        <span className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#5AAF50" }}
          />
          Confirmado
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#E8A030" }}
          />
          Tentativo
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#DC2626" }}
          />
          Cancelado
        </span>
      </div>

      {/* Selected Day Events */}
      {selectedDay !== null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1E2247]">
            Eventos em {selectedDay} de {MONTHS[currentMonth]}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-[#7880A0]">
              Nenhum evento neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <Card
                  key={event.id}
                  className="border-[#E2E4EE]"
                  style={{ borderRadius: 12 }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: STATUS_COLORS[event.status],
                            }}
                          />
                          <p className="font-semibold text-[#1E2247]">
                            {event.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color: STATUS_COLORS[event.status],
                              borderColor: STATUS_COLORS[event.status],
                            }}
                          >
                            {STATUS_LABELS[event.status]}
                          </Badge>
                        </div>
                        {event.event_time && (
                          <p className="text-sm text-[#7880A0] flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {event.event_time}
                          </p>
                        )}
                        {event.event_address && (
                          <p className="text-sm text-[#7880A0] flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.event_address}
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-[#7880A0]">
                            {event.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditDialog(event)}
                          className="text-[#7880A0] hover:text-[#4A5BA8] p-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-[#7880A0] hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Titulo *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nome do evento"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data *</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm({ ...form, event_date: e.target.value })
                  }
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <Label className="text-xs">Horario</Label>
                <Input
                  type="time"
                  value={form.event_time}
                  onChange={(e) =>
                    setForm({ ...form, event_time: e.target.value })
                  }
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Endereco</Label>
              <Input
                value={form.event_address}
                onChange={(e) =>
                  setForm({ ...form, event_address: e.target.value })
                }
                placeholder="Local do evento"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm({ ...form, status: val as CalendarEvent["status"] })
                }
              >
                <SelectTrigger className="w-full" style={{ borderRadius: 8 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="tentative">Tentativo</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ID do Cliente (opcional)</Label>
              <Input
                type="number"
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value })
                }
                placeholder="ID do cliente"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div>
              <Label className="text-xs">Observacoes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas adicionais..."
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              style={{ borderRadius: 8 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#4A5BA8] hover:bg-[#3A4B98] text-white"
              style={{ borderRadius: 8 }}
            >
              {editingEvent ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
