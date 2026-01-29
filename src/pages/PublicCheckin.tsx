import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function onlyDigits(v: string) { return (v || "").replace(/\D/g, ""); }
function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function rpcWithFallback(fn: string, args: Record<string, unknown>) {
  const res = await supabase.rpc(fn, args, { schema: "public" });
  if (!res.error) return null;
  const m = String(res.error.message || "");
  if (m.includes("schema cache") || m.includes("Could not find the function") || m.includes("PGRST202") || m.includes("Not Found")) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
        body: JSON.stringify(args),
      });
      if (r.ok) return null;
      const j = await r.json().catch(() => ({}));
      return { message: String(j?.message || "Erro") } as { message: string };
    } catch {
      return { message: "Erro de conexão" } as { message: string };
    }
  }
  return res.error as { message: string } | null;
}

export default function PublicCheckin() {
  const { event_id } = useParams();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [church, setChurch] = useState<Tables<'churches'> | null>(null);
  const [eventLoadFailed, setEventLoadFailed] = useState(false);
  const [memberPhone, setMemberPhone] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [loadingMember, setLoadingMember] = useState(false);
  const [loadingVisitor, setLoadingVisitor] = useState(false);
  const [feedback, setFeedback] = useState<"" | "success" | "error">("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mode, setMode] = useState<"member" | "visitor">("visitor");

  useEffect(() => {
    const run = async () => {
      if (!event_id) return;
      try {
        const { data: ev } = await supabase
          .from("events")
          .select("id,title,event_date,location,church_id")
          .eq("id", event_id as string)
          .single();
        const eventRow = (ev || null) as Tables<'events'> | null;
        setEvent(eventRow);
        if (eventRow) {
          const { data: ch } = await supabase
            .from("churches")
            .select("id,name,website")
            .eq("id", eventRow.church_id)
            .single();
          setChurch((ch || null) as Tables<'churches'> | null);
        } else {
          setEventLoadFailed(true);
        }
      } catch {
        setEventLoadFailed(true);
      }
    };
    run();
  }, [event_id]);

  const headerContext = useMemo(() => {
    if (!event) return { line1: "", line2: "" };
    const d = new Date(event.event_date);
    const weekday = capitalize(format(d, "EEEE", { locale: ptBR }));
    const time = format(d, "HH'h'", { locale: ptBR });
    const line1 = `${event.title} – ${weekday} | ${time}`;
    const line2 = church?.name || "";
    return { line1, line2 };
  }, [event, church]);

  const websiteUrl = church?.website || "/site-modelo";

  const registerPresenceMember = async () => {
    const id = event?.id || (event_id as string);
    if (!id) return;
    const raw = onlyDigits(memberPhone);
    if (!raw) { setErrorMessage("Informe seu telefone"); setFeedback("error"); return; }
    setLoadingMember(true);
    setErrorMessage("");
    try {
      const error = await rpcWithFallback("public_checkin_member", { p_event_id: id, p_phone: raw });
      if (error) {
        const msg = String(error.message || "");
        if (msg.includes("member_not_found")) {
          setErrorMessage("Não encontramos seu cadastro. Cadastre-se como visitante.");
        } else if (msg.includes("invalid_phone")) {
          setErrorMessage("Telefone inválido");
        } else if (msg.includes("event_not_found")) {
          setErrorMessage("Evento não encontrado");
        } else {
          setErrorMessage("Erro ao confirmar presença");
        }
        setFeedback("error");
      } else {
        setFeedback("success");
      }
    } catch (e) {
      setFeedback("error");
      setErrorMessage("Erro ao confirmar presença");
    } finally {
      setLoadingMember(false);
    }
  };

  const registerPresenceVisitor = async () => {
    const id = event?.id || (event_id as string);
    if (!id) return;
    const name = visitorName.trim();
    const phoneDigits = onlyDigits(visitorPhone);
    if (!name || !phoneDigits) { setFeedback("error"); setErrorMessage("Informe nome e telefone"); return; }
    setLoadingVisitor(true);
    setErrorMessage("");
    try {
      let error = await rpcWithFallback("public_checkin_visitor", { p_event_id: id, p_full_name: name, p_phone: phoneDigits });
      if (error) {
        const msg = String(error.message || "");
        if (msg.includes("invalid_phone")) {
          setErrorMessage("Telefone inválido");
          setFeedback("error");
        } else if (msg.includes("event_not_found")) {
          setErrorMessage("Evento não encontrado");
          setFeedback("error");
        } else {
          error = await rpcWithFallback("public_checkin_visitor_members", { p_event_id: id, p_full_name: name, p_phone: phoneDigits });
          if (error) {
            const m2 = String(error.message || "");
            if (m2.includes("PGRST202") || m2.includes("Not Found") || m2.includes("schema cache")) {
              setErrorMessage("Serviço indisponível no momento. Tente novamente em alguns segundos.");
            } else if (m2.includes("invalid_phone")) {
              setErrorMessage("Telefone inválido");
            } else if (m2.includes("event_not_found")) {
              setErrorMessage("Evento não encontrado");
            } else {
              setErrorMessage("Erro ao confirmar presença");
            }
            setFeedback("error");
          } else {
            setFeedback("success");
          }
        }
      } else {
        setFeedback("success");
      }
    } catch (e) {
      setFeedback("error");
      const m = e instanceof Error ? e.message : "";
      setErrorMessage(m || "Erro ao confirmar presença");
    } finally {
      setLoadingVisitor(false);
    }
  };

  const showHeaderLine1 = headerContext.line1 || "Check-in do evento";
  const showHeaderLine2 = headerContext.line2 || "";

  if (feedback === "success") {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center gap-3 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 56 56" aria-label="GraceHub" className="h-8 w-8 rounded">
            <defs>
              <linearGradient id="ghGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#0EA5E9" /></linearGradient>
            </defs>
            <rect width="56" height="56" rx="14" fill="url(#ghGrad)" />
            <rect x="26" y="12" width="4" height="32" rx="2" fill="#ffffff" />
            <rect x="12" y="26" width="32" height="4" rx="2" fill="#ffffff" />
          </svg>
          <div>
            <div className="text-xs text-muted-foreground">Você está registrando presença em:</div>
            <div className="text-sm font-semibold">{showHeaderLine1}</div>
            <div className="text-xs text-muted-foreground">{showHeaderLine2}</div>
          </div>
        </header>

        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-2xl font-bold">✅ Presença confirmada!</div>
            <div className="text-sm text-muted-foreground mt-2">Que bom ter você conosco hoje 🙌</div>
            <Button asChild variant="outline" className="w-full mt-6">
              <Link to={websiteUrl} target="_blank" rel="noopener noreferrer">Conhecer a igreja</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col gap-4">
      <header className="flex items-center gap-3 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 56 56" aria-label="GraceHub" className="h-8 w-8 rounded">
          <defs>
            <linearGradient id="ghGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#0EA5E9" /></linearGradient>
          </defs>
          <rect width="56" height="56" rx="14" fill="url(#ghGrad)" />
          <rect x="26" y="12" width="4" height="32" rx="2" fill="#ffffff" />
          <rect x="12" y="26" width="32" height="4" rx="2" fill="#ffffff" />
        </svg>
        <div>
          <div className="text-xs text-muted-foreground">Você está registrando presença em:</div>
          <div className="text-sm font-semibold">{showHeaderLine1}</div>
          <div className="text-xs text-muted-foreground">{showHeaderLine2}</div>
        </div>
      </header>

      {eventLoadFailed && (
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-sm">Evento não encontrado ou indisponível</div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="text-xl font-bold">📋 Registro de Presença</div>
        <div className="text-sm text-muted-foreground">Escolha uma opção abaixo</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={mode === "member" ? "default" : "outline"}
          className="w-full"
          onClick={() => { setMode("member"); setFeedback(""); setErrorMessage(""); }}
        >
          Sou Membro
        </Button>
        <Button
          variant={mode === "visitor" ? "default" : "outline"}
          className="w-full"
          onClick={() => { setMode("visitor"); setFeedback(""); setErrorMessage(""); }}
        >
          Sou Visitante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mode === "member" ? "Sou membro" : "Sou visitante"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === "member" ? (
            <>
              <Input placeholder="Telefone" value={memberPhone} onChange={(e) => setMemberPhone(maskPhone(e.target.value))} />
              <Button className="w-full" onClick={registerPresenceMember} disabled={loadingMember || eventLoadFailed || !event?.id}>Confirmar presença</Button>
            </>
          ) : (
            <>
              <Input placeholder="Nome" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
              <Input placeholder="Telefone" value={visitorPhone} onChange={(e) => setVisitorPhone(maskPhone(e.target.value))} />
              <Button className="w-full" onClick={registerPresenceVisitor} disabled={loadingVisitor || eventLoadFailed || !event?.id}>Confirmar presença</Button>
            </>
          )}
          {feedback === "error" && errorMessage && (
            <div className="text-xs text-red-600">{errorMessage}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
