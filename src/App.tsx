import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Membros from "./pages/Membros";
import Celulas from "./pages/Celulas";
import Aniversariantes from "./pages/Aniversariantes";
import Eventos from "./pages/Eventos";
import Liturgia from "./pages/Liturgia";
import Visitantes from "./pages/Visitantes";
import Ministerios from "./pages/Ministerios";
import Oracoes from "./pages/Oracoes";
import DicasLeitura from "./pages/DicasLeitura";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configuracoes";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Midias from "./pages/Midias";
import PublicModeloSite from "./pages/PublicModeloSite";
import ModeloEditavel from "./pages/ModeloEditavel";
import SiteBuilder from "./pages/SiteBuilder";
import React, { Suspense } from "react";
import Relatorios from "./pages/Relatorios";
import Checkin from "./pages/Checkin";
import MeuPerfil from "./pages/MeuPerfil";
import PaginaVendas from "./templates/pagina vendas/src/pages/Index";
const MidiaShare = React.lazy(() => import("./pages/MidiaShare"));
import PublicCheckin from "./pages/PublicCheckin";
import UsuariosPermissoes from "./pages/UsuariosPermissoes";
import Forbidden from "./pages/Forbidden";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PaginaVendas />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/vendas" element={<PaginaVendas />} />
          <Route element={<DashboardLayout />}> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/membros" element={<Membros />} />
            <Route path="/planos" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-muted-foreground">Planos e Assinatura - Em breve</h1></div>} />
            <Route path="/celulas" element={<Celulas />} />
            <Route path="/aniversariantes" element={<Aniversariantes />} />
            <Route path="/visitantes" element={<Visitantes />} />
            <Route path="/ministerios" element={<Ministerios />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/culto-e-programacao" element={<Liturgia />} />
            <Route path="/liturgia" element={<Navigate to="/culto-e-programacao" replace />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/financeiro" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-muted-foreground">Financeiro - Em breve</h1></div>} />
            <Route path="/oracoes" element={<Oracoes />} />
            <Route path="/dicas-leitura" element={<DicasLeitura />} />
            <Route path="/midia" element={<Midias />} />
            <Route path="/site-builder" element={<SiteBuilder />} />
            <Route path="/site-modelo" element={<PublicModeloSite />} />
            <Route path="/modelo-site/*" element={<PublicModeloSite />} />
            <Route path="/site-modelo-editavel" element={<ModeloEditavel />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<MeuPerfil />} />
            <Route path="/usuarios-permissoes" element={<UsuariosPermissoes />} />
          </Route>
          <Route
            path="/midia-share/:share_id"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 rounded-full bg-muted animate-pulse" /></div>}>
                <MidiaShare />
              </Suspense>
            }
          />
          <Route path="/checkin/:event_id" element={<PublicCheckin />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
