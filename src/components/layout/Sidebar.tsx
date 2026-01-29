import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Church,
  Calendar,
  DollarSign,
  Image,
  Heart,
  Globe,
  Settings,
  Cake,
  UserPlus,
  FileText,
  TrendingUp,
  FileBarChart,
  Sparkles,
  Megaphone,
  Wrench,
  UserCog,
  Building,
  ChevronRight,
  Home,
  QrCode,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQueryClient } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
 

type DynamicPage = { label?: string | null; path?: string | null; category?: string | null };
const categoryIconMap: Record<string, React.ElementType> = {
  "Gestão": LayoutDashboard,
  "Pessoas": Users,
  "Eventos": Calendar,
  "Financeiro": DollarSign,
  "Espiritual": Heart,
  "Comunicação": Megaphone,
  "Configurações": Settings,
};

const defaultPages: DynamicPage[] = [
  { label: "Dashboard", path: "/dashboard", category: "Gestão" },
  { label: "Membros", path: "/membros", category: "Pessoas" },
  { label: "Células", path: "/celulas", category: "Pessoas" },
  { label: "Aniversariantes", path: "/aniversariantes", category: "Pessoas" },
  { label: "Visitantes", path: "/visitantes", category: "Pessoas" },
  { label: "Ministérios", path: "/ministerios", category: "Pessoas" },
  { label: "Eventos", path: "/eventos", category: "Eventos" },
  { label: "Culto e Programação", path: "/culto-e-programacao", category: "Eventos" },
  { label: "Check-in", path: "/checkin", category: "Eventos" },
  { label: "Relatórios", path: "/relatorios", category: "Gestão" },
  { label: "Financeiro", path: "/financeiro", category: "Financeiro" },
  { label: "Orações", path: "/oracoes", category: "Espiritual" },
  { label: "Dicas de Leitura", path: "/dicas-leitura", category: "Espiritual" },
  { label: "Mídia", path: "/midia", category: "Comunicação" },
  { label: "Site Builder", path: "/site-builder", category: "Comunicação" },
  { label: "Site Modelo", path: "/site-modelo", category: "Comunicação" },
  { label: "Modelo Site", path: "/modelo-site", category: "Comunicação" },
  { label: "Configurações", path: "/configuracoes", category: "Configurações" },
  { label: "Meu Perfil", path: "/perfil", category: "Configurações" },
  { label: "Usuários & Permissões", path: "/usuarios-permissoes", category: "Configurações" },
];

const getPageLabel = (item: DynamicPage) => {
  const rec = item as unknown as Record<string, unknown>;
  const label = (item.label as string | null)
    ?? (rec["name"] as string | undefined)
    ?? (rec["title"] as string | undefined)
    ?? (rec["key"] as string | undefined)
    ?? (getPageRoute(item) || null);
  return label || "Página";
};

const getPageRoute = (item: DynamicPage): string | null => {
  const rec = item as unknown as Record<string, unknown>;
  const candidates = [
    rec["path"],
    rec["route"],
    rec["url"],
    rec["href"],
    rec["link"],
  ];
  let route = candidates.find((v) => typeof v === "string" && !!v) as string | undefined;
  if (!route && typeof rec["slug"] === "string" && rec["slug"]) {
    route = `/${rec["slug"] as string}`;
  }
  const map: Record<string, string> = {
    "/dashboard": "/dashboard",
    "/members": "/membros",
    "/cells": "/celulas",
    "/birthdays": "/aniversariantes",
    "/visitors": "/visitantes",
    "/ministries": "/ministerios",
    "/events": "/eventos",
    "/worship-schedule": "/culto-e-programacao",
    "/liturgia": "/culto-e-programacao",
    "/checkin": "/checkin",
    "/reports": "/relatorios",
    "/finance": "/financeiro",
    "/prayers": "/oracoes",
    "/reading-tips": "/dicas-leitura",
    "/media": "/midia",
    "/site-builder": "/site-builder",
    "/site-modelo": "/site-modelo",
    "/modelo-site": "/modelo-site",
    "/site-modelo-editavel": "/site-modelo-editavel",
    "/perfil": "/perfil",
    "/users-permissions": "/usuarios-permissoes",
    "/config": "/configuracoes",
  };
  const translated = route ? (map[route] || route) : null;
  return translated || null;
};

const canonicalCategory = (cat?: string | null): string => {
  const k = (cat || "Gestão").toString().toLowerCase();
  const map: Record<string, string> = {
    geral: "Gestão",
    gestao: "Gestão",
    pessoas: "Pessoas",
    eventos: "Eventos",
    financeiro: "Financeiro",
    espiritual: "Espiritual",
    comunicacao: "Comunicação",
    "comunicação": "Comunicação",
    administracao: "Configurações",
    admin: "Configurações",
    configuracoes: "Configurações",
    "configurações": "Configurações",
  };
  return map[k] || (cat || "Gestão");
};

