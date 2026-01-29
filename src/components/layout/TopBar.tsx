import { User } from "@supabase/supabase-js";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { getChurchLogo } from "@/lib/logo";

interface TopBarProps {
  user: User;
}

export const TopBar = ({ user }: TopBarProps) => {
  const navigate = useNavigate();
  const { data: churchId } = useChurchId();

  const trialStatusQuery = useQuery({
    queryKey: ["topbarTrialStatus", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data: church } = await supabase
        .from("churches")
        .select("trial_end_date, current_plan")
        .eq("id", churchId as string)
        .single();
      if (church?.current_plan === "trial" && church.trial_end_date) {
        const endDate = new Date(church.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 ? daysLeft : 0;
      }
      return null as number | null;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const profileQuery = useQuery<{ full_name: string | null; avatar_url: string | null }>({
    queryKey: ["topbarProfile", user.id],
    enabled: !!user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return { full_name: null, avatar_url: null };
      return { full_name: (data?.full_name as string | null) || null, avatar_url: (data?.avatar_url as string | null) || null };
    },
    staleTime: 60 * 1000,
  });

  const getInitials = () => {
    const name = profileQuery.data?.full_name || user.user_metadata?.full_name || user.email || "U";
    return name.charAt(0).toUpperCase();
  };

  const logoQuery = useQuery<string | null>({
    queryKey: ["topbarLogo", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      return await getChurchLogo(churchId as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex items-center justify-between w-full">

      <div className="flex items-center gap-3">
        {logoQuery.data ? (
          <img src={logoQuery.data} alt="Logo" className="h-10 w-auto object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">Logo da igreja não configurada</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {trialStatusQuery.data !== null && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 gap-2 animate-blink-slow bg-secondary/20 text-foreground border-secondary/50 hover:bg-secondary/25"
            onClick={() => navigate("/planos")}
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs">Teste: {trialStatusQuery.data} dias</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                {profileQuery.data?.avatar_url ? (
                  <AvatarImage src={profileQuery.data.avatar_url} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {profileQuery.data?.full_name || user.user_metadata?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
