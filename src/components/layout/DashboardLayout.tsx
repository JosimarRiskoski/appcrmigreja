import { useEffect, useMemo, useState } from "react";
import { useNavigate, Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useChurchId } from "@/hooks/useChurchId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { useLocation, useNavigate as useNav } from "react-router-dom";

export const DashboardLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { data: churchId, isLoading: churchLoading } = useChurchId({ userId: session?.user.id, enabled: !!session });
  const queryClient = useQueryClient();
  const { pages, isAdmin, loading: permsLoading } = usePermissions();
  const loc = useLocation();
  const nav2 = useNav();
  const themeQuery = useQuery({
    queryKey: ["churchTheme", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("churches")
        .select("primary_color, secondary_color")
        .eq("id", churchId as string)
        .single();
      return data || { primary_color: null, secondary_color: null } as { primary_color: string | null; secondary_color: string | null };
    },
  });

  const allowedRoutesQuery = useQuery<string[]>({
    queryKey: ["allowedRoutes", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      if (!uid) return [] as string[];
      const { data, error } = await supabase
        .from("user_pages")
        .select("page:pages(route),allowed,user_id")
        .eq("allowed", true)
        .eq("user_id", uid);
      if (error) return [] as string[];
      const rows = (data || []) as Array<{ page: { route?: string | null } | null; allowed: boolean; user_id: string }>;
      return rows
        .map((r) => translateRoute(r.page?.route || null))
        .filter((p): p is string => !!p);
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const toHsl = (hex: string) => {
    const n = hex.replace(/^#/, "");
    const bigint = parseInt(n.length === 3 ? n.split("").map(c => c + c).join("") : n, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break;
        case gg: h = (bb - rr) / d + 2; break;
        case bb: h = (rr - gg) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const routeMap: Record<string, string> = {
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
  const translateRoute = (route: string | null | undefined): string | null => {
    if (!route) return null;
    return routeMap[route] || route;
  };

  const applyTheme = useMemo(() => {
    return (primary?: string | null, secondary?: string | null) => {
      // Intentionally no-op: dashboard keeps default system theme independent of site settings
    };
  }, []);

  useEffect(() => {
    const p = themeQuery.data?.primary_color || null;
    const s = themeQuery.data?.secondary_color || null;
    applyTheme(p, s);
  }, [themeQuery.data, applyTheme]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    if (churchLoading) return;
    if (!churchId) {
      navigate("/onboarding");
      setLoading(false);
      return;
    }
    setLoading(false);
    queryClient.prefetchQuery({
      queryKey: ["media_library", churchId],
      queryFn: async () => {
        const { data } = await supabase
          .from("media_library")
          .select("*")
          .eq("church_id", churchId as string)
          .order("created_at", { ascending: false });
        return (data || []) as Array<{
          id: string; church_id: string; title: string; description: string | null; category: string; storage_path: string; public_url: string | null; share_id: string; created_at: string | null; updated_at: string | null;
        }>;
      },
      staleTime: 60 * 1000,
    });
  }, [session, churchId, churchLoading, navigate, queryClient]);

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || churchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowedRoutesQuery.isLoading) {
    const current = loc.pathname;
    const allowed = allowedRoutesQuery.data || [];
    // if (!isAdmin && allowed.length > 0 && !allowed.includes(current)) {
    //   return <Navigate to="/404" replace />;
    // }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <TopBar user={user} />
            </div>
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
