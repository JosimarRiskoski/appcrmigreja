import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cleanNotes } from "@/lib/cleanNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { Search, UserPlus, Phone, Tag, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/members/EmptyState";
import { maskPhone } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { useChurchId } from "@/hooks/useChurchId";
import type { Member } from "@/types/member";
 

type StageKey =
  | "primeira_visita"
  | "feito_contato"
  | "pronto_integrar"
  | "convertido_membro";

const STAGES: { key: StageKey; label: string }[] = [
  { key: "primeira_visita", label: "Primeira visita" },
  { key: "feito_contato", label: "Feito contato" },
  { key: "pronto_integrar", label: "Pronto para integrar" },
  { key: "convertido_membro", label: "Converter em membro" },
];

const STAGE_COLORS: Record<StageKey, string> = {
  primeira_visita: "#3B82F6",
  feito_contato: "#8B5CF6",
  pronto_integrar: "#F59E0B",
  convertido_membro: "#10B981",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeStage(stage: string): StageKey {
  if (stage === 'segunda_visita') return 'feito_contato';
  if (stage === 'frequentando') return 'pronto_integrar';
  if (stage === 'primeira_visita' || stage === 'feito_contato' || stage === 'pronto_integrar' || stage === 'convertido_membro') return stage as StageKey;
  return 'primeira_visita';
}

type HistoryEntry = { timestamp: string; from: StageKey | null; to: StageKey; user: string; action: 'movido' | 'convertido' | 'criado' };

type Visitor = {
  id: string;
  church_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  first_visit_date: string;
  notes: string | null;
  tag: string | null;
  status: StageKey;
  history: HistoryEntry[];
};

export default function Visitantes() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openNewVisitor, setOpenNewVisitor] = useState(false);
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const [useFallbackMembers, setUseFallbackMembers] = useState(false);
  const [confirmVisitor, setConfirmVisitor] = useState<Visitor | null>(null);
  const [converting, setConverting] = useState(false);
  const [deleteVisitorTarget, setDeleteVisitorTarget] = useState<Visitor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [firstVisitOpen, setFirstVisitOpen] = useState(false);
  const [firstVisitDate, setFirstVisitDate] = useState<Date | null>(null);
  const META_STORAGE_KEY = 'graceHubVisitorMeta';
  const [extraConvertedVisitors, setExtraConvertedVisitors] = useState<Visitor[]>([]);
  const [incompleteMemberIds, setIncompleteMemberIds] = useState<Set<string>>(new Set());
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  type LocalMeta = { stage: StageKey; tag?: string; history: HistoryEntry[] };

  const loadMetaMap = useCallback((): Record<string, LocalMeta> => {
    try {
      const raw = localStorage.getItem(META_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [META_STORAGE_KEY]);

  const saveMetaMap = useCallback((map: Record<string, LocalMeta>) => {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(map));
  }, [META_STORAGE_KEY]);

  const getMeta = useCallback((id: string): LocalMeta | null => {
    const map = loadMetaMap();
    return map[id] || null;
  }, [loadMetaMap]);

  const setMeta = useCallback((id: string, meta: LocalMeta) => {
    const map = loadMetaMap();
    map[id] = meta;
    saveMetaMap(map);
  }, [loadMetaMap, saveMetaMap]);

  const deleteMeta = useCallback((id: string) => {
    const map = loadMetaMap();
    delete map[id];
    saveMetaMap(map);
  }, [loadMetaMap, saveMetaMap]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) { setCurrentUserName(''); return; }
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', uid)
          .maybeSingle();
        setCurrentUserName(((profile?.full_name as string) || '').trim() || (session?.user?.email || ''));
      } catch {
        setCurrentUserName('');
      }
    })();
  }, []);

  const isMemberIncomplete = useCallback((m: Tables<'members'>) => {
    const missing = (v: string | null) => !v || !String(v).trim();
    return missing(m.email) || missing(m.phone) || missing(m.zip_code) || missing(m.address) || missing(m.city);
  }, []);

  const parseMemberToConvertedVisitor = useCallback((m: Tables<'members'>, history: HistoryEntry[] = []): Visitor => {
    return {
      id: m.id,
      church_id: m.church_id,
      full_name: m.full_name,
      phone: m.phone || '',
      email: m.email,
      first_visit_date: m.member_since || new Date().toISOString().slice(0,10),
      notes: m.notes || '',
      tag: 'Dados incompletos',
      status: 'convertido_membro',
      history
    };
  }, []);

  const openMemberEdit = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          cell:cells!members_cell_id_fkey(
            id,
            name,
            leader_id,
            meeting_day,
            meeting_time,
            meeting_location
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setMemberToEdit((data as unknown) as Member);
      setEditMemberOpen(true);
    } catch {
      toast.error('Não foi possível carregar o membro');
    }
  }, []);

  const handleEditSuccess = useCallback(async () => {
    setEditMemberOpen(false);
    if (!memberToEdit) return;
    try {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberToEdit.id)
        .single();
      const m = data as Tables<'members'>;
      if (isMemberIncomplete(m)) {
        const prevHist = extraConvertedVisitors.find(e => e.id === m.id)?.history || [];
        const updatedExtra = parseMemberToConvertedVisitor(m, prevHist);
        setExtraConvertedVisitors(prev => [updatedExtra, ...prev.filter(p => p.id !== m.id)]);
        setIncompleteMemberIds(prev => { const next = new Set(prev); next.add(m.id); return next; });
      } else {
        setExtraConvertedVisitors(prev => prev.filter(p => p.id !== m.id));
        setIncompleteMemberIds(prev => { const next = new Set(prev); next.delete(m.id); return next; });
        toast.success('Dados do membro atualizados');
      }
    } catch {
      // silencioso
    }
  }, [memberToEdit, isMemberIncomplete, parseMemberToConvertedVisitor, extraConvertedVisitors]);

  const parseMemberToVisitor = useCallback((m: Tables<'members'>): Visitor => {
    const local = getMeta(m.id) || { stage: 'primeira_visita', tag: undefined, history: [] };
    const firstVisitFromNotes = (() => {
      const n = (m.notes || '').toString();
      const match = n.match(/first_visit\s*=\s*(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : null;
    })();
    return {
      id: m.id,
      church_id: m.church_id,
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      first_visit_date: m.member_since || firstVisitFromNotes || new Date().toISOString().slice(0,10),
      notes: m.notes || '',
      tag: local.tag || null,
      status: normalizeStage(local.stage as unknown as string),
      history: local.history
    };
  }, [getMeta]);

  

  

  const refreshIncompleteMembers = useCallback(async () => {
    if (!churchId) return;
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('church_id', churchId as string)
      .neq('status', 'visitante');
    if (error) return;
    const list = ((data as Tables<'members'>[] | null) || []).filter(isMemberIncomplete);
    const extras = list.map((m) => parseMemberToConvertedVisitor(m));
    setExtraConvertedVisitors(extras);
    setIncompleteMemberIds(new Set(extras.map(e => e.id)));
  }, [churchId, isMemberIncomplete, parseMemberToConvertedVisitor]);

  const attemptMigrationToVisitors = useCallback(async (church_id: string, currentVisitorsFromMembers: Visitor[]) => {
    try {
      const ping = await supabase.from('visitors').select('id').limit(1);
      if (ping.error) return; // tabela ainda indisponível
      if (currentVisitorsFromMembers.length === 0) return;
      const payloads = currentVisitorsFromMembers.map(v => ({
        church_id,
        full_name: v.full_name,
        phone: v.phone,
        email: v.email,
        first_visit_date: v.first_visit_date,
        notes: v.notes || '',
        tag: v.tag || null,
        status: v.status,
        history: v.history
      }));
      const { error: insertErr } = await supabase.from('visitors').insert(payloads);
      if (insertErr) return;
      currentVisitorsFromMembers.forEach(v => deleteMeta(v.id));
      setUseFallbackMembers(false);
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .eq('church_id', church_id)
        .order('first_visit_date', { ascending: false });
      const normalized = ((data as Tables<'visitors'>[] | null) || []).map((row) => ({
        id: row.id,
        church_id: row.church_id,
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
        first_visit_date: row.first_visit_date,
        notes: row.notes,
        tag: row.tag,
        status: normalizeStage(row.status as unknown as string),
        history: Array.isArray(row.history) ? (row.history as unknown as HistoryEntry[]) : []
      }));
      setVisitors(normalized);
      toast.success('Visitantes migrados para a tabela dedicada');
    } catch {
      // silencioso
    }
  }, [deleteMeta]);

  useEffect(() => {
    if (churchLoading) return;
    if (!churchId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('visitors')
          .select('*')
          .eq('church_id', churchId as string)
          .order('first_visit_date', { ascending: false });
        if (error) {
          setUseFallbackMembers(true);
          const { data: membersData, error: membersErr } = await supabase
            .from('members')
            .select('*')
            .eq('church_id', churchId as string)
            .eq('status', 'visitante')
            .order('member_since', { ascending: false });
          if (membersErr) throw membersErr;
          const parsed = ((membersData as Tables<'members'>[] | null) || []).map((m) => parseMemberToVisitor(m));
          setVisitors(parsed);
          await refreshIncompleteMembers();
          await attemptMigrationToVisitors(churchId as string, parsed);
        } else {
          const normalized = ((data as Tables<'visitors'>[] | null) || []).map((row) => ({
            id: row.id,
            church_id: row.church_id,
            full_name: row.full_name,
            phone: row.phone,
            email: row.email,
            first_visit_date: row.first_visit_date,
            notes: row.notes,
            tag: row.tag,
            status: normalizeStage(row.status as unknown as string),
            history: Array.isArray(row.history) ? (row.history as unknown as HistoryEntry[]) : []
          }));
          setVisitors(normalized);
          await refreshIncompleteMembers();
        }
      } catch (e) {
        toast.error('Erro ao carregar visitantes');
      } finally {
        setLoading(false);
      }
    })();
  }, [churchId, churchLoading, attemptMigrationToVisitors, parseMemberToVisitor, refreshIncompleteMembers]);

  

  // moved above

  const filteredVisitors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const pool = [...visitors, ...extraConvertedVisitors];
    return pool.filter(v => {
      const matchesSearch = !q || v.full_name.toLowerCase().includes(q) || v.phone.includes(searchQuery);
      return matchesSearch;
    });
  }, [visitors, extraConvertedVisitors, searchQuery]);

  const groupedByStage: Record<StageKey, Visitor[]> = useMemo(() => {
    const base: Record<StageKey, Visitor[]> = {
      primeira_visita: [], feito_contato: [], pronto_integrar: [], convertido_membro: []
    };
    filteredVisitors.forEach(v => {
      const s = v.status as StageKey;
      if (s in base) base[s].push(v);
    });
    return base;
  }, [filteredVisitors]);

  const totalsData = useMemo(() => STAGES.map(s => ({ key: s.key, name: s.label, value: groupedByStage[s.key].length, color: STAGE_COLORS[s.key] })), [groupedByStage]);
  const conversionRate = useMemo(() => {
    const total = filteredVisitors.length;
    const converted = groupedByStage.convertido_membro.length;
    return total === 0 ? 0 : Math.round((converted / total) * 100);
  }, [filteredVisitors.length, groupedByStage.convertido_membro.length]);

  const [hoveredStage, setHoveredStage] = useState<StageKey | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, visitor: Visitor) => {
    e.dataTransfer.setData('text/plain', visitor.id);
    e.dataTransfer.setData('application/source-stage', visitor.status);
    setDraggingId(visitor.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
  };

  const onDrop = async (e: React.DragEvent, targetStage: StageKey) => {
    const id = e.dataTransfer.getData('text/plain');
    const sourceStage = e.dataTransfer.getData('application/source-stage') as StageKey;
    e.preventDefault();
    if (incompleteMemberIds.has(id)) {
      toast.error('Complete os dados do membro para sair desta coluna');
      return;
    }
    const visitor = visitors.find(v => v.id === id);
    if (!visitor) return;
    const baseHistory = Array.isArray(visitor.history) ? visitor.history : [];

    if (targetStage === 'convertido_membro') {
      await handleConvertToMember(visitor);
      return;
    }

    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      from: sourceStage,
      to: targetStage,
      user: currentUserName || '—',
      action: 'movido'
    };

    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: targetStage, history: [...(baseHistory), entry] } : v));

    try {
      if (useFallbackMembers) {
        const current = getMeta(id) || { stage: sourceStage, tag: visitor.tag || undefined, history: baseHistory };
        const nextMeta: LocalMeta = { stage: targetStage, tag: current.tag, history: [...current.history, entry] };
        setMeta(id, nextMeta);
      } else {
        const { error } = await supabase
          .from('visitors')
          .update({ status: targetStage, history: [...(baseHistory), entry] })
          .eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      toast.error('Erro ao mover visitante');
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: sourceStage, history: v.history } : v));
    }
  };

  const handleConvertToMember = async (visitor: Visitor) => {
    if (useFallbackMembers) {
      setConfirmVisitor(visitor);
      return;
    }
    await performConvertToMember(visitor);
  };

  const performConvertToMember = async (visitor: Visitor) => {
    if (!churchId) return;
    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      from: visitor.status,
      to: 'convertido_membro',
      user: currentUserName || '—',
      action: 'convertido'
    };
    const baseHistory = Array.isArray(visitor.history) ? visitor.history : [];
    try {
      setConverting(true);
      if (useFallbackMembers) {
        const { error } = await supabase
          .from('members')
          .update({ status: 'ativo' })
          .eq('id', visitor.id);
        if (error) throw error;
        const { data: mem } = await supabase
          .from('members')
          .select('*')
          .eq('id', visitor.id)
          .single();
        if (mem && isMemberIncomplete(mem as Tables<'members'>)) {
          const extra = parseMemberToConvertedVisitor(mem as Tables<'members'>, [...baseHistory, entry]);
          setExtraConvertedVisitors(prev => prev.some(p => p.id === extra.id) ? prev : [extra, ...prev]);
          setIncompleteMemberIds(prev => { const next = new Set(prev); next.add(extra.id); return next; });
        }
        deleteMeta(visitor.id);
        setVisitors(prev => prev.filter(v => v.id !== visitor.id));
        toast.success(`${visitor.full_name} convertido em membro`);
      } else {
        const notes = [visitor.notes ?? '', 'source: visitor'].filter(Boolean).join(' | ');
        const { data: newMember, error: insertErr } = await supabase
          .from('members')
          .insert({
            church_id: churchId,
            full_name: visitor.full_name,
            phone: visitor.phone,
            email: visitor.email,
            notes,
            member_since: new Date().toISOString().slice(0, 10),
            status: 'ativo'
          })
          .select('*')
          .single();
        if (insertErr) throw insertErr;

        const { error: updateErr } = await supabase
          .from('visitors')
          .update({ history: [...baseHistory, entry] })
          .eq('id', visitor.id);
        if (updateErr) throw updateErr;

        const { error: deleteErr } = await supabase
          .from('visitors')
          .delete()
          .eq('id', visitor.id);
        if (deleteErr) throw deleteErr;

        setVisitors(prev => prev.filter(v => v.id !== visitor.id));
        if (newMember && isMemberIncomplete(newMember as Tables<'members'>)) {
          const extra = parseMemberToConvertedVisitor(newMember as Tables<'members'>, [...baseHistory, entry]);
          setExtraConvertedVisitors(prev => prev.some(p => p.id === extra.id) ? prev : [extra, ...prev]);
          setIncompleteMemberIds(prev => { const next = new Set(prev); next.add(extra.id); return next; });
        }
        toast.success(`${visitor.full_name} convertido em membro`);
      }
    } catch (err) {
      toast.error('Erro ao converter visitante');
    } finally {
      setConverting(false);
      setConfirmVisitor(null);
      setOpenDetails(false);
    }
  };

  const performDeleteVisitor = async (visitor: Visitor) => {
    try {
      setDeleting(true);
      if (useFallbackMembers) {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', visitor.id);
        if (error) throw error;
        deleteMeta(visitor.id);
      } else {
        const { error } = await supabase
          .from('visitors')
          .delete()
          .eq('id', visitor.id);
        if (error) throw error;
      }
      setVisitors(prev => prev.filter(v => v.id !== visitor.id));
      toast.success('Visitante excluído');
    } catch {
      toast.error('Erro ao excluir visitante');
    } finally {
      setDeleting(false);
      setDeleteVisitorTarget(null);
      setOpenDetails(false);
    }
  };

  const handleCardClick = (v: Visitor) => {
    setSelectedVisitor(v);
    setOpenDetails(true);
  };

  const handleCreateVisitor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!churchId) return;
    const form = e.currentTarget as HTMLFormElement & {
      full_name: { value: string };
      phone: { value: string };
      first_visit_date: { value: string };
      email: { value: string };
      notes: { value: string };
      tag: { value: string };
    };
    const payload = {
      church_id: churchId,
      full_name: form.full_name.value.trim(),
      phone: form.phone.value.trim(),
      first_visit_date: form.first_visit_date.value,
      email: form.email.value.trim() || null,
      notes: form.notes.value.trim() || null,
      tag: form.tag.value.trim() || null,
      status: 'primeira_visita' as StageKey,
      history: [{ timestamp: new Date().toISOString(), from: null, to: 'primeira_visita', user: 'self', action: 'criado' }]
    };
    if (!payload.full_name || !payload.phone || !payload.first_visit_date) {
      toast.error('Preencha nome, telefone e data da primeira visita');
      return;
    }
    try {
      if (useFallbackMembers) {
        const { data, error } = await supabase.from('members').insert({
          church_id: churchId,
          full_name: payload.full_name,
          phone: payload.phone,
          email: (payload.email || null),
          member_since: payload.first_visit_date,
          status: 'visitante',
          notes: (payload.notes || '') as string
        }).select('*').single();
        if (error) throw error;
        const v = parseMemberToVisitor(data);
        setMeta(v.id, { stage: 'primeira_visita', tag: payload.tag || undefined, history: payload.history as HistoryEntry[] });
        setVisitors(prev => [v, ...prev]);
      } else {
        const { data, error } = await supabase.from('visitors').insert(payload).select('*').single();
        if (error) throw error;
        setVisitors(prev => [data as Visitor, ...prev]);
      }
      setOpenNewVisitor(false);
      toast.success('Visitante criado');
    } catch (err) {
      toast.error('Erro ao criar visitante');
    }
  };

  // Use somente a função importada de src/lib/cleanNotes.ts para exibição

  // moved above

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-x-hidden relative z-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitantes</h1>
          <p className="text-muted-foreground">Gerencie os visitantes e converta-os em membros</p>
        </div>
        <Button onClick={() => setOpenNewVisitor(true)} style={{ marginRight: 44 }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Visitante
        </Button>
      </div>

      

      <div className="flex gap-3 items-start">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">Mostrando {filteredVisitors.length} {filteredVisitors.length === 1 ? 'visitante' : 'visitantes'}</div>

      {filteredVisitors.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery}
          onAddMember={() => setOpenNewVisitor(true)}
          buttonLabel="Adicionar Visitante"
        />
      ) : (
        <>
        <style>{`
          .kanban-wrapper::-webkit-scrollbar { height: 8px; }
          .kanban-wrapper::-webkit-scrollbar-track { background: transparent; }
          .kanban-wrapper::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 9999px; }
          .kanban-wrapper { scrollbar-width: thin; scrollbar-color: #E5E7EB transparent; }
        `}</style>
        <div className="kanban-wrapper" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 10, alignItems: 'flex-start', width: '100%', position: 'relative', zIndex: 0 }}>
            {STAGES.map((stage) => (
              <div
                key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setHoveredStage(stage.key); }}
                onDragLeave={() => setHoveredStage(prev => (prev === stage.key ? null : prev))}
                onDrop={(e) => onDrop(e, stage.key)}
                style={{
                  width: 240,
                  minWidth: 240,
                  maxWidth: 240,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                  padding: 12,
                  borderRadius: 12,
                  minHeight: 520,
                  border: '1px solid #E5E7EB',
                  borderTop: `4px solid ${STAGE_COLORS[stage.key]}`,
                  boxShadow: hoveredStage === stage.key ? `inset 0 0 0 2px ${rgba(STAGE_COLORS[stage.key], 0.3)}` : 'none',
                  backgroundColor: hoveredStage === stage.key ? rgba(STAGE_COLORS[stage.key], 0.06) : '#F9FAFB',
                  position: 'relative',
                  zIndex: 0
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <h3 className="font-bold">{stage.label}</h3>
                  <span style={{
                    background: rgba(STAGE_COLORS[stage.key], 0.15),
                    color: STAGE_COLORS[stage.key],
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontSize: 12
                  }}>{groupedByStage[stage.key].length}</span>
                </div>
                <div>
                  {groupedByStage[stage.key].map((v) => (
                    <Card
                      key={v.id}
                      draggable={!incompleteMemberIds.has(v.id)}
                      onDragStart={(e) => onDragStart(e, v)}
                      onDragEnd={onDragEnd}
                      onClick={() => handleCardClick(v)}
                      className="cursor-grab border-none shadow-none"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#16213C',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 12,
                        marginBottom: 10,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.20)',
                        opacity: draggingId === v.id ? 0.95 : 1,
                        transition: 'box-shadow 0.2s ease',
                        position: 'relative',
                        zIndex: 0
                      }}
                    >
                      <CardContent style={{ padding: 12, color: '#FFFFFF' }}>
                        <div className="font-medium truncate" style={{ color: STAGE_COLORS[stage.key] }}>{v.full_name}</div>
                        <div className="text-xs mt-1 space-y-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {maskPhone(v.phone || "")}</div>
                          <div className="flex items-center gap-2"><CalendarIcon className="h-3 w-3" /> {new Date(v.first_visit_date).toLocaleDateString()}</div>
                        </div>
                        {(() => { const text = cleanNotes(v.notes || ''); return text ? <div className="text-xs mt-2">{text}</div> : null; })()}
                        {v.tag && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs inline-flex items-center gap-1" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}><Tag className="h-3 w-3" /> {v.tag}</Badge>
                          </div>
                        )}
                        {/* Botão de conversão removido conforme requisito: mover para coluna "Converter em membro" para converter */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
        </>
      )}

      {filteredVisitors.length > 0 && (
        <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6 overflow-x-hidden">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Totais por estágio</CardTitle>
            </CardHeader>
          <CardContent className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalsData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 12, padding: 8 }} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {totalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={rgba(entry.color, 0.85)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Taxa de conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionRate}%</div>
              <div className="mt-1.5 text-sm text-muted-foreground">Convertidos / Total de visitantes filtrados</div>
              <div className="mt-3 h-2 w-full bg-muted rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${conversionRate}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Visitante</SheetTitle>
          </SheetHeader>
          {selectedVisitor && (
            <div className="space-y-3 mt-4">
              <div className="text-lg font-semibold">{selectedVisitor.full_name}</div>
              <div className="text-sm text-muted-foreground">Status atual: {STAGES.find(s => s.key === selectedVisitor.status)?.label}</div>
              <div className="text-sm">Telefone: {selectedVisitor.phone}</div>
              {selectedVisitor.email && <div className="text-sm">Email: {selectedVisitor.email}</div>}
              <div className="text-sm">Primeira visita: {new Date(selectedVisitor.first_visit_date).toLocaleDateString()}</div>
              {selectedVisitor.tag && <div className="text-sm">Tag: {selectedVisitor.tag}</div>}
              {(() => { const text = cleanNotes(selectedVisitor.notes || ''); return <div className="text-sm">Observações: {text || '—'}</div>; })()}
              <div className="pt-3">
                <div className="font-medium mb-2">Histórico</div>
                <div className="space-y-2 max-h-64 overflow-auto border rounded p-2">
                  {(Array.isArray(selectedVisitor.history) ? selectedVisitor.history : []).map((h, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      <span className="font-medium">{new Date(h.timestamp).toLocaleString()}</span> — {h.action} {h.from ? `${h.from} → ` : ''}{h.to} — {h.user}
                    </div>
                  ))}
                </div>
              </div>
              {selectedVisitor.status === 'convertido_membro' && incompleteMemberIds.has(selectedVisitor.id) && (
                <div className="mt-3">
                  <Button onClick={() => openMemberEdit(selectedVisitor.id)}>Editar membro</Button>
                </div>
              )}
              {selectedVisitor.status !== 'convertido_membro' && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Excluir visitante"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteVisitorTarget(selectedVisitor)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={openNewVisitor} onOpenChange={(o) => { setOpenNewVisitor(o); if (!o) setFirstVisitDate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo visitante</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVisitor} className="space-y-3">
            <Input name="full_name" placeholder="Nome" />
            <Input name="phone" placeholder="Telefone" onChange={(e) => { e.currentTarget.value = maskPhone(e.currentTarget.value); }} />
            <div>
              <Popover open={firstVisitOpen} onOpenChange={setFirstVisitOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !firstVisitDate && "text-muted-foreground"
                    )}
                    onClick={() => setFirstVisitOpen(true)}
                  >
                    {firstVisitDate ? (
                      format(firstVisitDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data da primeira visita</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={firstVisitDate ?? undefined}
                    onSelect={(d) => setFirstVisitDate(d ?? null)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                    onConfirm={(date) => {
                      setFirstVisitDate(date ?? null);
                      setFirstVisitOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" name="first_visit_date" value={firstVisitDate ? format(firstVisitDate, "yyyy-MM-dd") : ""} />
            </div>
            <Input name="email" placeholder="Email (opcional)" />
            <Input name="notes" placeholder="Observações (opcional)" />
            <Input name="tag" placeholder="Tag (opcional)" />
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      

      <Dialog open={!!confirmVisitor} onOpenChange={(o) => !o && setConfirmVisitor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Tem certeza que deseja converter</div>
            {confirmVisitor && (
              <div className="text-sm">
                <span className="font-semibold">{confirmVisitor.full_name}</span> em membro?
              </div>
            )}
            <div className="text-xs text-muted-foreground">Esta ação atualizará o cadastro existente e removerá o visitante do funil.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmVisitor(null)}>Cancelar</Button>
            <Button onClick={() => confirmVisitor && performConvertToMember(confirmVisitor)} disabled={converting}>{converting ? 'Convertendo...' : 'Converter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteVisitorTarget} onOpenChange={(o) => !o && setDeleteVisitorTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir visitante</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Tem certeza que deseja excluir</div>
            {deleteVisitorTarget && (
              <div className="text-sm">
                <span className="font-semibold">{deleteVisitorTarget.full_name}</span>?
              </div>
            )}
            <div className="text-xs text-muted-foreground">Esta ação remove o visitante do funil. Não pode ser desfeita.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVisitorTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteVisitorTarget && performDeleteVisitor(deleteVisitorTarget)} disabled={deleting}>{deleting ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMemberModal
        open={editMemberOpen}
        onOpenChange={setEditMemberOpen}
        member={memberToEdit}
        onSuccess={handleEditSuccess}
      />

      
    </div>
  );
}