export const Sidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const { data: churchId } = useChurchId();
  const { isAdmin, loading: permsLoading } = usePermissions();
  

  const allPagesQuery = useQuery<DynamicPage[]>({
    queryKey: ["allPages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id,name,route,category,sort_order")
        .order("category")
        .order("sort_order");
      if (error) return [] as DynamicPage[];
      return ((data || []) as DynamicPage[]);
    },
    staleTime: 5 * 60 * 1000,
  });

  const allowedPagesQuery = useQuery<DynamicPage[]>({
    queryKey: ["allowedPages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_pages")
        .select("page:pages(id,name,route,category,sort_order),allowed")
        .eq("allowed", true);
      if (error) return [] as DynamicPage[];
      const rows = (data || []) as Array<{ page: DynamicPage | null; allowed: boolean }>;
      return rows
        .map((r) => r.page)
        .filter((p): p is DynamicPage => !!p && !!getPageRoute(p));
    },
    staleTime: 60 * 1000,
  });

  const isActive = (path: string) => location.pathname === path;

  let visiblePages: DynamicPage[] = [];

  if (isAdmin) {
    const dbPages = allPagesQuery.data || [];
    visiblePages = dbPages.length > 0 ? dbPages : defaultPages;
    
    // Ensure Configurações is visible for admin
    const hasConfig = visiblePages.some(p => p.path === "/configuracoes" || p.label === "Configurações");
    if (!hasConfig) {
      visiblePages = [...visiblePages, { label: "Configurações", path: "/configuracoes", category: "Configurações" }];
    }
  } else {
    visiblePages = allowedPagesQuery.data || [];
    if (visiblePages.length === 0) {
      visiblePages = defaultPages;
    }
  }

  const grouped = visiblePages.reduce((acc: Record<string, DynamicPage[]>, p) => {
    const cat = canonicalCategory((p as unknown as Record<string, unknown>)["category"] as string | null);
    acc[cat] = acc[cat] || [];
    acc[cat].push(p);
    return acc;
  }, {});
  const isCollapsed = state === "collapsed";


  const prefetchMidia = async () => {
    if (!churchId) return;
    await queryClient.prefetchQuery({
      queryKey: ["media_library", churchId],
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from("media_library")
            .select("*")
            .eq("church_id", churchId as string)
            .order("created_at", { ascending: false });
          if (error) return [] as Array<{
            id: string; church_id: string; title: string; description: string | null; category: string; storage_path: string; public_url: string | null; share_id: string; created_at: string | null; updated_at: string | null;
          }>;
          return (data || []) as Array<{
          id: string;
          church_id: string;
          title: string;
          description: string | null;
          category: string;
          storage_path: string;
          public_url: string | null;
          share_id: string;
          created_at: string | null;
          updated_at: string | null;
          }>;
        } catch {
          return [] as Array<{
            id: string; church_id: string; title: string; description: string | null; category: string; storage_path: string; public_url: string | null; share_id: string; created_at: string | null; updated_at: string | null;
          }>;
        }
      },
      staleTime: 60 * 1000,
    });
  };

  return (
    <SidebarRoot collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={cn(
            "flex items-center gap-3 px-2 py-4",
            isCollapsed && "justify-center"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" aria-label="CVG" className="h-8 w-8 shrink-0 rounded">
              <defs>
                <linearGradient id="cvgGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
              <rect width="56" height="56" rx="14" fill="url(#cvgGrad2)" />
              <rect x="26" y="12" width="4" height="32" rx="2" fill="#ffffff" />
              <rect x="12" y="26" width="32" height="4" rx="2" fill="#ffffff" />
            </svg>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground">GraceHub</span>
                <span className="text-xs text-sidebar-foreground/60">Gestão Eclesiástica</span>
              </div>
            )}
          </div>
        </SidebarGroup>

        {Object.keys(grouped)
          .sort((a, b) => {
            const order = ["Gestão", "Pessoas", "Eventos", "Financeiro", "Espiritual", "Comunicação", "Configurações"];
            return (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b));
          })
          .map((cat) => {
          const GroupIcon = categoryIconMap[cat] || FileText;
          const items = (grouped[cat] || []).sort((a, b) => {
            const sa = ((a as unknown as Record<string, unknown>)["sort_order"] as number | null) ?? 999;
            const sb = ((b as unknown as Record<string, unknown>)["sort_order"] as number | null) ?? 999;
            return sa - sb;
          });
          const groupHasActive = items.some((it) => {
            const r = getPageRoute(it);
            return r ? isActive(r) : false;
          });

          return (
            <Collapsible
              key={cat}
              defaultOpen={groupHasActive}
              open={isCollapsed ? true : undefined}
              className="group/collapsible"
            >
              <SidebarGroup>
                {!isCollapsed && (
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 shrink-0" />
                        <span>{cat}</span>
                      </div>
                      <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                )}
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const route = getPageRoute(item);
                        const active = route ? isActive(route) : false;

                        return (
                          <SidebarMenuItem key={route || `${getPageLabel(item)}`}>
                            {route ? (
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={item.label || "Página"}
                                className={cn(
                                  !isCollapsed && "pl-8",
                                  active && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                                )}
                              >
                                <Link to={route} className="flex items-center gap-3" onMouseEnter={route === "/midia" ? prefetchMidia : undefined} onFocus={route === "/midia" ? prefetchMidia : undefined}>
                                  <GroupIcon className="h-4 w-4 shrink-0" />
                                  {!isCollapsed && <span>{getPageLabel(item)}</span>}
                                </Link>
                              </SidebarMenuButton>
                            ) : (
                              <SidebarMenuButton
                                isActive={false}
                                tooltip={item.label || "Página"}
                                className={cn(
                                  !isCollapsed && "pl-8",
                                  "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <GroupIcon className="h-4 w-4 shrink-0" />
                                  {!isCollapsed && <span>{getPageLabel(item)}</span>}
                                </div>
                              </SidebarMenuButton>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </SidebarRoot>
  );
};
