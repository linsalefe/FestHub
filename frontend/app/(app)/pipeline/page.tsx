"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- types ---------- */

interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
}

interface Pipeline {
  id: number;
  name: string;
  stages: Stage[];
}

interface Lead {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  event_type?: string;
  event_date?: string;
  estimated_value?: number;
  notes?: string;
  theme?: string;
  stage_id: number;
  position: number;
}

/* ---------- component ---------- */

export default function PipelinePage() {
  const router = useRouter();

  /* --- state --- */
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<number | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineOpen, setPipelineOpen] = useState(false);

  // inline add form
  const [addingStageId, setAddingStageId] = useState<number | null>(null);
  const [newLead, setNewLead] = useState({
    name: "",
    event_type: "",
    estimated_value: "",
  });

  // detail dialog
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  /* --- derived --- */
  const activePipeline = pipelines.find((p) => p.id === activePipelineId);
  const stages = (activePipeline?.stages ?? []).sort(
    (a, b) => a.position - b.position
  );

  /* --- data fetching --- */

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await api.get("/api/pipelines");
      const data: Pipeline[] = res.data;
      setPipelines(data);
      if (data.length > 0 && !activePipelineId) {
        setActivePipelineId(data[0].id);
      }
    } catch {
      toast.error("Erro ao carregar pipelines");
    }
  }, [activePipelineId]);

  const fetchLeads = useCallback(async () => {
    if (!activePipelineId) return;
    try {
      const res = await api.get("/api/leads", {
        params: { pipeline_id: activePipelineId },
      });
      setLeads(res.data);
    } catch {
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  }, [activePipelineId]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (activePipelineId) {
      setLoading(true);
      fetchLeads();
    }
  }, [activePipelineId, fetchLeads]);

  /* --- helpers --- */

  function leadsForStage(stageId: number) {
    return leads
      .filter((l) => l.stage_id === stageId)
      .sort((a, b) => a.position - b.position);
  }

  function formatDate(d?: string) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  }

  /* --- drag & drop --- */

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const leadId = Number(draggableId);
    const newStageId = Number(destination.droppableId);
    const newPosition = destination.index;

    // optimistic update
    setLeads((prev) => {
      const updated = prev.map((l) =>
        l.id === leadId
          ? { ...l, stage_id: newStageId, position: newPosition }
          : l
      );
      return updated;
    });

    try {
      await api.patch(`/api/leads/${leadId}/move`, {
        stage_id: newStageId,
        position: newPosition,
      });
      fetchLeads();
    } catch {
      toast.error("Erro ao mover lead");
      fetchLeads();
    }
  }

  /* --- add lead --- */

  async function handleAddLead(stageId: number) {
    if (!newLead.name.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }
    try {
      await api.post("/api/leads", {
        name: newLead.name,
        event_type: newLead.event_type || undefined,
        estimated_value: newLead.estimated_value
          ? Number(newLead.estimated_value)
          : undefined,
        stage_id: stageId,
        pipeline_id: activePipelineId,
      });
      toast.success("Lead criado");
      setAddingStageId(null);
      setNewLead({ name: "", event_type: "", estimated_value: "" });
      fetchLeads();
    } catch {
      toast.error("Erro ao criar lead");
    }
  }

  /* --- update lead --- */

  async function handleUpdateLead() {
    if (!selectedLead) return;
    try {
      await api.patch(`/api/leads/${selectedLead.id}`, {
        ...editForm,
        estimated_value: editForm.estimated_value
          ? Number(editForm.estimated_value)
          : undefined,
      });
      toast.success("Lead atualizado");
      setSelectedLead(null);
      fetchLeads();
    } catch {
      toast.error("Erro ao atualizar lead");
    }
  }

  /* --- delete lead --- */

  async function handleDeleteLead(id: number) {
    try {
      await api.delete(`/api/leads/${id}`);
      toast.success("Lead removido");
      setSelectedLead(null);
      fetchLeads();
    } catch {
      toast.error("Erro ao remover lead");
    }
  }

  /* --- convert lead --- */

  async function handleConvert(id: number) {
    try {
      const res = await api.post(`/api/leads/${id}/convert`);
      toast.success("Orcamento criado");
      setSelectedLead(null);
      const budgetId = res.data?.id ?? res.data?.budget_id;
      if (budgetId) {
        router.push(`/budgets/${budgetId}`);
      } else {
        router.push("/budgets");
      }
    } catch {
      toast.error("Erro ao converter lead");
    }
  }

  /* --- open detail --- */

  function openDetail(lead: Lead) {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      event_date: lead.event_date ?? "",
      event_type: lead.event_type ?? "",
      estimated_value: lead.estimated_value,
      notes: lead.notes ?? "",
    });
  }

  /* ---------- render ---------- */

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#7880A0]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#E2E4EE] bg-white shrink-0">
        <div className="relative">
          <button
            onClick={() => setPipelineOpen(!pipelineOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E4EE] bg-white text-sm font-medium text-[#1E2247] hover:border-[#4A5BA8] transition-colors"
          >
            {activePipeline?.name ?? "Selecione um pipeline"}
            <ChevronDown className="h-4 w-4 text-[#7880A0]" />
          </button>
          {pipelineOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E2E4EE] rounded-lg shadow-lg z-50">
              {pipelines.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePipelineId(p.id);
                    setPipelineOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F5F6FA] transition-colors ${
                    p.id === activePipelineId
                      ? "text-[#4A5BA8] font-semibold bg-[#EEF0F8]"
                      : "text-[#1E2247]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-sm text-[#7880A0]">
          {leads.length} lead{leads.length !== 1 && "s"}
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 p-6 h-full min-w-max">
            {stages.map((stage) => {
              const stageLeads = leadsForStage(stage.id);
              return (
                <div
                  key={stage.id}
                  className="flex flex-col min-w-[300px] max-w-[300px] bg-[#F5F6FA] rounded-xl"
                >
                  {/* Column header */}
                  <div className="shrink-0">
                    <div
                      className="h-1 rounded-t-xl"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="flex items-center justify-between px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1E2247]">
                          {stage.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-white text-[#7880A0] text-xs font-medium"
                        >
                          {stageLeads.length}
                        </Badge>
                      </div>
                      <button
                        onClick={() => {
                          setAddingStageId(
                            addingStageId === stage.id ? null : stage.id
                          );
                          setNewLead({
                            name: "",
                            event_type: "",
                            estimated_value: "",
                          });
                        }}
                        className="p-1 rounded hover:bg-white text-[#7880A0] hover:text-[#4A5BA8] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline add form */}
                  {addingStageId === stage.id && (
                    <div className="mx-3 mb-2 p-3 bg-white rounded-lg border border-[#E2E4EE] space-y-2">
                      <Input
                        placeholder="Nome do lead"
                        value={newLead.name}
                        onChange={(e) =>
                          setNewLead({ ...newLead, name: e.target.value })
                        }
                        className="text-sm"
                        autoFocus
                      />
                      <Input
                        placeholder="Tipo do evento"
                        value={newLead.event_type}
                        onChange={(e) =>
                          setNewLead({
                            ...newLead,
                            event_type: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                      <Input
                        placeholder="Valor estimado"
                        type="number"
                        value={newLead.estimated_value}
                        onChange={(e) =>
                          setNewLead({
                            ...newLead,
                            estimated_value: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddLead(stage.id)}
                          className="flex-1 bg-[#4A5BA8] hover:bg-[#3d4e96] text-white text-xs"
                        >
                          Adicionar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddingStageId(null)}
                          className="text-xs text-[#7880A0]"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Droppable area */}
                  <Droppable droppableId={String(stage.id)}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[60px] transition-colors ${
                          snapshot.isDraggingOver ? "bg-[#EEF0F8]" : ""
                        }`}
                      >
                        {stageLeads.map((lead, index) => (
                          <Draggable
                            key={lead.id}
                            draggableId={String(lead.id)}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => openDetail(lead)}
                                className={`bg-white rounded-lg shadow-sm border border-[#E2E4EE] p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                  dragSnapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-[#1E2247] leading-tight">
                                    {lead.theme ? `${lead.theme} ` : ""}
                                    {lead.name}
                                  </p>
                                </div>
                                {lead.event_type && (
                                  <p className="text-xs text-[#7880A0] mt-1">
                                    {lead.event_type}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  {lead.event_date && (
                                    <span className="text-xs text-[#7880A0]">
                                      {formatDate(lead.event_date)}
                                    </span>
                                  )}
                                  {lead.estimated_value != null &&
                                    lead.estimated_value > 0 && (
                                      <span className="text-xs font-semibold text-[#5AAF50]">
                                        {formatCurrency(lead.estimated_value)}
                                      </span>
                                    )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">
              Detalhes do Lead
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-[#7880A0]">Nome</Label>
              <Input
                value={editForm.name ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#7880A0]">Telefone</Label>
                <Input
                  value={editForm.phone ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-[#7880A0]">Email</Label>
                <Input
                  value={editForm.email ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#7880A0]">Data do Evento</Label>
                <Input
                  type="date"
                  value={editForm.event_date ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, event_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-[#7880A0]">Tipo do Evento</Label>
                <Input
                  value={editForm.event_type ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, event_type: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#7880A0]">Valor Estimado</Label>
              <Input
                type="number"
                value={editForm.estimated_value ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    estimated_value: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[#7880A0]">Observacoes</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-[#E2E4EE] px-3 py-2 text-sm text-[#1E2247] focus:outline-none focus:ring-2 focus:ring-[#4A5BA8] focus:border-transparent resize-none"
                value={editForm.notes ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUpdateLead}
                className="flex-1 bg-[#4A5BA8] hover:bg-[#3d4e96] text-white"
              >
                Salvar
              </Button>
              <Button
                onClick={() => selectedLead && handleConvert(selectedLead.id)}
                className="flex-1 text-white"
                style={{
                  background: "linear-gradient(135deg, #E8A030, #D07840)",
                }}
              >
                Converter em Orcamento
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => selectedLead && handleDeleteLead(selectedLead.id)}
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
