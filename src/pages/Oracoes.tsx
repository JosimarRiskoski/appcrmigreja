import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter as ModalFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Search, Plus, Trash2, CheckCircle, Loader2, RotateCcw, Clock, ArrowUpDown } from "lucide-react";
 

type LayoutType = "compact" | "medium" | "spaced";

type PrayerRequest = {
  id: string;
  church_id: string;
  member_id: string | null;
  title: string;
  description: string | null;
  status: "aberto" | "em_andamento" | "atendido" | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const LAYOUT_STORAGE_KEY = "graceHubPrayersLayoutPreference";

export default function Oracoes() {
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const prayersQuery = useQuery<PrayerRequest[]>({
    queryKey: ["prayer_requests", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("id, church_id, member_id, title, description, status, is_public, created_at, updated_at")
        .eq("church_id", churchId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PrayerRequest[];
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "aberto" | "em_andamento" | "atendido">("all");
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved as LayoutType) || "medium";
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [toDelete, setToDelete] = useState<PrayerRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>("newest");

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, selectedLayout);
  }, [selectedLayout]);

  

  const filteredPrayers = useMemo(() => {
    const rows = prayersQuery.data || [];
    return rows.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || (p.status || "aberto") === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [prayersQuery.data, searchQuery, filterStatus]);

  const sortedPrayers = useMemo(() => {
    return [...filteredPrayers].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [filteredPrayers, sortOrder]);

  const gridClasses = {
    compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
    medium: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    spaced: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  };

  const cardClassesByLayout: Record<LayoutType, string> = {
    compact: "flex flex-col relative group rounded-lg",
    medium: "flex flex-col relative group rounded-lg",
    spaced: "flex flex-col relative group rounded-xl shadow-md",
  };

  const headerTitleClasses: Record<LayoutType, string> = {
    compact: "text-base pr-8 truncate",
    medium: "text-lg pr-8 truncate",
    spaced: "text-xl pr-8 truncate",
  };

  const contentPadding: Record<LayoutType, string> = {
    compact: "p-2",
    medium: "p-3",
    spaced: "p-4",
  };

  const descriptionClasses: Record<LayoutType, string> = {
    compact: "text-xs text-muted-foreground",
    medium: "text-sm text-muted-foreground",
    spaced: "text-base text-muted-foreground",
  };

  const badgeSizeClasses: Record<LayoutType, string> = {
    compact: "text-[10px] px-2 py-0.5",
    medium: "text-xs px-2 py-0.5",
    spaced: "text-sm px-2.5 py-0.5",
  };

  const footerGapClasses: Record<LayoutType, string> = {
    compact: "gap-1",
    medium: "gap-2",
    spaced: "gap-3",
  };

  const iconSizeClasses: Record<LayoutType, string> = {
    compact: "h-3.5 w-3.5",
    medium: "h-4 w-4",
    spaced: "h-5 w-5",
  };

  const iconButtonSizeClasses: Record<LayoutType, string> = {
    compact: "h-8 w-8",
    medium: "h-9 w-9",
    spaced: "h-10 w-10",
  };

  const renderCard = (p: PrayerRequest) => {
    if (selectedLayout === "compact") {
      return (
        <Card key={p.id} className="rounded-md border bg-muted/40">
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Remover" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setToDelete(p)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover</TooltipContent>
            </Tooltip>
          </div>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm truncate">{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="flex items-center gap-1">
              <Badge className="text-[10px] px-2 py-0.5" variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
              <Badge className="text-[10px] px-2 py-0.5" variant={p.is_public ? "outline" : "secondary"}>{p.is_public ? "Público" : "Privado"}</Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (selectedLayout === "spaced") {
      return (
        <Card key={p.id} className="rounded-2xl ring-1 ring-primary/20 shadow-xl bg-background">
          <div className="h-1 w-full bg-gradient-to-r from-primary/70 to-primary rounded-t-2xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xl pr-8 break-words">{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <div className="text-base leading-relaxed text-muted-foreground">{p.description || "—"}</div>
            <div className="flex items-center gap-2">
              <Badge className="text-sm px-2.5 py-0.5" variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
              <Badge className="text-sm px-2.5 py-0.5" variant={p.is_public ? "outline" : "secondary"}>{p.is_public ? "Público" : "Privado"}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
            </div>
          </CardContent>
          <CardFooter className="gap-3 flex-wrap p-6 pt-0">
            <Button variant="outline" onClick={() => setStatus(p, "em_andamento")}>
              <Clock className="h-4 w-4 mr-2" /> Em andamento
            </Button>
            <Button variant="outline" onClick={() => setStatus(p, "atendido")}>
              <CheckCircle className="h-4 w-4 mr-2" /> Atendido
            </Button>
            <Button variant="outline" onClick={() => setStatus(p, "aberto")}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reabrir
            </Button>
            <div className="ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button aria-label="Remover" variant="ghost" size="icon" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => setToDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remover</TooltipContent>
              </Tooltip>
            </div>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card key={p.id} className="flex flex-col relative group rounded-lg border bg-card">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Remover" variant="ghost" size="icon" className="absolute top-3 right-3 hidden sm:inline-flex opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setToDelete(p)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remover</TooltipContent>
        </Tooltip>
        <CardHeader>
          <CardTitle className="text-lg pr-8 truncate">{p.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          <div className="text-sm text-muted-foreground">{p.description || "—"}</div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
            <Badge variant={p.is_public ? "outline" : "secondary"}>{p.is_public ? "Público" : "Privado"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
          </div>
        </CardContent>
        <CardFooter className="gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Em andamento" variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground" onClick={() => setStatus(p, "em_andamento")}>
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Em andamento</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Atendido" variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground" onClick={() => setStatus(p, "atendido")}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atendido</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Reabrir" variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground" onClick={() => setStatus(p, "aberto")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reabrir</TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    );
  };

  const statusLabel = (s: PrayerRequest["status"]) => {
    if (s === "em_andamento") return "Em andamento";
    if (s === "atendido") return "Atendido";
    return "Aberto";
  };

  const statusVariant: (s: PrayerRequest["status"]) => "default" | "secondary" | "outline" | undefined = (s) => {
    if (s === "em_andamento") return "secondary";
    if (s === "atendido") return "default";
    return "outline";
  };

  const setStatus = async (p: PrayerRequest, next: "aberto" | "em_andamento" | "atendido") => {
    try {
      const { error } = await supabase
        .from("prayer_requests")
        .update({ status: next })
        .eq("id", p.id);
      if (error) throw error;
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["prayer_requests", churchId] });
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleAdd = async () => {
    if (!churchId) return;
    if (!title.trim()) {
      toast.error("Informe o título");
      return;
    }
    try {
      setAdding(true);
      const { error } = await supabase
        .from("prayer_requests")
        .insert({
          church_id: churchId,
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          status: "aberto",
        });
      if (error) throw error;
      toast.success("Pedido criado");
      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setIsPublic(true);
      queryClient.invalidateQueries({ queryKey: ["prayer_requests", churchId] });
    } catch {
      toast.error("Erro ao criar pedido");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from("prayer_requests")
        .delete()
        .eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Pedido removido");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["prayer_requests", churchId] });
    } catch {
      toast.error("Erro ao remover pedido");
    } finally {
      setDeleting(false);
    }
  };

  if (churchLoading || prayersQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orações</h1>
            <p className="text-muted-foreground">Acompanhe e gerencie pedidos de oração</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Todos" },
              { value: "aberto", label: "Abertos" },
              { value: "em_andamento", label: "Em andamento" },
              { value: "atendido", label: "Atendidos" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={filterStatus === (f.value as typeof filterStatus) ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(f.value as typeof filterStatus)}
                className="w-full sm:w-auto"
              >
                {f.label}
              </Button>
            ))}
          </div>

          <LayoutSelector selectedLayout={selectedLayout} onLayoutChange={setSelectedLayout} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {sortedPrayers.length} {sortedPrayers.length === 1 ? "pedido" : "pedidos"}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
              <SelectTrigger className="h-8 w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais novos</SelectItem>
                <SelectItem value="oldest">Mais velhos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredPrayers.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <Heart className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Nenhum pedido correspondente</div>
              <Button variant="outline" onClick={() => setShowAddModal(true)}>Adicionar Pedido</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedPrayers.map((p) => renderCard(p))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Pedido de Oração</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex items-center gap-2">
              <input id="isPublic" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <label htmlFor="isPublic" className="text-sm">Público</label>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={adding}>{adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover pedido</DialogTitle>
          </DialogHeader>
          <div className="text-sm">Esta ação não pode ser desfeita.</div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Remover</Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
