import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type MemberRow = {
  id: string;
  church_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
  member_since: string | null;
};

export default function UsuariosPermissoes() {
  const { data: churchId } = useChurchId();
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [privLoading, setPrivLoading] = useState(false);
  const [optimisticPriv, setOptimisticPriv] = useState(false);

  const membersQuery = useQuery<MemberRow[]>({
    queryKey: ["membersWithEmail", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentEmail = session?.user?.email || null;

      let q = supabase
        .from("members")
        .select("id, church_id, full_name, email, phone, photo_url, status, member_since")
        .eq("church_id", churchId as string)
        .not("email", "is", null)
        .neq("email", "");

      if (currentEmail) {
        q = q.neq("email", currentEmail);
      }

      const { data, error } = await q.order("full_name");
      if (error) throw error;
      return (data || []) as MemberRow[];
    },
    staleTime: 60_000,
  });

  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase();
    return (membersQuery.data || []).filter((m) =>
      (m.full_name || "").toLowerCase().includes(term) || (m.email || "").toLowerCase().includes(term)
    );
  }, [membersQuery.data, search]);

  const pagesQuery = useQuery<Array<{ id: string; name: string; route: string; category: string | null; sort_order: number | null }>>({
    queryKey: ["catalogPages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id,name,route,category,sort_order")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string; route: string; category: string | null; sort_order: number | null }>;
    },
    staleTime: 300_000,
  });

  const profileIdQuery = useQuery<string | null>({
    queryKey: ["profileIdByMemberEmail", selectedMember?.email],
    enabled: !!selectedMember?.email,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolve_profile_id_by_email", { p_email: selectedMember!.email as string });
      if (error) return null;
      return (data as string | null) || null;
    },
  });

  const profileRowQuery = useQuery<{ id: string; role: string | null; church_id: string | null } | null>({
    queryKey: ["profileRowById", profileIdQuery.data],
    enabled: !!profileIdQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, church_id")
        .eq("id", profileIdQuery.data as string)
        .maybeSingle();
      if (error) return null;
      return (data || null) as { id: string; role: string | null; church_id: string | null } | null;
    },
    staleTime: 60_000,
  });

  const userPagesQuery = useQuery<Array<{ page_id: string; allowed: boolean }>>({
    queryKey: ["userPages", profileIdQuery.data],
    enabled: !!profileIdQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_pages")
        .select("page_id,allowed")
        .eq("user_id", profileIdQuery.data as string);
      if (error) throw error;
      return (data || []) as Array<{ page_id: string; allowed: boolean }>;
    },
  });

  useEffect(() => {
    if (!selectedMember && (membersQuery.data || []).length > 0) {
      setSelectedMember(membersQuery.data![0]);
    }
  }, [membersQuery.data, selectedMember]);

  const handleToggle = useCallback(async (pageId: string, nextAllowed: boolean) => {
    if (!selectedMember?.email) return;
    await supabase.rpc("grant_user_page", { p_target_email: selectedMember.email as string, p_page_id: pageId, p_allowed: nextAllowed });
    await userPagesQuery.refetch();
  }, [selectedMember?.email, userPagesQuery]);

  const privilegesEnabled = useMemo(() => {
    if (!profileRowQuery.data) return false;
    return (profileRowQuery.data.role || "").toLowerCase() === "admin" && (!!churchId && profileRowQuery.data.church_id === churchId);
  }, [profileRowQuery.data, churchId]);

  const handlePrivilegesToggle = useCallback(async (next: boolean) => {
    if (!selectedMember?.email || !churchId) return;
    setOptimisticPriv(next);
    setPrivLoading(true);
    try {
      if (next && !profileIdQuery.data) {
        const { data, error } = await supabase.functions.invoke("invite_user", {
          body: {
            target_email: selectedMember.email as string,
            church_id: churchId as string,
            grant_admin: true,
            grant_all_pages: true,
          },
        });
        if (error) {
          toast.error(String(error.message || "Falha ao convidar e conceder privilégios"));
        } else {
          toast.success("Usuário criado/convidado, privilégios e páginas concedidos");
        }
        await profileRowQuery.refetch();
        await userPagesQuery.refetch();
        return;
      }

      const { error } = await supabase.rpc("grant_admin_privileges", {
        p_target_email: selectedMember.email as string,
        p_church_id: churchId as string,
        p_grant: next,
      });

      if (!error && next) {
        const pages = pagesQuery.data || [];
        for (const pg of pages) {
          await supabase.rpc("grant_user_page", { p_target_email: selectedMember.email as string, p_page_id: pg.id, p_allowed: true });
        }
        toast.success("Privilégios concedidos e páginas liberadas");
      } else if (error) {
        toast.error("Falha ao atualizar privilégios");
      }

      await profileRowQuery.refetch();
      await userPagesQuery.refetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || "Erro ao processar privilégios");
    } finally {
      setPrivLoading(false);
    }
  }, [selectedMember?.email, churchId, pagesQuery.data, profileRowQuery, userPagesQuery, profileIdQuery.data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários & Permissões</h1>
          <p className="text-muted-foreground">Liste membros com e-mail para habilitar acesso</p>
        </div>
        <Badge variant="secondary">Somente leitura</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Membros com e-mail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />

            {membersQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setOpenDetails(true); }}
                    className={`w-full flex items-center gap-3 p-2 rounded border ${selectedMember?.id === m.id ? "bg-muted" : "bg-background"}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.photo_url || undefined} />
                      <AvatarFallback>{(m.full_name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium truncate">{m.full_name}</div>
                      <div className="text-sm text-muted-foreground truncate">{m.email}</div>
                    </div>
                  </button>
                ))}
                {(filteredMembers.length === 0 && !membersQuery.isLoading) && (
                  <div className="text-sm text-muted-foreground">Nenhum membro com e-mail encontrado</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Membro</SheetTitle>
          </SheetHeader>
          {selectedMember && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.photo_url || undefined} />
                  <AvatarFallback>{(selectedMember.full_name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">{selectedMember.full_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMember.email}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{selectedMember.phone || "Sem telefone"}</div>
              <div className="text-sm text-muted-foreground">{selectedMember.status || "Sem status"}</div>
              {selectedMember.member_since && (
                <div className="text-xs text-muted-foreground">Membro desde {new Date(selectedMember.member_since).toLocaleDateString("pt-BR")}</div>
              )}

              <div className="mt-6">
                <div className="text-sm font-medium">Dar privilégios</div>
                <div className="mt-2 flex items-center gap-3">
                  <Switch checked={privilegesEnabled || optimisticPriv} onCheckedChange={(v) => handlePrivilegesToggle(!!v)} disabled={privLoading} />
                  <div className="text-sm text-muted-foreground">Concede poderes administrativos e acesso para seleção de páginas</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium">Acesso a páginas</div>
                <div className="mt-3 space-y-2">
                  {(pagesQuery.data || []).map((pg) => {
                    const allowed = (userPagesQuery.data || []).some((up) => up.page_id === pg.id && up.allowed === true);
                    return (
                      <label key={pg.id} className="flex items-center gap-3 rounded border p-2">
                        <Checkbox checked={allowed} onCheckedChange={(v) => handleToggle(pg.id, !!v)} />
                        <div className="flex-1">
                          <div className="font-medium">{pg.name}</div>
                          <div className="text-xs text-muted-foreground">{pg.route}</div>
                        </div>
                      </label>
                    );
                  })}
                  {pagesQuery.isLoading && (<div className="text-sm text-muted-foreground">Carregando páginas...</div>)}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
