import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, Download, Search, UserPlus, Trash2, ArrowUpDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { maskPhone } from "@/lib/utils";

type Checkin = {
  id: string;
  event_id: string;
  member_id: string | null;
  visitor_name: string | null;
  visitor_phone: string | null;
  checked_in_at: string;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

const EXPORT_SEP: "," | ";" = ";";
const exportCSV = (headers: string[], rows: string[][], filename: string) => {
  const escape = (val: string) => {
    const needsQuote = /["\n]/.test(val) || val.includes(EXPORT_SEP);
    const quoted = val.replace(/"/g, '""');
    return needsQuote ? `"${quoted}"` : quoted;
  };
  const headerLine = headers.map(escape).join(EXPORT_SEP);
  const dataLines = rows.map(r => r.map(escape).join(EXPORT_SEP));
  const content = [`sep=${EXPORT_SEP}`, headerLine, ...dataLines].join("\r\n");
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const encoded = new TextEncoder().encode(content);
  const blob = new Blob([bom, encoded], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Checkin() {
  const queryClient = useQueryClient();
  const { data: churchId } = useChurchId();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [newVisitorName, setNewVisitorName] = useState("");
  const [newVisitorPhone, setNewVisitorPhone] = useState("");
  const [newVisitorNotes, setNewVisitorNotes] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>("newest");
  const [presentSearchQuery, setPresentSearchQuery] = useState("");

  const roleQuery = useQuery<{ role: string } | null>({
    queryKey: ["profileRole"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      return data ?? null;
    },
  });

  const eventsQuery = useQuery<Tables<'events'>[]>({
    queryKey: ["checkinEvents", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("events")
        .select("id,title,event_date,location")
        .eq("church_id", churchId as string)
        .gte("event_date", since)
        .order("event_date", { ascending: false });
      return (data || []) as Tables<'events'>[];
    },
  });

  useEffect(() => {
    const list = eventsQuery.data || [];
    if (!selectedEventId && list.length > 0) {
      const now = Date.now();
      const next = list.find(e => new Date(e.event_date).getTime() >= now);
      setSelectedEventId((next || list[list.length - 1]).id);
    }
  }, [eventsQuery.data, selectedEventId]);

  const checkinsQuery = useQuery<Checkin[]>({
    queryKey: ["attendance", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_attendance")
        .select("id,event_id,member_id,visitor_name,visitor_phone,checked_in_at")
        .eq("event_id", selectedEventId as string)
        .order("checked_in_at", { ascending: false });
      return (data || []) as Checkin[];
    },
  });

  const memberIds = useMemo(() => (checkinsQuery.data || []).map(c => c.member_id).filter(Boolean) as string[], [checkinsQuery.data]);
  const membersMapQuery = useQuery<Record<string, Tables<'members'> >>({
    queryKey: ["checkinMembersMap", memberIds.join(",")],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("members").select("id,full_name,photo_url,phone").in("id", memberIds);
      const map: Record<string, Tables<'members'> > = {};
      (data || []).forEach((m: Tables<'members'>) => { if (m.id) map[m.id] = m; });
      return map;
    },
  });

  const [searchResults, setSearchResults] = useState<Array<{ type: "member" | "visitor"; id?: string; name: string; phone?: string }>>([]);
  useEffect(() => {
    const run = async () => {
      if (!churchId) return;
      const q = searchQuery.trim();
      if (q.length < 2) { setSearchResults([]); return; }
      const [membersRes, visitorsRes] = await Promise.all([
        supabase.from("members").select("id,full_name,phone,status").eq("church_id", churchId as string).or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(10),
        supabase.from("visitors").select("id,full_name,phone").eq("church_id", churchId as string).or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(10)
      ]);
      const members = (membersRes.data || []).map(m => ({ type: "member" as const, id: m.id, name: m.full_name, phone: m.phone || undefined }));
      const visitors = (visitorsRes.error ? [] : (visitorsRes.data || []).map(v => ({ type: "visitor" as const, id: v.id, name: v.full_name, phone: v.phone || undefined })));
      setSearchResults([...members, ...visitors]);
    };
    run();
  }, [searchQuery, churchId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const envBase = import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined;
  const base = envBase || origin;
  const checkinUrl = selectedEventId && base ? `${base}/checkin/${selectedEventId}` : "";
  const qrSrc = selectedEventId ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkinUrl)}` : "";

  const copyLink = async () => {
    if (!checkinUrl) return;
    try {
      await navigator.clipboard.writeText(checkinUrl);
      toast.success("Link de check-in copiado");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = checkinUrl;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) {
          toast.success("Link de check-in copiado");
        } else {
          toast.error("Falha ao copiar. Toque e segure para copiar.");
        }
      } catch {
        toast.error("Falha ao copiar. Toque e segure para copiar.");
      }
    }
  };

  const downloadQR = async () => {
    if (!qrSrc || !selectedEventId) return;
    const res = await fetch(qrSrc);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-${selectedEventId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const registerCheckin = async (payload: { event_id: string; member_id?: string; visitor_name?: string; visitor_phone?: string }) => {
    try {
      const insertPayload = {
        event_id: payload.event_id,
        member_id: payload.member_id ?? null,
        visitor_name: payload.visitor_name ?? null,
        visitor_phone: payload.visitor_phone ?? null,
        checked_in_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("event_attendance").insert(insertPayload);
      if (error) throw error;
      toast.success("Presença registrada");
      queryClient.invalidateQueries({ queryKey: ["attendance", selectedEventId] });
    } catch {
      toast.error("Erro ao registrar presença");
    }
  };

  const handleManualSelect = async (p: { type: "member" | "visitor"; id?: string; name: string; phone?: string }) => {
    if (!selectedEventId) return;
    if (p.type === "member" && p.id) {
      await registerCheckin({ event_id: selectedEventId, member_id: p.id });
    } else {
      await registerCheckin({ event_id: selectedEventId, visitor_name: p.name, visitor_phone: p.phone });
    }
  };

  const registerNewVisitor = async () => {
    if (!selectedEventId || !churchId) return;
    const name = newVisitorName.trim();
    const phone = newVisitorPhone.trim();
    if (!name || !phone) { toast.error("Informe nome e telefone"); return; }
    try {
      const ping = await supabase.from("visitors").select("id").limit(1);
      if (!ping.error) {
        await supabase.from("visitors").insert({ church_id: churchId as string, full_name: name, phone, notes: newVisitorNotes || null, status: "primeira_visita", first_visit_date: new Date().toISOString().slice(0,10) });
      } else {
        await supabase.from("members").insert({ church_id: churchId as string, full_name: name, phone, status: "visitante", notes: newVisitorNotes || null }).select("id").single();
      }
      await registerCheckin({ event_id: selectedEventId, visitor_name: name, visitor_phone: phone });
      setNewVisitorName(""); setNewVisitorPhone(""); setNewVisitorNotes("");
    } catch {
      toast.error("Erro ao cadastrar visitante");
    }
  };

  const removeCheckin = async (id: string) => {
    const { error } = await supabase.from("event_attendance").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Removido");
    queryClient.invalidateQueries({ queryKey: ["attendance", selectedEventId] });
  };

  

  const exportPresence = () => {
    if (!selectedEventId) return;
    const event = (eventsQuery.data || []).find(e => e.id === selectedEventId);
                const rows = (checkinsQuery.data || []).map(c => {
      const isMember = !!c.member_id;
      const name = isMember ? (membersMapQuery.data?.[c.member_id as string]?.full_name || c.member_id as string) : (c.visitor_name || "");
      const phone = isMember ? "" : (c.visitor_phone || "");
      const tipo = isMember ? "Membro" : "Visitante";
      return [name, tipo, formatDateTime(c.checked_in_at), event?.title || selectedEventId, phone];
    });
    exportCSV(["Nome", "Tipo", "Horário", "Evento", "Telefone"], rows, `presenca-${selectedEventId}`);
  };

  const sortedCheckins = useMemo(() => {
    const rows = checkinsQuery.data || [];
    return [...rows].sort((a, b) => {
      const aDate = new Date(a.checked_in_at).getTime();
      const bDate = new Date(b.checked_in_at).getTime();
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [checkinsQuery.data, sortOrder]);

  const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
  const filteredMembersCheckins = useMemo(() => {
    const q = presentSearchQuery.trim().toLowerCase();
    const qd = onlyDigits(presentSearchQuery);
    return sortedCheckins.filter(c => !!c.member_id).filter(c => {
      const m = c.member_id ? membersMapQuery.data?.[c.member_id] : undefined;
      const name = (m?.full_name || "").toLowerCase();
      const phoneDigits = onlyDigits(m?.phone || "");
      if (!q && !qd) return true;
      return (q && name.includes(q)) || (qd && phoneDigits.includes(qd));
    });
  }, [sortedCheckins, membersMapQuery.data, presentSearchQuery]);

  const filteredVisitorsCheckins = useMemo(() => {
    const q = presentSearchQuery.trim().toLowerCase();
    const qd = onlyDigits(presentSearchQuery);
    return sortedCheckins.filter(c => !c.member_id).filter(c => {
      const name = (c.visitor_name || "").toLowerCase();
      const phoneDigits = onlyDigits(c.visitor_phone || "");
      if (!q && !qd) return true;
      return (q && name.includes(q)) || (qd && phoneDigits.includes(qd));
    });
  }, [sortedCheckins, presentSearchQuery]);

  if (roleQuery.data && roleQuery.data.role === "membro") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
          </CardHeader>
          <CardContent>
            Apenas administradores e líderes podem acessar o Check-in.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
          <p className="text-muted-foreground">Registre presença em eventos da igreja</p>
        </div>
      <div className="flex gap-3 items-center">
          <Input placeholder="Buscar evento" value={eventSearchQuery} onChange={(e) => setEventSearchQuery(e.target.value)} className="w-[220px]" />
          <Select value={selectedEventId ?? undefined} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {((eventsQuery.data || []).filter(ev => ev.title.toLowerCase().includes(eventSearchQuery.toLowerCase()))).map(ev => (
                <SelectItem key={ev.id} value={ev.id}>{ev.title} — {new Date(ev.event_date).toLocaleDateString("pt-BR")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPresence} disabled={!selectedEventId}>Exportar presença (CSV)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedEventId ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrSrc} alt="QR Code" className="rounded" />
                <div className="flex gap-2">
                  <Button onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copiar link</Button>
                  <Button variant="outline" onClick={downloadQR}><Download className="h-4 w-4 mr-2" />Baixar QR</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Selecione um evento para gerar o QR Code</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-in manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Nome, telefone, membro/visitante" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-2 max-h-52 overflow-auto">
              {searchResults.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{r.type === "member" ? "Membro" : "Visitante"}</Badge>
                    <div className="font-medium">{r.name}</div>
                    {r.phone && (<div className="text-sm text-muted-foreground">{maskPhone(r.phone)}</div>)}
                  </div>
                  <Button size="sm" onClick={() => handleManualSelect(r)}>Registrar</Button>
                </div>
              ))}
              {searchResults.length === 0 && <div className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres</div>}
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" /> Registrar Visitante</div>
              <Input placeholder="Nome" value={newVisitorName} onChange={(e) => setNewVisitorName(e.target.value)} />
              <Input placeholder="Telefone" value={newVisitorPhone} onChange={(e) => setNewVisitorPhone(maskPhone(e.target.value))} />
              <Input placeholder="Observações (opcional)" value={newVisitorNotes} onChange={(e) => setNewVisitorNotes(e.target.value)} />
              <Button onClick={registerNewVisitor} disabled={!selectedEventId}>Salvar e marcar presença</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Presentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar presentes (nome ou telefone)" value={presentSearchQuery} onChange={(e) => setPresentSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredMembersCheckins.length + filteredVisitorsCheckins.length} {(filteredMembersCheckins.length + filteredVisitorsCheckins.length) === 1 ? 'presença' : 'presenças'}
            </div>
            <div>
              <div className="font-semibold mb-2">Membros</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {filteredMembersCheckins.map((c) => {
                  const m = c.member_id ? membersMapQuery.data?.[c.member_id] : undefined;
                  return (
                    <div key={c.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{m?.full_name || c.member_id}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(c.checked_in_at)}</div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Remover" size="icon" variant="ghost" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeCheckin(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover</TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Visitantes</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {filteredVisitorsCheckins.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{c.visitor_name}</div>
                      <div className="text-xs text-muted-foreground">{maskPhone(c.visitor_phone || "")} • {formatDateTime(c.checked_in_at)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Remover" size="icon" variant="ghost" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeCheckin(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
