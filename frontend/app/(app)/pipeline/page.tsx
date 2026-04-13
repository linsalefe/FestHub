"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  Settings,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
  is_default?: boolean;
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

/* ---------- default stages ---------- */

const DEFAULT_STAGES = [
  { name: "Novo Lead", color: "#7880A0", position: 0 },
  { name: "Contato Feito", color: "#7B9ACC", position: 1 },
  { name: "Orçamento Enviado", color: "#E8A030", position: 2 },
  { name: "Negociação", color: "#D07840", position: 3 },
  { name: "Fechado", color: "#5AAF50", position: 4 },
  { name: "Perdido", color: "#DC2626", position: 5 },
];

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

  // create pipeline dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [createWithDefaults, setCreateWithDefaults] = useState(true);

  // edit pipeline dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPipelineName, setEditPipelineName] = useState("");
  const [editStages, setEditStages] = useState<
    { id: number; name: string; color: string; position: number }[]
  >([]);
  const [savingPipeline, setSavingPipeline] = useState(false);

  // delete pipeline confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
      await api.put(`/api/leads/${selectedLead.id}`, {
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

  /* --- create pipeline --- */

  async function handleCreatePipeline() {
    if (!newPipelineName.trim()) {
      toast.error("Nome do funil é obrigatório");
      return;
    }
    try {
      const payload: { name: string; stages?: typeof DEFAULT_STAGES } = {
        name: newPipelineName.trim(),
      };
      if (createWithDefaults) {
        payload.stages = DEFAULT_STAGES;
      }
      const res = await api.post("/api/pipelines", payload);
      toast.success("Funil criado");
      setCreateDialogOpen(false);
      setNewPipelineName("");
      setCreateWithDefaults(true);
      setActivePipelineId(res.data.id);
      await fetchPipelines();
    } catch {
      toast.error("Erro ao criar funil");
    }
  }

  /* --- open edit pipeline dialog --- */

  function openEditDialog() {
    if (!activePipeline) return;
    setEditPipelineName(activePipeline.name);
    setEditStages(
      [...activePipeline.stages]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ ...s }))
    );
    setEditDialogOpen(true);
  }

  /* --- rename pipeline (on blur / enter) --- */

  async function handleRenamePipeline() {
    if (!activePipeline || !editPipelineName.trim()) return;
    if (editPipelineName.trim() === activePipeline.name) return;
    try {
      await api.put(`/api/pipelines/${activePipeline.id}`, {
        name: editPipelineName.trim(),
      });
      toast.success("Funil renomeado");
      await fetchPipelines();
    } catch {
      toast.error("Erro ao renomear funil");
    }
  }

  /* --- stage management in edit dialog --- */

  function handleMoveStage(index: number, direction: "up" | "down") {
    const newStages = [...editStages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;
    [newStages[index], newStages[targetIndex]] = [
      newStages[targetIndex],
      newStages[index],
    ];
    // recalculate positions
    newStages.forEach((s, i) => (s.position = i));
    setEditStages(newStages);
  }

  function handleEditStageName(index: number, name: string) {
    const newStages = [...editStages];
    newStages[index] = { ...newStages[index], name };
    setEditStages(newStages);
  }

  function handleEditStageColor(index: number, color: string) {
    const newStages = [...editStages];
    newStages[index] = { ...newStages[index], color };
    setEditStages(newStages);
  }

  async function handleDeleteStage(stageId: number) {
    if (!activePipeline) return;
    try {
      await api.delete(
        `/api/pipelines/${activePipeline.id}/stages/${stageId}`
      );
      toast.success("Estágio removido");
      setEditStages((prev) => prev.filter((s) => s.id !== stageId));
      await fetchPipelines();
    } catch {
      toast.error("Erro ao remover estágio");
    }
  }

  async function handleAddStage() {
    if (!activePipeline) return;
    const position = editStages.length;
    try {
      const res = await api.post(
        `/api/pipelines/${activePipeline.id}/stages`,
        {
          name: "Novo Estágio",
          color: "#4A5BA8",
          position,
        }
      );
      toast.success("Estágio adicionado");
      setEditStages((prev) => [
        ...prev,
        {
          id: res.data.id,
          name: res.data.name,
          color: res.data.color,
          position: res.data.position,
        },
      ]);
      await fetchPipelines();
    } catch {
      toast.error("Erro ao adicionar estágio");
    }
  }

  async function handleSaveStageChanges() {
    if (!activePipeline) return;
    setSavingPipeline(true);
    try {
      // update each stage name/color
      await Promise.all(
        editStages.map((s) =>
          api.put(`/api/pipelines/${activePipeline.id}/stages/${s.id}`, {
            name: s.name,
            color: s.color,
          })
        )
      );
      // reorder
      await api.put(`/api/pipelines/${activePipeline.id}/stages/reorder`, {
        stages: editStages.map((s, i) => ({ id: s.id, position: i })),
      });
      toast.success("Alterações salvas");
      await fetchPipelines();
      fetchLeads();
    } catch {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSavingPipeline(false);
    }
  }

  /* --- delete pipeline --- */

  async function handleDeletePipeline() {
    if (!activePipeline) return;
    try {
      await api.delete(`/api/pipelines/${activePipeline.id}`);
      toast.success("Funil excluído");
      setDeleteConfirmOpen(false);
      setEditDialogOpen(false);
      setActivePipelineId(null);
      const res = await api.get("/api/pipelines");
      const data: Pipeline[] = res.data;
      setPipelines(data);
      if (data.length > 0) {
        setActivePipelineId(data[0].id);
      }
    } catch {
      toast.error("Erro ao excluir funil");
    }
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
            {activePipeline?.is_default && (
              <span className="text-xs text-[#7880A0] font-normal">
                (padrão)
              </span>
            )}
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
                  {p.is_default && (
                    <span className="text-xs text-[#7880A0] font-normal ml-1">
                      (padrão)
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-[#E2E4EE]">
                <button
                  onClick={() => {
                    setPipelineOpen(false);
                    setCreateDialogOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#4A5BA8] hover:bg-[#F5F6FA] transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Criar novo funil...
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit pipeline button */}
        {activePipeline && (
          <button
            onClick={openEditDialog}
            className="p-2 rounded-lg hover:bg-[#F5F6FA] text-[#7880A0] hover:text-[#4A5BA8] transition-colors"
            title="Editar Funil"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}

        {/* New pipeline button */}
        <Button
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#4A5BA8] hover:bg-[#3d4e96] text-white text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Novo Funil
        </Button>

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

      {/* Create pipeline dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">
              Novo Funil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-[#7880A0]">
                Nome do Funil
              </Label>
              <Input
                placeholder="Ex: Funil de Vendas"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePipeline();
                }}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createWithDefaults}
                onChange={(e) => setCreateWithDefaults(e.target.checked)}
                className="h-4 w-4 rounded border-[#E2E4EE] text-[#4A5BA8] focus:ring-[#4A5BA8]"
              />
              <span className="text-sm text-[#1E2247]">
                Criar com estágios padrão
              </span>
            </label>
            {createWithDefaults && (
              <div className="bg-[#F5F6FA] rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-[#7880A0] font-medium mb-2">
                  Estágios que serão criados:
                </p>
                {DEFAULT_STAGES.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-[#1E2247]">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={handleCreatePipeline}
              className="w-full bg-[#4A5BA8] hover:bg-[#3d4e96] text-white"
            >
              Criar Funil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit pipeline dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">
              Editar Funil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Pipeline name */}
            <div>
              <Label className="text-xs text-[#7880A0]">
                Nome do Funil
              </Label>
              <Input
                value={editPipelineName}
                onChange={(e) => setEditPipelineName(e.target.value)}
                onBlur={handleRenamePipeline}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenamePipeline();
                }}
              />
            </div>

            {/* Stages list */}
            <div>
              <Label className="text-xs text-[#7880A0] mb-2 block">
                Estágios
              </Label>
              <div className="space-y-2">
                {editStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2 bg-[#F5F6FA] rounded-lg p-2"
                  >
                    <input
                      type="color"
                      value={stage.color}
                      onChange={(e) =>
                        handleEditStageColor(index, e.target.value)
                      }
                      className="h-8 w-8 rounded border border-[#E2E4EE] cursor-pointer shrink-0"
                      title="Cor do estágio"
                    />
                    <Input
                      value={stage.name}
                      onChange={(e) =>
                        handleEditStageName(index, e.target.value)
                      }
                      className="flex-1 text-sm bg-white"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveStage(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-white text-[#7880A0] hover:text-[#4A5BA8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStage(index, "down")}
                        disabled={index === editStages.length - 1}
                        className="p-1 rounded hover:bg-white text-[#7880A0] hover:text-[#4A5BA8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="p-1 rounded hover:bg-red-50 text-[#7880A0] hover:text-red-500 transition-colors shrink-0"
                      title="Remover estágio"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddStage}
                className="mt-2 text-[#4A5BA8] hover:text-[#3d4e96] hover:bg-[#EEF0F8] text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar Estágio
              </Button>
            </div>

            {/* Save changes */}
            <Button
              onClick={handleSaveStageChanges}
              disabled={savingPipeline}
              className="w-full bg-[#4A5BA8] hover:bg-[#3d4e96] text-white"
            >
              {savingPipeline ? "Salvando..." : "Salvar Alterações"}
            </Button>

            {/* Delete pipeline */}
            <div className="border-t border-[#E2E4EE] pt-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Funil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete pipeline confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2247]">
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-sm text-[#7880A0]">
              Tem certeza que deseja excluir o funil{" "}
              <strong className="text-[#1E2247]">
                {activePipeline?.name}
              </strong>
              ? Todos os estágios e leads associados serão removidos. Esta ação
              não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 text-[#7880A0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeletePipeline}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
