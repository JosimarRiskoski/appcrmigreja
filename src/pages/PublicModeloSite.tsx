import React, { useEffect, useState, useRef } from "react";
import Embedded from "@/templates/modelo site/src/Embedded";
import "@/templates/modelo site/src/index.css";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { useChurchId } from "@/hooks/useChurchId";
import { useQuery } from "@tanstack/react-query";
import { getChurchLogo } from "@/lib/logo";

const PublicModeloSite = () => {
  const siteRef = useRef<HTMLDivElement>(null);
  const [siteTitle, setSiteTitle] = useState("Igreja Vida Nova");
  const [slides, setSlides] = useState([
    { image: new URL("../templates/modelo site/src/assets/hero-1.jpg", import.meta.url).href, title: "Bem-vindo à Igreja Vida Nova", subtitle: "Um lugar de fé, esperança e amor", cta: "Conheça Nossa Igreja" },
    { image: new URL("../templates/modelo site/src/assets/hero-2.jpg", import.meta.url).href, title: "Você é Importante Para Nós", subtitle: "Aqui sua família encontra acolhimento e comunhão", cta: "Faça Parte" },
    { image: new URL("../templates/modelo site/src/assets/hero-3.jpg", import.meta.url).href, title: "Cultos e Eventos", subtitle: "Momentos de adoração e celebração da fé", cta: "Ver Programação" },
    { image: new URL("../templates/modelo site/src/assets/hero-4.jpg", import.meta.url).href, title: "Batismo e Renovação", subtitle: "Um novo começo através da fé em Cristo", cta: "Saiba Mais" },
    { image: new URL("../templates/modelo site/src/assets/hero-5.jpg", import.meta.url).href, title: "Servindo a Comunidade", subtitle: "Juntos fazemos a diferença na vida das pessoas", cta: "Seja Voluntário" },
  ]);
  const [navLinks, setNavLinks] = useState([
    { href: "#inicio", label: "Início" },
    { href: "#transmissoes", label: "Transmissões" },
    { href: "#agenda", label: "Agenda" },
    { href: "#doacoes", label: "Doações" },
    { href: "#galeria", label: "Galeria" },
    { href: "#app", label: "App" },
    { href: "#sobre", label: "Sobre" },
    { href: "#contato", label: "Contato" },
  ]);
  const [sections, setSections] = useState({
    transmissoes: true,
    agenda: true,
    doacoes: true,
    galeria: true,
    downloadApp: true,
    sobre: true,
  });
  const [content, setContent] = useState({
    sobre: {
      title: "Sobre a Igreja Vida Nova",
      paragraphs: [
        "Fundada há mais de 30 anos, a Igreja Vida Nova nasceu do sonho de criar uma comunidade de fé onde todos pudessem encontrar amor, acolhimento e propósito. Nossa missão é compartilhar o amor de Cristo e transformar vidas através da Palavra de Deus.",
        "Hoje somos uma família com milhares de membros, unidos pelo mesmo propósito: servir a Deus e ao próximo. Convidamos você a fazer parte dessa história!",
      ],
      stats: [
        { icon: "users", value: "5.000+", label: "Membros" },
        { icon: "heart", value: "30+", label: "Anos de História" },
        { icon: "book", value: "50+", label: "Grupos de Estudo" },
      ],
    },
    doacoes: {
      title: "Sua colaboração é muito importante para o avanço do reino.",
      subtitle: "A igreja está empenhada em muitas frentes sociais. Honre o Senhor com generosidade e seja um agente de transformação! Conheça as formas de contribuir:",
      ctaText: "Quero Contribuir",
      pixKey: "igreja@vidanova.com.br",
      bankInfo: { banco: "001 - Banco do Brasil", agencia: "1234-5", conta: "12345-6", cnpj: "00.000.000/0001-00" },
      causas: [
        { icon: "users", titulo: "Ação Social", descricao: "Apoie famílias em situação de vulnerabilidade com cestas básicas e assistência." },
        { icon: "book", titulo: "Missões", descricao: "Contribua para levar a palavra de Deus a comunidades distantes." },
        { icon: "home", titulo: "Infraestrutura", descricao: "Ajude na manutenção e melhorias do nosso templo." },
      ],
    },
  });

  const { data: churchId } = useChurchId();
  const [themeHsl, setThemeHsl] = useState<string | null>(null);
  const hexToHsl = (hex: string) => {
    const parsed = hex.replace("#", "");
    const r = parseInt(parsed.substring(0, 2), 16) / 255;
    const g = parseInt(parsed.substring(2, 4), 16) / 255;
    const b = parseInt(parsed.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0; const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  type SitePayload = Partial<{
    siteTitle: string;
    slides: typeof slides;
    navLinks: typeof navLinks;
    sections: typeof sections;
    theme: { primaryHex?: string };
    content: typeof content;
  }>;

  const [events, setEvents] = useState<Array<{ data: string; mes: string; titulo: string; horario: string; local: string; destaque: boolean }>>([]);
  const toAgendaItems = (rows: Array<{ title: string; event_date: string; end_date: string | null; location: string | null; description: string | null }>) => {
    return rows.map((r, idx) => {
      const start = new Date(r.event_date);
      const end = r.end_date ? new Date(r.end_date) : null;
      const dia = String(start.getDate()).padStart(2, "0");
      const mes = start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
      const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const horario = end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
      const destaque = !!(r.description || "").includes("[FEATURED]");
      return { data: dia, mes, titulo: r.title, horario, local: r.location || "", destaque };
    });
  };

  const logoQuery = useQuery<string | null>({
    queryKey: ["publicLogo", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      return await getChurchLogo(churchId as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const load = async () => {
      const db = supabase as SupabaseClient<Database>;
      if (churchId) {
        const { data } = await db.from("site_settings").select("data").eq("church_id", churchId).maybeSingle();
        const payload = (data as { data?: SitePayload })?.data as SitePayload | undefined;
        if (payload) {
          setSiteTitle((prev) => payload.siteTitle ?? prev);
          setSlides((prev) => Array.isArray(payload.slides) ? payload.slides : prev);
          setNavLinks((prev) => Array.isArray(payload.navLinks) ? payload.navLinks : prev);
          setSections((prev) => payload.sections ?? prev);
          setContent((prev) => payload.content ?? prev);
          if (payload.theme?.primaryHex) {
            const hsl = hexToHsl(payload.theme.primaryHex);
            setThemeHsl(hsl);
            const el = siteRef.current;
            if (el) {
              const parts = hsl.split(" ");
              const l = Math.max(0, Math.min(100, Number(parts[2].replace("%", "")) - 10));
              el.style.setProperty("--primary", hsl);
              el.style.setProperty("--primary-hover", `${parts[0]} ${parts[1]} ${l}%`);
            }
          }
          const { data: dbEvents } = await db
            .from("events")
            .select("title,event_date,end_date,location,description")
            .eq("church_id", churchId)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true });
          setEvents(toAgendaItems((dbEvents || []) as Array<{ title: string; event_date: string; end_date: string | null; location: string | null; description: string | null }>));
          return;
        }
        const localChurch = localStorage.getItem(`site_config:${churchId}`);
        if (localChurch) {
          const p = JSON.parse(localChurch);
          setSiteTitle((prev) => p.siteTitle ?? prev);
          setSlides((prev) => Array.isArray(p.slides) ? p.slides : prev);
          setNavLinks((prev) => Array.isArray(p.navLinks) ? p.navLinks : prev);
          setSections((prev) => p.sections ?? prev);
          setContent((prev) => p.content ?? prev);
          if (p.theme?.primaryHex) {
            const hsl = hexToHsl(p.theme.primaryHex);
            setThemeHsl(hsl);
            const el = siteRef.current;
            if (el) {
              const parts = hsl.split(" ");
              const l = Math.max(0, Math.min(100, Number(parts[2].replace("%", "")) - 10));
              el.style.setProperty("--primary", hsl);
              el.style.setProperty("--primary-hover", `${parts[0]} ${parts[1]} ${l}%`);
            }
          }
          const { data: dbEvents } = await db
            .from("events")
            .select("title,event_date,end_date,location,description")
            .eq("church_id", churchId)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true });
          setEvents(toAgendaItems((dbEvents || []) as Array<{ title: string; event_date: string; end_date: string | null; location: string | null; description: string | null }>));
          return;
        }
      } else {
        const local = localStorage.getItem(`site_config:local`);
        if (local) {
          const p = JSON.parse(local);
          setSiteTitle((prev) => p.siteTitle ?? prev);
          setSlides((prev) => Array.isArray(p.slides) ? p.slides : prev);
          setNavLinks((prev) => Array.isArray(p.navLinks) ? p.navLinks : prev);
          setSections((prev) => p.sections ?? prev);
          setContent((prev) => p.content ?? prev);
          if (p.theme?.primaryHex) {
            const hsl = hexToHsl(p.theme.primaryHex);
            setThemeHsl(hsl);
            const el = siteRef.current;
            if (el) {
              const parts = hsl.split(" ");
              const l = Math.max(0, Math.min(100, Number(parts[2].replace("%", "")) - 10));
              el.style.setProperty("--primary", hsl);
              el.style.setProperty("--primary-hover", `${parts[0]} ${parts[1]} ${l}%`);
            }
          }
        }
      }
    };
    load();
  }, [churchId]);

  return (
    <div
      ref={siteRef}
      className="rounded-lg border overflow-hidden"
      style={themeHsl ? {
        "--primary": themeHsl,
        "--primary-hover": (() => {
          const parts = themeHsl.split(" ");
          const l = Math.max(0, Math.min(100, Number(parts[2].replace("%", "")) - 10));
          return `${parts[0]} ${parts[1]} ${l}%`;
        })(),
      } as React.CSSProperties : undefined}
    >
      <Embedded siteTitle={siteTitle} navLinks={navLinks} slides={slides} sections={sections} content={content} events={events} logoUrl={logoQuery.data || undefined} />
    </div>
  );
};

export default PublicModeloSite;
