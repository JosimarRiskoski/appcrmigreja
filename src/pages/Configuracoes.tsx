import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { clearChurchLogoCache } from "@/lib/logo";
import { Upload, Copy, RefreshCcw, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import FileButton from "@/components/ui/FileButton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getChurchLogo } from "@/lib/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { maskPhone } from "@/lib/utils";

type ChurchRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  logo_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  app_code: string | null;
  slug: string;
};

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  app_code: z.string().min(4, "Código inválido"),
  primary_color: z.string().optional().or(z.literal("")),
  secondary_color: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { data: churchId } = useChurchId();
  type Role = "admin" | "lider" | "membro";
  const [role, setRole] = useState<Role | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const churchQuery = useQuery<ChurchRow | null>({
    queryKey: ["church", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("churches")
        .select("id, name, email, phone, address, city, state, website, logo_path, primary_color, secondary_color, app_code, slug")
        .eq("id", churchId as string)
        .maybeSingle();
      return (data || null) as ChurchRow | null;
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const roleVal = prof?.role as unknown;
      const normalized: Role = roleVal === "admin" ? "admin" : roleVal === "lider" ? "lider" : "membro";
      setRole(normalized);
    });
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      website: "",
      app_code: "",
      primary_color: "#3b82f6",
      secondary_color: "#8b5cf6",
    },
  });

  useEffect(() => {
    const c = churchQuery.data;
    if (churchId && !churchQuery.isLoading && !c) {
      supabase
        .from("churches")
        .insert({
          id: churchId,
          name: "Minha Igreja",
          slug: slugify("Minha Igreja"),
          primary_color: "#3b82f6",
          secondary_color: "#8b5cf6",
        })
        .then(() => queryClient.invalidateQueries({ queryKey: ["church", churchId] }));
    }
    if (c) {
      form.reset({
        name: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "",
        state: c.state || "",
        website: c.website || "",
        app_code: c.app_code || "",
        primary_color: c.primary_color || "#3b82f6",
        secondary_color: c.secondary_color || "#8b5cf6",
      });
    }
  }, [churchId, churchQuery.data, churchQuery.isLoading, form, queryClient]);

  const disabled = role !== "admin";

  const logoPreviewQuery = useQuery<string | null>({
    queryKey: ["configLogoPreview", churchId, churchQuery.data?.logo_path, churchQuery.data?.logo_url],
    enabled: !!churchId,
    queryFn: async () => {
      return await getChurchLogo(churchId as string);
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleUploadLogo = async (): Promise<{ path: string; publicUrl: string } | null> => {
    if (!logoFile || !churchId) return null;
    const filePath = `${churchId}/logo_${crypto.randomUUID()}_${logoFile.name}`;
    const { error: upErr } = await supabase.storage.from("church-logos").upload(filePath, logoFile, {
      upsert: true,
      contentType: logoFile.type || "application/octet-stream",
      cacheControl: "3600",
    });
    if (upErr) {
      const msg = String(upErr?.message || "Falha no upload da logo");
      if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
        toast.error("Bucket 'church-logos' não encontrado no Supabase Storage.");
      } else {
        toast.error(msg);
      }
      return null;
    }
    const { data: pub } = supabase.storage.from("church-logos").getPublicUrl(filePath);
    return { path: filePath, publicUrl: pub?.publicUrl ?? filePath };
  };

  const ensureUniqueAppCode = async (code: string) => {
    const { data } = await supabase
      .from("churches")
      .select("id")
      .eq("app_code", code);
    const exists = (data || []).some((row) => row.id !== churchId);
    return !exists;
  };

  const handleGenerateCode = async () => {
    if (disabled) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc("generate_app_code");
      if (error) throw error;
      const code = String(data ?? "");
      if (!code) throw new Error("Falha ao gerar código");
      const unique = await ensureUniqueAppCode(code);
      if (!unique) throw new Error("Código duplicado. Tente novamente.");
      form.setValue("app_code", code, { shouldValidate: true });
      toast.success("Novo código gerado");
    } catch (e) {
      const msg = typeof (e as unknown as { message?: string })?.message === "string" ? (e as unknown as { message?: string }).message : "Erro ao gerar código";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = async (values: FormData) => {
    if (disabled) return;
    setSaving(true);
    try {
      if (!(await ensureUniqueAppCode(values.app_code))) {
        toast.error("Código duplicado");
        setSaving(false);
        return;
      }
      let logoPath = churchQuery.data?.logo_path ?? null;
      if (logoFile) {
        const uploaded = await handleUploadLogo();
        if (uploaded) logoPath = uploaded.path;
      }
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        address: values.address?.trim() || null,
        city: values.city?.trim() || null,
        state: values.state?.trim() || null,
        website: values.website?.trim() || null,
        primary_color: values.primary_color || null,
        secondary_color: values.secondary_color || null,
        logo_path: logoPath,
        app_code: values.app_code.trim(),
        slug: slugify(values.name.trim()),
      } as Partial<ChurchRow>;

      const { error: updErr } = await supabase.from("churches").update(payload).eq("id", churchId as string);
      if (updErr && logoFile) {
        const uploaded = await handleUploadLogo();
        if (uploaded) {
          await supabase.from("churches").update({ logo_url: uploaded.publicUrl }).eq("id", churchId as string);
          toast.warning("Banco sem coluna 'logo_path'. Usando 'logo_url' temporariamente.");
        }
      }
      clearChurchLogoCache(churchId as string);
      queryClient.invalidateQueries({ queryKey: ["topbarLogo", churchId] });
      queryClient.invalidateQueries({ queryKey: ["sidebarLogo", churchId] });
      queryClient.invalidateQueries({ queryKey: ["churchLogo", churchId] });
      queryClient.invalidateQueries({ queryKey: ["publicLogo", churchId] });
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["church", churchId] });
    } catch (e) {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async () => {
    try {
      const code = form.getValues("app_code");
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado");
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const canEdit = !disabled;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações Gerais</h1>
          <p className="text-muted-foreground">Centralize os dados e identidade da sua igreja</p>
        </div>
        {disabled && (
          <div className="flex items-center gap-2 text-yellow-700 bg-yellow-100 px-3 py-1 rounded">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm">Somente administradores podem editar</span>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit, () => toast.info('Existem campos obrigatórios não preenchidos'))} className="space-y-6">
        {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 && (
          <Alert>
            <AlertDescription>
              Existem campos obrigatórios não preenchidos. Preencha os campos marcados com *.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados da Igreja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input disabled={!canEdit} {...form.register("name")} placeholder="Nome da igreja" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input disabled={!canEdit} {...form.register("email")} placeholder="contato@igreja.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input disabled={!canEdit} {...form.register("phone", { onChange: (e) => form.setValue("phone", maskPhone((e.target as HTMLInputElement).value)) })} placeholder="(11) 98765-4321" />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input disabled={!canEdit} {...form.register("address")} placeholder="Rua, número, bairro" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input disabled={!canEdit} {...form.register("city")} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input disabled={!canEdit} {...form.register("state")} placeholder="UF" maxLength={2} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Website</Label>
                  <Input disabled={!canEdit} {...form.register("website")} placeholder="https://" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>APP CODE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <div className="flex gap-2">
                  <Input disabled={!canEdit} {...form.register("app_code")} placeholder="ABCDE123" />
                  <Button type="button" variant="outline" onClick={copyCode} title="Copiar"><Copy className="h-4 w-4" /></Button>
                  <Button type="button" disabled={!canEdit || generating} onClick={handleGenerateCode} className="bg-primary">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Membros usam este código no app para acessar sua igreja.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  <FileButton label="Escolher arquivo" accept="image/*" onSelected={(file) => setLogoFile(file)} disabled={!canEdit} />
                  <Button type="button" disabled={!canEdit || !logoFile} className="bg-primary" onClick={async () => {
                    const uploaded = await handleUploadLogo();
                    if (uploaded) {
                      const { error } = await supabase.from("churches").update({ logo_path: uploaded.path }).eq("id", churchId as string);
                      if (!error) {
                        toast.success("Logo atualizada");
                        clearChurchLogoCache(churchId as string);
                        queryClient.invalidateQueries({ queryKey: ["church", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["topbarLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["sidebarLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["churchLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["publicLogo", churchId] });
                        setLogoFile(null);
                      } else {
                        await supabase.from("churches").update({ logo_url: uploaded.publicUrl }).eq("id", churchId as string);
                        toast.warning("Banco sem coluna 'logo_path'. Usando 'logo_url' temporariamente.");
                        clearChurchLogoCache(churchId as string);
                        queryClient.invalidateQueries({ queryKey: ["church", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["topbarLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["sidebarLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["churchLogo", churchId] });
                        queryClient.invalidateQueries({ queryKey: ["publicLogo", churchId] });
                        setLogoFile(null);
                      }
                    }
                  }}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  {logoPreviewQuery.data ? (
                    <img src={logoPreviewQuery.data} alt="Logo" className="h-10 w-auto rounded border object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Logo da igreja não configurada</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input disabled={!canEdit} type="color" className="w-12 h-10 p-1" {...form.register("primary_color")} />
                    <Input disabled={!canEdit} placeholder="#3b82f6" {...form.register("primary_color")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <Input disabled={!canEdit} type="color" className="w-12 h-10 p-1" {...form.register("secondary_color")} />
                    <Input disabled={!canEdit} placeholder="#8b5cf6" {...form.register("secondary_color")} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-sm py-8 flex items-center justify-center">
              <div className="text-muted-foreground text-center">Configurações refletem no site/app (logo, cores, código).</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={!canEdit || saving || !form.formState.isValid} className="bg-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
