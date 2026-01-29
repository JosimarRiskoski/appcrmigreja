import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Embedded from "@/templates/modelo site/src/Embedded";
import "@/templates/modelo site/src/index.css";
import { useChurchId } from "@/hooks/useChurchId";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getChurchLogo } from "@/lib/logo";

const SiteBuilder = () => {
  const [siteTitle, setSiteTitle] = useState("Igreja Vida Nova");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([
    { image: new URL("../templates/modelo site/src/assets/hero-1.jpg", import.meta.url).href, title: "Bem-vindo à Igreja Vida Nova", subtitle: "Um lugar de fé, esperança e amor", cta: "Conheça Nossa Igreja" },
    { image: new URL("../templates/modelo site/src/assets/hero-2.jpg", import.meta.url).href, title: "Você é Importante Para Nós", subtitle: "Aqui sua família encontra acolhimento e comunhão", cta: "Faça Parte" },
    { image: new URL("../templates/modelo site/src/assets/hero-3.jpg", import.meta.url).href, title: "Cultos e Eventos", subtitle: "Momentos de adoração e celebração da fé", cta: "Ver Programação" },
    { image: new URL("../templates/modelo site/src/assets/hero-4.jpg", import.meta.url).href, title: "Batismo e Renovação", subtitle: "Um novo começo através da fé em Cristo", cta: "Saiba Mais" },
    { image: new URL("../templates/modelo site/src/assets/hero-5.jpg", import.meta.url).href, title: "Servindo a Comunidade", subtitle: "Juntos fazemos a diferença na vida das pessoas", cta: "Seja Voluntário" },
  ]);

  const updateSlide = (field: "title" | "subtitle" | "cta", value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], [field]: value };
      return next;
    });
  };

  const updateSlideImage = (value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], image: value };
      return next;
    });
  };

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

  const updateNavLink = (index: number, field: "label" | "href", value: string) => {
    setNavLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addNavLink = () => setNavLinks((prev) => [...prev, { href: "#novo", label: "Novo" }]);
  const removeNavLink = (index: number) => setNavLinks((prev) => prev.filter((_, i) => i !== index));

  const [sections, setSections] = useState({
    transmissoes: true,
    agenda: true,
    doacoes: true,
    galeria: true,
    downloadApp: true,
    sobre: true,
  });

  const toggleSection = (key: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const [primaryH, setPrimaryH] = useState(24);
  const [primaryS, setPrimaryS] = useState(95);
  const [primaryL, setPrimaryL] = useState(53);
  const [primaryHex, setPrimaryHex] = useState("#f97316");
  const previewRef = useRef<HTMLDivElement>(null);
  const autosaveTimer = useRef<number | null>(null);
  const initializedRef = useRef(false);

  type StatIcon = "users" | "heart" | "book";
  type CausaIcon = "users" | "book" | "home";
  type AppIcon = "bell" | "calendar" | "book";
  type Content = {
    sobre: {
      title: string;
      paragraphs: string[];
      stats: { icon: StatIcon; value: string; label: string }[];
    };
    doacoes: {
      title: string;
      subtitle: string;
      ctaText: string;
      pixKey: string;
      bankInfo: { banco: string; agencia: string; conta: string; cnpj: string };
      causas: { icon?: CausaIcon; titulo: string; descricao: string }[];
    };
    galeria?: { fotos: { src: string; alt: string }[] };
    transmissoes?: { featuredId?: string; videos: { id: string; title: string; description: string; duration: string }[] };
    agenda?: { eventos: { data: string; mes: string; titulo: string; horario: string; local: string; destaque: boolean }[] };
    downloadApp?: { title?: string; description?: string; recursos: { icon: AppIcon; texto: string }[] };
    footer?: { contato: { endereco: string; telefone: string; email: string }; horarios: { dia: string; hora: string }[] };
  };

  const [content, setContent] = useState<Content>({
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
    galeria: { fotos: [] },
    transmissoes: {
      featuredId: "dQw4w9WgXcQ",
      videos: [
        { id: "dQw4w9WgXcQ", title: "Culto de Adoração | Domingo", description: "Mensagem especial sobre fé e esperança", duration: "1:30:00" },
        { id: "dQw4w9WgXcQ", title: "Estudo Bíblico | Quarta", description: "Série sobre os Salmos", duration: "45:00" },
        { id: "dQw4w9WgXcQ", title: "Louvor e Adoração", description: "Momentos de louvor com nossa equipe", duration: "25:00" },
      ],
    },
    downloadApp: {
      title: "Baixe nosso app e fique conectado!",
      description: "Tenha acesso a todas as novidades, eventos, transmissões ao vivo e muito mais diretamente no seu celular.",
      recursos: [
        { icon: "bell", texto: "Notificações de cultos e eventos" },
        { icon: "calendar", texto: "Agenda completa da igreja" },
        { icon: "book", texto: "Devocional diário" },
      ],
    },
    footer: {
      contato: { endereco: "Rua das Flores, 123\nCentro - São Paulo, SP\nCEP: 01234-567", telefone: "(11) 9999-9999", email: "contato@igrejavidanova.com.br" },
      horarios: [
        { dia: "Domingo", hora: "10h e 18h" },
        { dia: "Quarta-feira", hora: "19h30" },
        { dia: "Sexta-feira", hora: "20h (Jovens)" },
      ],
    },
  });

  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };

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
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const applyPrimary = () => {
    const hsl = `${primaryH} ${primaryS}% ${primaryL}%`;
    const hoverL = Math.max(0, Math.min(100, primaryL - 10));
    const hover = `${primaryH} ${primaryS}% ${hoverL}%`;
    const el = previewRef.current;
    if (el) {
      el.style.setProperty("--primary", hsl);
      el.style.setProperty("--primary-hover", hover);
    }
    setPrimaryHex(hslToHex(primaryH, primaryS, primaryL));
  };

  const { data: churchId } = useChurchId();

  const eventsQuery = useQuery<Array<{ id: string; title: string; event_date: string; end_date: string | null; location: string | null; description: string | null }>>({
    queryKey: ["agendaEventsSitePreview", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,event_date,end_date,location,description")
        .eq("church_id", churchId as string)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      return (data || []) as Array<{ id: string; title: string; event_date: string; end_date: string | null; location: string | null; description: string | null }>;
    },
  });

  const logoQuery = useQuery<string | null>({
    queryKey: ["sitebuilderLogo", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      return await getChurchLogo(churchId as string);
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const saveConfig = async (silent?: boolean) => {
    try {
      const payload: Json = {
        siteTitle,
        slides,
        navLinks,
        sections,
        theme: { primaryH, primaryS, primaryL, primaryHex },
        content,
      };
      if (churchId) {
        localStorage.setItem(`site_config:${churchId}`, JSON.stringify(payload));
        const db = supabase as SupabaseClient<Database>;
        await db.from("site_settings").upsert({ church_id: churchId, data: payload, updated_at: new Date().toISOString() });
      } else {
        localStorage.setItem(`site_config:local`, JSON.stringify(payload));
      }
      if (!silent) toast({ title: "Configurações salvas", description: "As alterações foram persistidas." });
    } catch (e) {
      if (!silent) toast({ title: "Falha ao salvar", description: (e as { message?: string })?.message || "Tente novamente." });
    }
  };

  type SitePayload = Partial<{
    siteTitle: string;
    slides: typeof slides;
    navLinks: typeof navLinks;
    sections: typeof sections;
    theme: { primaryHex: string; primaryH?: number; primaryS?: number; primaryL?: number };
    content: typeof content;
  }>;

  const loadConfig = async () => {
    try {
      if (churchId) {
        const db = supabase as SupabaseClient<Database>;
        const { data } = await db.from("site_settings").select("data").eq("church_id", churchId).maybeSingle();
        const payload = (data as { data?: SitePayload })?.data;
        if (payload) {
          setSiteTitle(payload.siteTitle ?? siteTitle);
          setSlides(Array.isArray(payload.slides) ? payload.slides : slides);
          setNavLinks(Array.isArray(payload.navLinks) ? payload.navLinks : navLinks);
          setSections(payload.sections ?? sections);
          if (payload.theme?.primaryHex) {
            const { h, s, l } = hexToHsl(payload.theme.primaryHex as string);
            setPrimaryHex(payload.theme.primaryHex as string);
            setPrimaryH(h);
            setPrimaryS(s);
            setPrimaryL(l);
            const el = previewRef.current;
            if (el) {
              const hoverL = Math.max(0, Math.min(100, l - 10));
              el.style.setProperty("--primary", `${h} ${s}% ${l}%`);
              el.style.setProperty("--primary-hover", `${h} ${s}% ${hoverL}%`);
            }
          }
          setContent(payload.content ?? content);
          initializedRef.current = true;
          return;
        }
      }
      const local = localStorage.getItem(churchId ? `site_config:${churchId}` : `site_config:local`);
      if (local) {
        const payload = JSON.parse(local) as SitePayload;
        setSiteTitle(payload.siteTitle ?? siteTitle);
        setSlides(Array.isArray(payload.slides) ? payload.slides : slides);
        setNavLinks(Array.isArray(payload.navLinks) ? payload.navLinks : navLinks);
        setSections(payload.sections ?? sections);
        if (payload.theme?.primaryHex) {
          const { h, s, l } = hexToHsl(payload.theme.primaryHex as string);
          setPrimaryHex(payload.theme.primaryHex as string);
          setPrimaryH(h);
          setPrimaryS(s);
          setPrimaryL(l);
          const el = previewRef.current;
          if (el) {
            const hoverL = Math.max(0, Math.min(100, l - 10));
            el.style.setProperty("--primary", `${h} ${s}% ${l}%`);
            el.style.setProperty("--primary-hover", `${h} ${s}% ${hoverL}%`);
          }
        }
        setContent(payload.content ?? content);
        initializedRef.current = true;
      } else {
        applyPrimary();
        initializedRef.current = true;
      }
    } catch (e) {
      toast({ title: "Falha ao carregar", description: (e as { message?: string })?.message || "Tente novamente." });
    }
  };

  useEffect(() => {
    initializedRef.current = false;
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchId]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    setSaving("saving");
    autosaveTimer.current = window.setTimeout(async () => {
      await saveConfig(true);
      setSaving("saved");
      window.setTimeout(() => setSaving("idle"), 1200);
    }, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteTitle, slides, navLinks, sections, primaryH, primaryS, primaryL, primaryHex, content]);

  

  

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Builder</h1>
          <p className="text-muted-foreground">Edite o site diretamente abaixo</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-muted-foreground">
            {saving === "saving" ? "Salvando..." : saving === "saved" ? "Alterações salvas" : "Aguardando alterações"}
          </div>
          <Button disabled={saving === "saving"} onClick={async () => { setSaving("saving"); await saveConfig(); setSaving("saved"); setTimeout(() => setSaving("idle"), 1200); }}>
            {saving === "saving" ? "Salvando..." : "Salvar agora"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-2 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="geral">
              <AccordionTrigger>Informações básicas</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Título do Site</label>
                  <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="hero">
              <AccordionTrigger>Hero (banner)</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Slide atual</label>
                  <Input type="number" min={0} max={slides.length - 1} value={currentIndex} onChange={(e) => setCurrentIndex(Number(e.target.value))} />
                  <div className="mt-2 text-xs text-muted-foreground">Índice de 0 a {slides.length - 1}</div>
                  <label className="text-sm font-medium">Título</label>
                  <Input value={slides[currentIndex].title} onChange={(e) => updateSlide("title", e.target.value)} />
                  <label className="text-sm font-medium">Subtítulo</label>
                  <Input value={slides[currentIndex].subtitle} onChange={(e) => updateSlide("subtitle", e.target.value)} />
                  <label className="text-sm font-medium">Texto do botão</label>
                  <Input value={slides[currentIndex].cta} onChange={(e) => updateSlide("cta", e.target.value)} />
                  <label className="text-sm font-medium">Imagem do banner (URL)</label>
                  <Input value={slides[currentIndex].image} onChange={(e) => updateSlideImage(e.target.value)} />
                  <div className="mt-2 text-xs text-muted-foreground">Você pode colar a URL de uma imagem ou enviar um arquivo</div>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = () => updateSlideImage(String(reader.result)); reader.readAsDataURL(f); } }} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="menu">
              <AccordionTrigger>Menu</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {navLinks.map((link, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <Input placeholder="Label" value={link.label} onChange={(e) => updateNavLink(i, "label", e.target.value)} />
                      <Input placeholder="Href" value={link.href} onChange={(e) => updateNavLink(i, "href", e.target.value)} />
                      <div className="col-span-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => removeNavLink(i)}>Remover</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <Button variant="secondary" size="sm" onClick={addNavLink}>Adicionar Link</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tema">
              <AccordionTrigger>Cor Primária</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value={primaryHex} onChange={(e) => { const { h, s, l } = hexToHsl(e.target.value); setPrimaryHex(e.target.value); setPrimaryH(h); setPrimaryS(s); setPrimaryL(l); applyPrimary(); }} />
                  <Input value={primaryHex} onChange={(e) => { const v = e.target.value; if (/^#?[0-9a-fA-F]{6}$/.test(v)) { const hex = v.startsWith('#') ? v : `#${v}`; const { h, s, l } = hexToHsl(hex); setPrimaryHex(hex); setPrimaryH(h); setPrimaryS(s); setPrimaryL(l); applyPrimary(); } }} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="secoes">
              <AccordionTrigger>Seções</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.transmissoes} onCheckedChange={() => toggleSection("transmissoes")} /> Transmissões</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.agenda} onCheckedChange={() => toggleSection("agenda")} /> Agenda</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.doacoes} onCheckedChange={() => toggleSection("doacoes")} /> Doações</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.galeria} onCheckedChange={() => toggleSection("galeria")} /> Galeria</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.downloadApp} onCheckedChange={() => toggleSection("downloadApp")} /> App</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sections.sobre} onCheckedChange={() => toggleSection("sobre")} /> Sobre</label>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sobre">
              <AccordionTrigger>Sobre</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <Input value={content.sobre.title} onChange={(e) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, title: e.target.value } }))} />
                  <Input value={content.sobre.paragraphs[0]} onChange={(e) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, paragraphs: [e.target.value, prev.sobre.paragraphs[1]] } }))} />
                  <Input value={content.sobre.paragraphs[1]} onChange={(e) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, paragraphs: [prev.sobre.paragraphs[0], e.target.value] } }))} />
                  <div className="space-y-2 mt-2">
                    {content.sobre.stats.map((s, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 items-center">
                        <Select value={s.icon} onValueChange={(val) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, stats: prev.sobre.stats.map((it, idx) => idx === i ? { ...it, icon: val as "users" | "heart" | "book" } : it) } }))}>
                          <SelectTrigger><SelectValue placeholder="Ícone" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Usuários</SelectItem>
                            <SelectItem value="heart">Coração</SelectItem>
                            <SelectItem value="book">Livro</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Valor" value={s.value} onChange={(e) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, stats: prev.sobre.stats.map((it, idx) => idx === i ? { ...it, value: e.target.value } : it) } }))} />
                        <Input placeholder="Rótulo" value={s.label} onChange={(e) => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, stats: prev.sobre.stats.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it) } }))} />
                        <div className="col-span-3 flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, stats: prev.sobre.stats.filter((_, idx) => idx !== i) } }))}>Remover</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, sobre: { ...prev.sobre, stats: [...prev.sobre.stats, { icon: "users", value: "0", label: "Nova estatística" }] } }))}>Adicionar Estatística</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="doacoes">
              <AccordionTrigger>Doações</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <Input value={content.doacoes.title} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, title: e.target.value } }))} />
                  <Input value={content.doacoes.subtitle} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, subtitle: e.target.value } }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={content.doacoes.pixKey} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, pixKey: e.target.value } }))} />
                    <Input value={content.doacoes.ctaText} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, ctaText: e.target.value } }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={content.doacoes.bankInfo.banco} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, bankInfo: { ...prev.doacoes.bankInfo, banco: e.target.value } } }))} />
                    <Input value={content.doacoes.bankInfo.agencia} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, bankInfo: { ...prev.doacoes.bankInfo, agencia: e.target.value } } }))} />
                    <Input value={content.doacoes.bankInfo.conta} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, bankInfo: { ...prev.doacoes.bankInfo, conta: e.target.value } } }))} />
                    <Input value={content.doacoes.bankInfo.cnpj} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, bankInfo: { ...prev.doacoes.bankInfo, cnpj: e.target.value } } }))} />
                  </div>
                  <div className="space-y-2 mt-2">
                    {content.doacoes.causas.map((c, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 items-center">
                        <Select value={c.icon || "users"} onValueChange={(val) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, causas: prev.doacoes.causas.map((it, idx) => idx === i ? { ...it, icon: val as "users" | "book" | "home" } : it) } }))}>
                          <SelectTrigger><SelectValue placeholder="Ícone" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Pessoas</SelectItem>
                            <SelectItem value="book">Livro</SelectItem>
                            <SelectItem value="home">Casa</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Título" value={c.titulo} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, causas: prev.doacoes.causas.map((it, idx) => idx === i ? { ...it, titulo: e.target.value } : it) } }))} />
                        <Input placeholder="Descrição" value={c.descricao} onChange={(e) => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, causas: prev.doacoes.causas.map((it, idx) => idx === i ? { ...it, descricao: e.target.value } : it) } }))} />
                        <div className="col-span-3 flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, causas: prev.doacoes.causas.filter((_, idx) => idx !== i) } }))}>Remover</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, doacoes: { ...prev.doacoes, causas: [...prev.doacoes.causas, { icon: "users", titulo: "Nova causa", descricao: "Descreva a causa" }] } }))}>Adicionar Causa</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="transmissoes">
              <AccordionTrigger>Transmissões</AccordionTrigger>
              <AccordionContent>
                <Input placeholder="ID do vídeo em destaque (YouTube)" value={content.transmissoes?.featuredId || ""} onChange={(e) => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), featuredId: e.target.value } }))} />
                <div className="space-y-2 mt-2">
                  {(content.transmissoes?.videos || []).map((v, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <Input placeholder="YouTube ID" value={v.id} onChange={(e) => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: (prev.transmissoes?.videos || []).map((it, idx) => idx === i ? { ...it, id: e.target.value } : it) } }))} />
                      <Input placeholder="Título" value={v.title} onChange={(e) => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: (prev.transmissoes?.videos || []).map((it, idx) => idx === i ? { ...it, title: e.target.value } : it) } }))} />
                      <Input placeholder="Descrição" value={v.description} onChange={(e) => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: (prev.transmissoes?.videos || []).map((it, idx) => idx === i ? { ...it, description: e.target.value } : it) } }))} />
                      <Input placeholder="Duração" value={v.duration} onChange={(e) => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: (prev.transmissoes?.videos || []).map((it, idx) => idx === i ? { ...it, duration: e.target.value } : it) } }))} />
                      <div className="col-span-4 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: (prev.transmissoes?.videos || []).filter((_, idx) => idx !== i) } }))}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, transmissoes: { ...(prev.transmissoes || { videos: [] }), videos: [ ...(prev.transmissoes?.videos || []), { id: "", title: "Novo vídeo", description: "", duration: "" } ] } }))}>Adicionar Vídeo</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="galeria">
              <AccordionTrigger>Galeria</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {(content.galeria?.fotos || []).map((f, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <Input placeholder="Imagem (URL)" value={f.src} onChange={(e) => setContent((prev) => ({ ...prev, galeria: { fotos: (prev.galeria?.fotos || []).map((it, idx) => idx === i ? { ...it, src: e.target.value } : it) } }))} />
                      <Input placeholder="Alt" value={f.alt} onChange={(e) => setContent((prev) => ({ ...prev, galeria: { fotos: (prev.galeria?.fotos || []).map((it, idx) => idx === i ? { ...it, alt: e.target.value } : it) } }))} />
                      <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setContent((prev) => ({ ...prev, galeria: { fotos: (prev.galeria?.fotos || []).map((it, idx) => idx === i ? { ...it, src: String(reader.result) } : it) } })); reader.readAsDataURL(file); } }} />
                      <div className="col-span-3 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, galeria: { fotos: (prev.galeria?.fotos || []).filter((_, idx) => idx !== i) } }))}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, galeria: { fotos: [ ...(prev.galeria?.fotos || []), { src: "", alt: "Nova imagem" } ] } }))}>Adicionar Foto</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="app">
              <AccordionTrigger>App</AccordionTrigger>
              <AccordionContent>
                <Input placeholder="Título" value={content.downloadApp?.title || ""} onChange={(e) => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), title: e.target.value } }))} />
                <Textarea placeholder="Descrição" value={content.downloadApp?.description || ""} onChange={(e) => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), description: e.target.value } }))} />
                <div className="space-y-2 mt-2">
                  {(content.downloadApp?.recursos || []).map((r, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <Select value={r.icon} onValueChange={(val) => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), recursos: (prev.downloadApp?.recursos || []).map((it, idx) => idx === i ? { ...it, icon: val as "bell" | "calendar" | "book" } : it) } }))}>
                        <SelectTrigger><SelectValue placeholder="Ícone" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bell">Sino</SelectItem>
                          <SelectItem value="calendar">Calendário</SelectItem>
                          <SelectItem value="book">Livro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Texto" value={r.texto} onChange={(e) => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), recursos: (prev.downloadApp?.recursos || []).map((it, idx) => idx === i ? { ...it, texto: e.target.value } : it) } }))} />
                      <div className="col-span-3 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), recursos: (prev.downloadApp?.recursos || []).filter((_, idx) => idx !== i) } }))}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, downloadApp: { ...(prev.downloadApp || { recursos: [] }), recursos: [ ...(prev.downloadApp?.recursos || []), { icon: "bell", texto: "Novo recurso" } ] } }))}>Adicionar Recurso</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="footer">
              <AccordionTrigger>Rodapé</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Textarea placeholder="Endereço (linhas)" value={content.footer?.contato.endereco || ""} onChange={(e) => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), contato: { ...(prev.footer?.contato || { endereco: "", telefone: "", email: "" }), endereco: e.target.value } } }))} />
                  <Input placeholder="Telefone" value={content.footer?.contato.telefone || ""} onChange={(e) => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), contato: { ...(prev.footer?.contato || { endereco: "", telefone: "", email: "" }), telefone: e.target.value } } }))} />
                  <Input placeholder="E-mail" value={content.footer?.contato.email || ""} onChange={(e) => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), contato: { ...(prev.footer?.contato || { endereco: "", telefone: "", email: "" }), email: e.target.value } } }))} />
                </div>
                <div className="space-y-2 mt-2">
                  {(content.footer?.horarios || []).map((h, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 items-center">
                      <Input placeholder="Dia" value={h.dia} onChange={(e) => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), horarios: (prev.footer?.horarios || []).map((it, idx) => idx === i ? { ...it, dia: e.target.value } : it) } }))} />
                      <Input placeholder="Horário" value={h.hora} onChange={(e) => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), horarios: (prev.footer?.horarios || []).map((it, idx) => idx === i ? { ...it, hora: e.target.value } : it) } }))} />
                      <div className="col-span-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), horarios: (prev.footer?.horarios || []).filter((_, idx) => idx !== i) } }))}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setContent((prev) => ({ ...prev, footer: { ...(prev.footer || { contato: { endereco: "", telefone: "", email: "" }, horarios: [] }), horarios: [ ...(prev.footer?.horarios || []), { dia: "", hora: "" } ] } }))}>Adicionar Horário</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div
          ref={previewRef}
          className="lg:col-span-2 rounded-lg border overflow-hidden lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
          style={{
            "--primary": `${primaryH} ${primaryS}% ${primaryL}%`,
            "--primary-hover": `${primaryH} ${primaryS}% ${Math.max(0, Math.min(100, primaryL - 10))}%`,
          } as React.CSSProperties}
        >
          <Embedded siteTitle={siteTitle} navLinks={navLinks} slides={slides} sections={sections} content={content} events={toAgendaItems(eventsQuery.data || [])} logoUrl={logoQuery.data || undefined} />
        </div>
      </div>
    </div>
  );
};

export default SiteBuilder;
