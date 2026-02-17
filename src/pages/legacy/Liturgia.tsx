import { useState, useMemo, useEffect } from "react";
import { Plus, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { LiturgyCard } from "@/components/liturgy/LiturgyCard";
import { DeleteLiturgyModal } from "@/components/liturgy/DeleteLiturgyModal";
import { EditLiturgyOrderModal } from "@/components/liturgy/EditLiturgyOrderModal";
import { EmptyState } from "@/components/liturgy/EmptyState";
import { Liturgy, LayoutType } from "@/types/liturgy";
import { supabase } from "@/integrations/supabase/client";
import { AddLiturgyModal } from "@/components/liturgy/AddLiturgyModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
 
import { useChurchId } from "@/hooks/useChurchId";

const computeStatus = (d: Date): 'today' | 'upcoming' | 'week' | 'future' => {
  const now = new Date();
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) return 'today';
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) return 'upcoming';
  if (diffDays <= 7) return 'week';
  return 'future';
};

export default function Liturgia() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    return (localStorage.getItem('graceHubLayoutPreference') as LayoutType) || 'medium';
  });
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const rawLiturgiesQuery = useQuery<Array<{ id: string; title: string; event_date: string; location: string | null; minister: string; theme: string; type: string }>>({
    queryKey: ["liturgies", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from('liturgies')
        .select('id, title, event_date, location, minister, theme, type')
        .eq('church_id', churchId as string)
        .order('event_date', { ascending: true });
      return (data || []) as Array<{ id: string; title: string; event_date: string; location: string | null; minister: string; theme: string; type: string }>;
    },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');
  const [filterType, setFilterType] = useState<'all' | 'Culto' | 'Celebração' | 'Santa Ceia' | 'Vigília'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [liturgyToDelete, setLiturgyToDelete] = useState<Liturgy | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<{ id: string; title: string; event_date: string; location: string | null; minister: string; theme: string; type: string } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLiturgyId, setOrderLiturgyId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('graceHubLayoutPreference', selectedLayout);
  }, [selectedLayout]);

  

  const liturgies: Liturgy[] = useMemo(() => {
    const raw = rawLiturgiesQuery.data || [];
    return raw.map(row => {
      const d = new Date(row.event_date);
      return {
        id: row.id,
        title: row.title,
        date: format(d, "EEE, dd MMM", { locale: ptBR }),
        time: format(d, "HH:mm"),
        minister: row.minister || '',
        theme: row.theme || '',
        status: computeStatus(d),
        location: row.location || '',
        type: (['Culto','Celebração','Santa Ceia','Vigília'].includes(row.type) ? row.type : 'Culto') as Liturgy['type'],
      } as Liturgy;
    });
  }, [rawLiturgiesQuery.data]);

  const filteredLiturgies = useMemo(() => {
    return liturgies.filter(liturgy => {
      const matchesSearch = 
        liturgy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        liturgy.minister.toLowerCase().includes(searchQuery.toLowerCase()) ||
        liturgy.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        liturgy.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPeriod = 
        filterPeriod === 'all' ||
        (filterPeriod === 'today' && liturgy.status === 'today') ||
        (filterPeriod === 'week' && (liturgy.status === 'today' || liturgy.status === 'week'));

      const matchesType = filterType === 'all' || liturgy.type === filterType;

      return matchesSearch && matchesPeriod && matchesType;
    });
  }, [liturgies, searchQuery, filterPeriod, filterType]);

  const sortedLiturgies = useMemo(() => {
    const map = new Map((rawLiturgiesQuery.data || []).map(e => [e.id, e.event_date]));
    return [...filteredLiturgies].sort((a, b) => {
      const aRaw = map.get(a.id);
      const bRaw = map.get(b.id);
      const aDate = aRaw ? new Date(aRaw).getTime() : 0;
      const bDate = bRaw ? new Date(bRaw).getTime() : 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [filteredLiturgies, rawLiturgiesQuery.data, sortOrder]);

  const handleDeleteClick = (id: string) => {
    const liturgy = liturgies.find(l => l.id === id);
    if (liturgy) {
      setLiturgyToDelete(liturgy);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!liturgyToDelete) return;
    try {
      await supabase
        .from('liturgies')
        .delete()
        .eq('id', liturgyToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["liturgies", churchId] });
      toast({ title: "Programação excluída" });
      setShowDeleteModal(false);
      setLiturgyToDelete(null);
    } catch {
      toast({ title: 'Erro ao excluir programação' });
    }
  };

  const handleCreateLiturgy = () => {
    setEventToEdit(null);
    setShowAddModal(true);
  };

  const handleEditLiturgy = (id: string) => {
    const raw = (rawLiturgiesQuery.data || []).find(e => e.id === id) || null;
    setEventToEdit(raw);
    setShowAddModal(true);
  };

  const handleEditOrder = (id: string) => {
    setOrderLiturgyId(id);
    setShowOrderModal(true);
  };

  const gridClasses = cn(
    "grid transition-all duration-300",
    selectedLayout === 'compact' && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
    selectedLayout === 'medium' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    selectedLayout === 'spaced' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
  );

  const hasFilters = searchQuery !== '' || filterPeriod !== 'all';
  const periodLabel = filterPeriod === 'all' ? 'Todos' : filterPeriod === 'today' ? 'Hoje' : 'Esta semana';
  const typeLabel = filterType === 'all' ? 'Todos' : filterType;

  const handleMigrate = async () => {
    try {
      const { data: legacy } = await supabase
        .from('events')
        .select('id, title, event_date, location, description')
        .eq('church_id', churchId as string)
        .not('description', 'is', null);

      const rows = (legacy || []).map(ev => {
        let minister = '';
        let theme = '';
        let type = 'Culto';
        try {
          const payload = ev.description ? JSON.parse(ev.description) : {};
          minister = typeof payload.minister === 'string' ? payload.minister : '';
          theme = typeof payload.theme === 'string' ? payload.theme : '';
          type = typeof payload.type === 'string' ? payload.type : 'Culto';
        } catch (_e) {
          String(_e);
        }
        return {
          church_id: churchId as string,
          title: ev.title,
          event_date: ev.event_date,
          location: ev.location,
          minister,
          theme,
          type,
        };
      });

      if (rows.length === 0) {
        toast({ title: 'Nenhum conteúdo para migrar' });
        return;
      }

      const { error } = await supabase
        .from('liturgies')
        .insert(rows);
      if (error) throw error;

      toast({ title: 'Migração concluída' });
      queryClient.invalidateQueries({ queryKey: ["liturgies", churchId] });
    } catch (_e) {
      toast({ title: 'Erro na migração' });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Culto e Programação</h1>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90"
          onClick={handleCreateLiturgy}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Programação
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleMigrate}>Migrar da tabela de eventos</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar Culto e Programação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">Filtros: {periodLabel}, {typeLabel}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Período</div>
                <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as 'all' | 'today' | 'week')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tipo</div>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'Culto' | 'Celebração' | 'Santa Ceia' | 'Vigília')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo de Culto e Programação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="Culto">Culto</SelectItem>
                    <SelectItem value="Celebração">Celebração</SelectItem>
                    <SelectItem value="Santa Ceia">Santa Ceia</SelectItem>
                    <SelectItem value="Vigília">Vigília</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

          <LayoutSelector
            selectedLayout={selectedLayout}
            onLayoutChange={setSelectedLayout}
          />
        </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {sortedLiturgies.length} {sortedLiturgies.length === 1 ? 'Culto e Programação' : 'Cultos e Programações'}
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

      {rawLiturgiesQuery.isLoading || churchLoading ? null : filteredLiturgies.length > 0 ? (
        <div className={gridClasses}>
          {sortedLiturgies.map((liturgy) => (
            <LiturgyCard
              key={liturgy.id}
              liturgy={liturgy}
              layout={selectedLayout}
              onEdit={handleEditLiturgy}
              onDelete={handleDeleteClick}
              onEditOrder={handleEditOrder}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={hasFilters}
          onCreateLiturgy={handleCreateLiturgy}
        />
      )}

      <DeleteLiturgyModal
        isOpen={showDeleteModal}
        liturgy={liturgyToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setLiturgyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <AddLiturgyModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        event={eventToEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["liturgies", churchId] });
          setShowAddModal(false);
          setEventToEdit(null);
        }}
      />

      <EditLiturgyOrderModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        liturgyId={orderLiturgyId}
        onChanged={() => queryClient.invalidateQueries({ queryKey: ["liturgies", churchId] })}
      />
    </div>
  );
}
