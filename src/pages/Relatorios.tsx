import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// removed export format selector
import { Download, FileDown, Loader2, UploadCloud } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ExportFormat = "json" | "csv";
type ReportData = {
  generated_at: string;
  church: Tables<'churches'> | null;
  members: Tables<'members'>[];
  cells: Tables<'cells'>[];
  ministries: Tables<'ministries'>[];
  ministry_members: Tables<'ministry_members'>[];
  events: Tables<'events'>[];
  liturgies: Tables<'liturgies'>[];
  liturgy_order_items: Tables<'liturgy_order_items'>[];
  visitors: Tables<'visitors'>[];
  prayer_requests: Tables<'prayer_requests'>[];
  media_library: Tables<'media_library'>[];
};

export default function Relatorios() {
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const [loading, setLoading] = useState(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importPreview, setImportPreview] = useState<Array<{ full_name: string; email?: string }>>([]);
  const [importSep, setImportSep] = useState<"," | ";">(";");
  const [importing, setImporting] = useState(false);

  const sanitize = (v: unknown) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatBool = (b: boolean | null | undefined) => {
    if (b === null || b === undefined) return "";
    return b ? "Sim" : "Não";
  };

  const exportCSV = (headers: string[], rows: string[][], filename: string, sep: "," | ";" = ";") => {
    const escape = (val: string) => {
      const needsQuote = /["\n]/.test(val) || val.includes(sep);
      const quoted = val.replace(/"/g, '""');
      return needsQuote ? `"${quoted}"` : quoted;
    };
    const headerLine = headers.map(escape).join(sep);
    const dataLines = rows.map(r => r.map(escape).join(sep));
    const content = [`sep=${sep}`, headerLine, ...dataLines].join("\r\n");
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

  const toCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headerSet = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
    const headers = Array.from(headerSet);
    const escape = (val: unknown) => {
      const s = sanitize(val);
      const needsQuote = /[",\n]/.test(s);
      const quoted = s.replace(/"/g, '""');
      return needsQuote ? `"${quoted}"` : quoted;
    };
    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape(r[h])).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchAll = async (): Promise<ReportData | null> => {
    if (!churchId) return null;
    const now = new Date().toISOString();
    try {
      const { data: church } = await supabase
        .from("churches")
        .select("*")
        .eq("id", churchId as string)
        .single();

      const { data: members } = await supabase
        .from("members")
        .select("*")
        .eq("church_id", churchId as string);

      const { data: cells } = await supabase
        .from("cells")
        .select("*")
        .eq("church_id", churchId as string);

      const { data: ministries } = await supabase
        .from("ministries")
        .select("*")
        .eq("church_id", churchId as string);

      const ministryIds = ((ministries || []) as Tables<'ministries'>[]).map((m) => m.id);
      let ministry_members: Tables<'ministry_members'>[] = [];
      if (ministryIds.length > 0) {
        const { data: mm } = await supabase
          .from("ministry_members")
          .select("*")
          .in("ministry_id", ministryIds);
        ministry_members = (mm || []) as Tables<'ministry_members'>[];
      }

      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId as string);

      const { data: liturgies } = await supabase
        .from("liturgies")
        .select("*")
        .eq("church_id", churchId as string);

      const liturgyIds = ((liturgies || []) as Tables<'liturgies'>[]).map((l) => l.id);
      let liturgy_order_items: Tables<'liturgy_order_items'>[] = [];
      if (liturgyIds.length > 0) {
        const { data: loi } = await supabase
          .from("liturgy_order_items")
          .select("*")
          .in("liturgy_id", liturgyIds);
        liturgy_order_items = (loi || []) as Tables<'liturgy_order_items'>[];
      }

      let visitors: Tables<'visitors'>[] = [];
      const ping = await supabase.from("visitors").select("id").limit(1);
      if (!ping.error) {
        const { data } = await supabase
          .from("visitors")
          .select("*")
          .eq("church_id", churchId as string);
        visitors = (data || []) as Tables<'visitors'>[];
      }

      const { data: prayer_requests } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("church_id", churchId as string);

      const { data: media_library } = await supabase
        .from("media_library")
        .select("*")
        .eq("church_id", churchId as string);

      return {
        generated_at: now,
        church: (church || null) as Tables<'churches'> | null,
        members: (members || []) as Tables<'members'>[],
        cells: (cells || []) as Tables<'cells'>[],
        ministries: (ministries || []) as Tables<'ministries'>[],
        ministry_members,
        events: (events || []) as Tables<'events'>[],
        liturgies: (liturgies || []) as Tables<'liturgies'>[],
        liturgy_order_items,
        visitors,
        prayer_requests: (prayer_requests || []) as Tables<'prayer_requests'>[],
        media_library: (media_library || []) as Tables<'media_library'>[],
      };
    } catch {
      return null;
    }
  };

  const handleExportJSON = async () => {
    if (churchLoading || !churchId) return;
    setLoading(true);
    const all = await fetchAll();
    if (all) {
      const name = `relatorio-igreja-${churchId}-${new Date().toISOString().slice(0,10)}`;
      downloadJSON(all, name);
    }
    setLoading(false);
  };

  const handleExportCSV = async (table: string, filename: string) => {
    if (churchLoading || !churchId) return;
    setLoading(true);
    try {
      if (table === "ministry_members") {
        const { data: ministries } = await supabase
          .from("ministries")
          .select("id")
          .eq("church_id", churchId as string);
        const ids = ((ministries || []) as Tables<'ministries'>[]).map((m) => m.id);
        if (ids.length === 0) {
          exportCSV([
            "ID do Membro",
            "ID do Ministério",
            "Entrou em"
          ], [], filename);
        } else {
          const { data } = await supabase
            .from("ministry_members")
            .select("*")
            .in("ministry_id", ids);
          const rows = ((data || []) as Tables<'ministry_members'>[]).map(d => [
            d.member_id,
            d.ministry_id,
            formatDate(d.joined_at as string)
          ]);
          exportCSV([
            "ID do Membro",
            "ID do Ministério",
            "Entrou em"
          ], rows, filename);
        }
      } else if (table === "liturgy_order_items") {
        const { data: lits } = await supabase
          .from("liturgies")
          .select("id")
          .eq("church_id", churchId as string);
        const ids = ((lits || []) as Tables<'liturgies'>[]).map((l) => l.id);
        if (ids.length === 0) {
          exportCSV([
            "ID da Programação",
            "Posição",
            "Título",
            "Duração (min)",
            "Notas"
          ], [], filename);
        } else {
          const { data } = await supabase
            .from("liturgy_order_items")
            .select("*")
            .in("liturgy_id", ids);
          const rows = ((data || []) as Tables<'liturgy_order_items'>[]).map(d => [
            d.liturgy_id,
            String(d.position),
            sanitize(d.title),
            d.duration_minutes != null ? String(d.duration_minutes) : "",
            sanitize(d.notes)
          ]);
          exportCSV([
            "ID da Programação",
            "Posição",
            "Título",
            "Duração (min)",
            "Notas"
          ], rows, filename);
        }
      } else if (table === "visitors") {
        const ping = await supabase.from("visitors").select("id").limit(1);
        if (ping.error) {
          exportCSV([
            "Nome",
            "Telefone",
            "Email",
            "Primeira visita",
            "Tag",
            "Status"
          ], [], filename);
        } else {
          const { data } = await supabase
            .from("visitors")
            .select("*")
            .eq("church_id", churchId as string);
          const rows = ((data || []) as Tables<'visitors'>[]).map(d => [
            sanitize(d.full_name),
            sanitize(d.phone),
            sanitize(d.email),
            formatDate(d.first_visit_date),
            sanitize(d.tag),
            sanitize(d.status)
          ]);
          exportCSV([
            "Nome",
            "Telefone",
            "Email",
            "Primeira visita",
            "Tag",
            "Status"
          ], rows, filename);
        }
      } else if (table === "churches") {
        const { data } = await supabase
          .from("churches")
          .select("*")
          .eq("id", churchId as string);
        const rows = ((data || []) as Tables<'churches'>[]).map(d => [
          sanitize(d.name),
          sanitize(d.city),
          sanitize(d.state),
          sanitize(d.address),
          sanitize(d.phone),
          sanitize(d.email),
          sanitize(d.website)
        ]);
        exportCSV([
          "Nome",
          "Cidade",
          "Estado",
          "Endereço",
          "Telefone",
          "Email",
          "Website"
        ], rows, filename);
      } else {
        const { data } = await supabase
          .from(table)
          .select("*")
          .eq("church_id", churchId as string);
        if (table === "members") {
          const { data: cells } = await supabase
            .from("cells")
            .select("id,name")
            .eq("church_id", churchId as string);
          const cellMap = new Map<string, string>();
          ((cells || []) as Tables<'cells'>[]).forEach(c => { if (c.id) cellMap.set(c.id, c.name); });
          const rows = ((data || []) as Tables<'members'>[]).map(d => [
            sanitize(d.full_name),
            d.status ? String(d.status) : "",
            formatBool(d.baptized as boolean),
            sanitize(d.phone),
            sanitize(d.email),
            formatDate(d.birth_date as string),
            formatDate(d.member_since as string),
            d.cell_id ? (cellMap.get(d.cell_id) || d.cell_id) : "",
            sanitize(d.city),
            sanitize(d.address),
            sanitize(d.notes),
            formatDate(d.created_at as string)
          ]);
          exportCSV([
            "Nome",
            "Status",
            "Batizado",
            "Telefone",
            "Email",
            "Nascimento",
            "Membro desde",
            "Célula",
            "Cidade",
            "Endereço",
            "Observações",
            "Criado em"
          ], rows, filename);
        } else if (table === "cells") {
          const rows = ((data || []) as Tables<'cells'>[]).map(d => [
            sanitize(d.name),
            sanitize(d.status),
            sanitize(d.meeting_day),
            sanitize(d.meeting_time),
            sanitize(d.meeting_location),
            sanitize(d.description)
          ]);
          exportCSV([
            "Nome",
            "Status",
            "Dia",
            "Hora",
            "Local",
            "Descrição"
          ], rows, filename);
        } else if (table === "ministries") {
          const rows = ((data || []) as Tables<'ministries'>[]).map(d => [
            sanitize(d.name),
            sanitize(d.description),
            sanitize(d.color),
            formatDate(d.created_at as string)
          ]);
          exportCSV([
            "Nome",
            "Descrição",
            "Cor",
            "Criado em"
          ], rows, filename);
        } else if (table === "events") {
          const rows = ((data || []) as Tables<'events'>[]).map(d => [
            sanitize(d.title),
            formatDate(d.event_date),
            formatDate(d.end_date as string),
            sanitize(d.location)
          ]);
          exportCSV([
            "Título",
            "Data",
            "Data fim",
            "Local"
          ], rows, filename);
        } else if (table === "liturgies") {
          const rows = ((data || []) as Tables<'liturgies'>[]).map(d => [
            sanitize(d.title),
            formatDate(d.event_date),
            sanitize(d.location),
            sanitize(d.minister),
            sanitize(d.theme),
            sanitize(d.type)
          ]);
          exportCSV([
            "Título",
            "Data",
            "Local",
            "Ministro",
            "Tema",
            "Tipo"
          ], rows, filename);
        } else if (table === "prayer_requests") {
          const rows = ((data || []) as Tables<'prayer_requests'>[]).map(d => [
            sanitize(d.title),
            sanitize(d.status),
            formatBool(d.is_public as boolean),
            sanitize(d.member_id),
            formatDate(d.created_at as string)
          ]);
          exportCSV([
            "Título",
            "Status",
            "Público",
            "ID do Membro",
            "Criado em"
          ], rows, filename);
        } else if (table === "media_library") {
          const rows = ((data || []) as Tables<'media_library'>[]).map(d => [
            sanitize(d.title)
          ]);
          exportCSV([
            "Título"
          ], rows, filename);
        } else {
          const recs = ((data || []) as Record<string, unknown>[]);
          const headerSet = new Set<string>();
          recs.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
          const headers = Array.from(headerSet);
          const rows = recs.map(r => headers.map(h => sanitize((r as Record<string, unknown>)[h])));
          exportCSV(headers, rows, filename);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const detectSep = (text: string): "," | ";" => {
    const firstLine = (text.split(/\r?\n/)[0] || "").trim();
    if (firstLine.startsWith("sep=")) {
      const v = firstLine.slice(4).trim();
      return (v === ";" ? ";" : ",");
    }
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    return semiCount > commaCount ? ";" : ",";
  };

  const parseCSV = (text: string, sep: "," | ";"): { headers: string[]; rows: string[][] } => {
    const lines = text.replace(/^sep=.*\n?/i, "").split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
          } else { cur += ch; }
        } else {
          if (ch === '"') { inQuotes = true; }
          else if (ch === sep) { out.push(cur); cur = ""; }
          else { cur += ch; }
        }
      }
      out.push(cur);
      return out.map(s => s.trim());
    };
    const headers = parseLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
  };

  const formatISODate = (s: string | undefined): string | null => {
    if (!s) return null;
    const t = s.trim();
    if (!t) return null;
    let d = new Date(t);
    if (isNaN(d.getTime())) {
      const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      }
    }
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const normalizeBool = (s: string | undefined): boolean | null => {
    if (s === undefined) return null;
    const v = s.trim().toLowerCase();
    if (v === "sim" || v === "true" || v === "1") return true;
    if (v === "não" || v === "nao" || v === "false" || v === "0") return false;
    return null;
  };

  const downloadMembersTemplate = () => {
    const headers = [
      "full_name","email","phone","birth_date","status","baptized","member_since",
      "cell_name","zip_code","address","address_number","city","notes"
    ];
    const sample = [
      "João da Silva","joao@exemplo.com","(11) 99999-9999","1990-05-12","ativo","Sim","2020-03-01",
      "Célula Alpha","01234-567","Rua das Flores - Jardim","123","São Paulo/SP","Visitante desde 2019"
    ];
    exportCSV(headers, [sample], "modelo-membros", ";");
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const sep = detectSep(text);
    setImportSep(sep);
    const { headers, rows } = parseCSV(text, sep);
    setImportHeaders(headers);
    setImportRows(rows);
    const nameIdx = headers.findIndex(h => h.toLowerCase() === "full_name");
    const emailIdx = headers.findIndex(h => h.toLowerCase() === "email");
    const preview = rows.slice(0, 5).map(r => ({ full_name: r[nameIdx] || "", email: r[emailIdx] || "" }));
    setImportPreview(preview);
  };

  const importMembers = async () => {
    if (!churchId || importRows.length === 0 || importHeaders.length === 0) return;
    setImporting(true);
    try {
      const headerIndex = (name: string) => importHeaders.findIndex(h => h.toLowerCase() === name);
      const idx = {
        full_name: headerIndex("full_name"),
        email: headerIndex("email"),
        phone: headerIndex("phone"),
        birth_date: headerIndex("birth_date"),
        status: headerIndex("status"),
        baptized: headerIndex("baptized"),
        member_since: headerIndex("member_since"),
        cell_id: headerIndex("cell_id"),
        cell_name: headerIndex("cell_name"),
        zip_code: headerIndex("zip_code"),
        address: headerIndex("address"),
        address_number: headerIndex("address_number"),
        city: headerIndex("city"),
        notes: headerIndex("notes"),
      };

      const cellsMap: Record<string, string> = {};
      if (idx.cell_name >= 0) {
        const { data: cells } = await supabase
          .from('cells')
          .select('id, name')
          .eq('church_id', churchId as string);
        (cells || []).forEach((c: { id: string; name: string | null }) => {
          if (c.name) cellsMap[c.name.toLowerCase()] = c.id;
        });
      }

      const rowsData = importRows.map(r => {
        const addressBase = idx.address >= 0 ? (r[idx.address] || "") : "";
        const addressNumber = idx.address_number >= 0 ? (r[idx.address_number] || "") : "";
        const fullAddress = [addressBase || undefined, addressNumber ? `Nº ${addressNumber}` : undefined].filter(Boolean).join(', ');
        const statusRaw = idx.status >= 0 ? (r[idx.status] || "") : "";
        const VALID_STATUS = ["ativo", "inativo", "visitante"] as const;
        const status = (VALID_STATUS.find((s) => s === statusRaw) ?? "ativo");
        const baptizedVal = normalizeBool(idx.baptized >= 0 ? r[idx.baptized] : undefined);
        const cellId = idx.cell_id >= 0 && r[idx.cell_id] ? r[idx.cell_id] : (idx.cell_name >= 0 && r[idx.cell_name] ? cellsMap[(r[idx.cell_name] || "").toLowerCase()] : null);
        return {
          church_id: churchId,
          full_name: (idx.full_name >= 0 ? r[idx.full_name] : "").trim(),
          email: idx.email >= 0 ? (r[idx.email] || null) : null,
          phone: idx.phone >= 0 ? (r[idx.phone] || null) : null,
          birth_date: idx.birth_date >= 0 ? (formatISODate(r[idx.birth_date]) || null) : null,
          status,
          baptized: baptizedVal !== null ? baptizedVal : false,
          member_since: idx.member_since >= 0 ? (formatISODate(r[idx.member_since]) || null) : null,
          cell_id: cellId || null,
          zip_code: idx.zip_code >= 0 ? (r[idx.zip_code] || null) : null,
          address: fullAddress || null,
          city: idx.city >= 0 ? (r[idx.city] || null) : null,
          notes: idx.notes >= 0 ? (r[idx.notes] || null) : null,
        };
      }).filter(m => m.full_name);

      if (rowsData.length === 0) return;
      const { error } = await supabase.from('members').insert(rowsData);
      if (error) throw error;
      setImportHeaders([]);
      setImportRows([]);
      setImportPreview([]);
    } catch (e) {
      console.error('Erro ao importar CSV de membros:', e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Exporte o relatório completo da sua igreja</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleExportCSV("members", `membros-${churchId}`)} disabled={loading || !churchId}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Exportar CSV de Membros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entidades principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExportCSV("churches", `igreja-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Igreja
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("members", `membros-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Membros
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("cells", `celulas-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Células
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("ministries", `ministerios-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Ministérios
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("ministry_members", `ministerios-membros-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Ministério Membros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos e Programação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExportCSV("events", `eventos-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Eventos
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("liturgies", `programacoes-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Programações
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("liturgy_order_items", `programacao-itens-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Itens de Programação
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comunicação e espiritual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExportCSV("visitors", `visitantes-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Visitantes
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("prayer_requests", `oracoes-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Orações
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV("media_library", `midia-${churchId}`)} disabled={loading || !churchId}>
                <Download className="mr-2 h-4 w-4" /> Biblioteca de mídia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar CSV de Membros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={downloadMembersTemplate}>
              <Download className="mr-2 h-4 w-4" /> Baixar modelo CSV
            </Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
              <UploadCloud className="h-4 w-4" />
              <span>Selecionar arquivo CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} />
            </label>
            <Button onClick={importMembers} disabled={importing || !churchId || importRows.length === 0}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Importar membros
            </Button>
          </div>
          {importRows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Detectado separador: <strong>{importSep}</strong> • Linhas: <strong>{importRows.length}</strong>
              {importPreview.length > 0 && (
                <div className="mt-2">
                  <div>Prévia:</div>
                  {importPreview.map((p, i) => (
                    <div key={i} className="truncate">{p.full_name}{p.email ? ` · ${p.email}` : ""}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Campos suportados no CSV: full_name, email, phone, birth_date (yyyy-MM-dd ou dd/MM/yyyy), status (ativo/inativo/visitante), baptized (Sim/Não), member_since (yyyy-MM-dd), cell_name ou cell_id, zip_code, address, address_number, city, notes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
