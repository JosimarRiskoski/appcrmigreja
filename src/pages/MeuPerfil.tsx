import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import FileButton from "@/components/ui/FileButton";
import { toast } from "sonner";
import { maskPhone } from "@/lib/utils";

type ProfileRow = {
  id: string;
  church_id: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
};


export default function MeuPerfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const userQuery = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ?? null;
    },
    staleTime: 60_000,
  });

  const profileQuery = useQuery<ProfileRow | null>({
    queryKey: ["myProfile", userQuery.data?.id],
    enabled: !!userQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, church_id, full_name, role, avatar_url, phone, created_at, updated_at")
        .eq("id", userQuery.data!.id)
        .maybeSingle();
      if (error) return null;
      return (data || null) as ProfileRow | null;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name || "");
      setPhone(profileQuery.data.phone || "");
    }
  }, [profileQuery.data]);

  const initials = useMemo(() => {
    const name = fullName || userQuery.data?.email || "U";
    return name.charAt(0).toUpperCase();
  }, [fullName, userQuery.data?.email]);

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !userQuery.data?.id) return null;
    const filePath = `profiles/${userQuery.data.id}/avatar_${crypto.randomUUID()}_${avatarFile.name}`;
    const { error: upErr } = await supabase.storage.from("church-logos").upload(filePath, avatarFile, {
      upsert: true,
      contentType: avatarFile.type || "application/octet-stream",
      cacheControl: "3600",
    });
    if (upErr) {
      toast.error(String(upErr.message || "Falha no upload do avatar"));
      return null;
    }
    const { data: pub } = supabase.storage.from("church-logos").getPublicUrl(filePath);
    return pub?.publicUrl ?? null;
  };

  const handleSave = async () => {
    if (!userQuery.data?.id) return;
    let avatarUrl = profileQuery.data?.avatar_url || null;
    if (avatarFile) {
      const uploaded = await uploadAvatar();
      if (uploaded) avatarUrl = uploaded;
    }
    const payload = {
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    } as Partial<ProfileRow>;
    const { error } = await supabase.from("profiles").update(payload).eq("id", userQuery.data.id);
    if (error) {
      toast.error("Erro ao salvar perfil");
      return;
    }
    toast.success("Perfil atualizado");
    setAvatarFile(null);
    queryClient.invalidateQueries({ queryKey: ["myProfile", userQuery.data.id] });
    queryClient.invalidateQueries({ queryKey: ["topbarProfile", userQuery.data.id] });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e de acesso ao sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Avatar do usuário</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profileQuery.data?.avatar_url ? (
              <AvatarImage src={profileQuery.data.avatar_url} />
            ) : (
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex items-center gap-2">
            <FileButton label="Escolher arquivo" accept="image/*" onSelected={(file) => setAvatarFile(file)} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">A imagem atualiza imediatamente no topo do sistema.</div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 98765-4321" />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <div>
              <Badge variant="secondary">{profileQuery.data?.role || "Admin"}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Igreja vinculada</Label>
            <Input value={profileQuery.data?.church_id || ""} disabled />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={userQuery.isLoading || profileQuery.isLoading}>
            {userQuery.isLoading || profileQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span className="ml-2">Salvar alterações</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
