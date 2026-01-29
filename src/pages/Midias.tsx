import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { LayoutType } from "@/types/event";
import { toast } from "sonner";
import { Plus, Search, Image as ImageIcon, Video, FileText, Music, Link as LinkIcon, Copy, Upload, Loader2, AlertTriangle, ArrowUpDown } from "lucide-react";
import FileButton from "@/components/ui/FileButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type MediaCategory = "imagens" | "videos" | "documentos" | "audios" | "outros";

type MediaItem = {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  category: MediaCategory;
  storage_path: string;
  public_url: string | null;
  share_id: string;
  created_at: string | null;
  updated_at: string | null;
};

const LAYOUT_STORAGE_KEY = "graceHubMediaLayoutPreference";

const gridClasses: Record<LayoutType, string> = {
  compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
  medium: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  spaced: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
};

const cardClassesByLayout: Record<LayoutType, string> = {
  compact: "overflow-hidden rounded-lg",
  medium: "overflow-hidden rounded-lg",
  spaced: "overflow-hidden rounded-xl shadow-md",
};

const cardInnerPadding: Record<LayoutType, string> = {
  compact: "p-2",
  medium: "p-3",
  spaced: "p-4",
};

const thumbContainerClasses: Record<LayoutType, string> = {
  compact: "aspect-video w-full overflow-hidden rounded-md bg-muted",
  medium: "aspect-video w-full overflow-hidden rounded-md bg-muted",
  spaced: "aspect-video w-full overflow-hidden rounded-lg bg-muted",
};

const titleClasses: Record<LayoutType, string> = {
  compact: "font-medium text-sm truncate",
  medium: "font-medium truncate",
  spaced: "font-semibold text-lg truncate",
};

const categoryClasses: Record<LayoutType, string> = {
  compact: "text-xs text-muted-foreground truncate",
  medium: "text-xs text-muted-foreground truncate",
  spaced: "text-sm text-muted-foreground truncate",
};

const actionContainerClasses: Record<LayoutType, string> = {
  compact: "flex items-center gap-1",
  medium: "flex items-center gap-2",
  spaced: "flex items-center gap-3",
};

const iconButtonSizeClass: Record<LayoutType, string> = {
  compact: "h-8 w-8",
  medium: "h-9 w-9",
  spaced: "h-10 w-10",
};

const iconSizeByLayout: Record<LayoutType, string> = {
  compact: "h-3.5 w-3.5",
  medium: "h-4 w-4",
  spaced: "h-5 w-5",
};

function categoryIcon(cat: MediaCategory) {
  switch (cat) {
    case "imagens":
      return ImageIcon;
    case "videos":
      return Video;
    case "documentos":
      return FileText;
    case "audios":
      return Music;
    default:
      return FileText;
  }
}

function generateShareId() {
  const raw = crypto.randomUUID().split("-").join("");
  return raw.slice(0, 12);
}

export default function Midias() {
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();

  const mediaQuery = useQuery<MediaItem[]>({
    queryKey: ["media_library", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("media_library")
          .select("*")
          .eq("church_id", churchId as string)
          .order("created_at", { ascending: false });
        if (error) {
          return [] as MediaItem[];
        }
        return (data || []) as MediaItem[];
      } catch {
        return [] as MediaItem[];
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: [] as MediaItem[],
  });

  const storageProbe = useQuery<{ ok: boolean; message?: string }>({
    queryKey: ["media_bucket_probe"],
    queryFn: async () => {
      try {
        const { error } = await supabase.storage.from("media").list("", { limit: 1 });
        if (error) return { ok: false, message: error.message };
        return { ok: true };
      } catch (e) {
        const err = e as { message?: string } | undefined;
        return { ok: false, message: err?.message };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const tableProbe = useQuery<{ ok: boolean; message?: string }>({
    queryKey: ["media_table_probe", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      try {
        const { error } = await supabase.from("media_library").select("id").eq("church_id", churchId as string).limit(1);
        if (error) return { ok: false, message: error.message };
        return { ok: true };
      } catch (e) {
        const err = e as { message?: string } | undefined;
        return { ok: false, message: err?.message };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    return (localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType) || "medium";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MediaCategory>("imagens");

  const filteredMedia = useMemo(() => {
    const items = mediaQuery.data || [];
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((m) =>
      (m.title || "").toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q)
    );
  }, [mediaQuery.data, searchQuery]);

  const sortedMedia = useMemo(() => {
    return [...filteredMedia].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [filteredMedia, sortOrder]);

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("imagens");
    setIsPublic(false);
  };

  const handleAddMedia = () => {
    resetForm();
    setShowAddModal(true);
  };

  const [isPublic, setIsPublic] = useState(false);

  const uploadAndSave = async () => {
    if (!churchId) return;
    if (!file || !title.trim()) {
      toast.error("Selecione o arquivo e informe um título");
      return;
    }
    setUploading(true);
    try {
      const filePath = `${churchId}/${crypto.randomUUID()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("media").upload(filePath, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("media").getPublicUrl(filePath);

      const shareId = generateShareId();
      const payload = {
        church_id: churchId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        storage_path: filePath,
        public_url: pub.publicUrl || null,
        share_id: shareId,
      };
      const { error: insErr } = await supabase.from("media_library").insert(payload);
      if (insErr) throw insErr;

      if (isPublic && category === "imagens" && pub.publicUrl) {
        try {
          const db = supabase as SupabaseClient<Database>;
          const { data: existing } = await db
            .from("site_settings")
            .select("data")
            .eq("church_id", churchId as string)
            .maybeSingle();
          type SiteData = {
            content?: { galeria?: { fotos?: { src: string; alt: string }[] } };
          };
          const current = ((existing as { data?: Json })?.data || {}) as SiteData;
          const next: Json = {
            ...current,
            content: {
              ...(current.content || {}),
              galeria: {
                fotos: [
                  ...((current.content?.galeria?.fotos || [])),
                  { src: pub.publicUrl, alt: title.trim() },
                ],
              },
            },
          };
          await db
            .from("site_settings")
            .upsert({ church_id: churchId as string, data: next, updated_at: new Date().toISOString() });
        } catch {
          void 0;
        }
      }

      toast.success("Mídia adicionada");
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["media_library", churchId] });
    } catch (e) {
      const err = e as { message?: string } | undefined;
      const msg = typeof err?.message === "string" ? err.message : "Falha ao salvar mídia";
      if (msg.toLowerCase().includes("bucket not found") || msg.toLowerCase().includes("no such bucket")) {
        toast.error("Bucket 'media' não encontrado no Supabase. Crie o bucket 'media' nas configurações de Storage.");
      } else if (msg.toLowerCase().includes("row level security") || msg.toLowerCase().includes("permission")) {
        toast.error("Permissões insuficientes. Verifique as políticas RLS da tabela 'media_library' e o acesso ao Storage.");
      } else if (msg.toLowerCase().includes("payload too large") || msg.toLowerCase().includes("413")) {
        toast.error("Arquivo muito grande para seu plano. Envie um arquivo menor.");
      } else if (msg.toLowerCase().includes("relation") && msg.toLowerCase().includes("does not exist")) {
        toast.error("Tabela 'media_library' não existe. Crie a tabela conforme instruções.");
      } else {
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const copyShareLink = (item: MediaItem) => {
    const url = `${window.location.origin}/midia-share/${item.share_id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copiado"));
  };

  const renderThumb = (item: MediaItem, layout: LayoutType) => {
    const Icon = categoryIcon(item.category);
    const isImage = item.category === "imagens" && item.public_url;
    if (isImage) {
      return (
        <div className={thumbContainerClasses[layout]}>
          <img src={item.public_url as string} alt={item.title} className="h-full w-full object-cover" />
        </div>
      );
    }
    return (
      <div className={thumbContainerClasses[layout] + " flex items-center justify-center"}>
        <Icon className={iconSizeByLayout[layout] + " text-muted-foreground"} />
      </div>
    );
  };

  const showLoadingHeader = churchLoading || !churchId;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mídias</h1>
            <p className="text-muted-foreground">Gerencie e compartilhe a biblioteca de mídia</p>
          </div>
          <Button onClick={handleAddMedia}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Mídia
          </Button>
        </div>

        {(!storageProbe.data?.ok || !tableProbe.data?.ok) && (
          <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Configuração necessária</div>
              {!storageProbe.data?.ok && (
                <div>Bucket <code>media</code> não encontrado no Storage. Crie um bucket público chamado <code>media</code>.</div>
              )}
              {!tableProbe.data?.ok && (
                <div>Tabela <code>media_library</code> não encontrada. Crie a tabela e políticas conforme instruções.</div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mídias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <LayoutSelector selectedLayout={selectedLayout} onLayoutChange={handleLayoutChange} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {sortedMedia.length} {sortedMedia.length === 1 ? "mídia" : "mídias"}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
              <SelectTrigger className="h-8 w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais novos</SelectItem>
                <SelectItem value="oldest">Mais velhos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {mediaQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-full bg-primary/10 p-6 mb-4">
            <ImageIcon className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma mídia cadastrada</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Envie imagens, vídeos, documentos ou áudios para organizar e compartilhar com facilidade.
          </p>
          <Button onClick={handleAddMedia} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Enviar Mídia
          </Button>
        </div>
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedMedia.map((item) => (
            <Card key={item.id} className={cardClassesByLayout[selectedLayout]}>
              <CardContent className="p-0">
                {renderThumb(item, selectedLayout)}
                <div className={cardInnerPadding[selectedLayout] + " flex items-center justify-between"}>
                  <div className="min-w-0">
                    <div className={titleClasses[selectedLayout]}>{item.title}</div>
                    <div className={categoryClasses[selectedLayout]}>{item.category}</div>
                    {selectedLayout === "spaced" && item.description && (
                      <div className="text-sm text-muted-foreground truncate mt-1">{item.description}</div>
                    )}
                  </div>
                  <div className={actionContainerClasses[selectedLayout]}>
                    <Button
                      variant={selectedLayout === "compact" ? "ghost" : "outline"}
                      size="icon"
                      className={iconButtonSizeClass[selectedLayout]}
                      onClick={() => copyShareLink(item)}
                      title="Copiar link"
                    >
                      <Copy className={iconSizeByLayout[selectedLayout]} />
                    </Button>
                    {item.public_url && (
                      <a href={item.public_url} target="_blank" rel="noreferrer" title="Abrir">
                        <Button variant="outline" size="icon" className={iconButtonSizeClass[selectedLayout]}>
                          <LinkIcon className={iconSizeByLayout[selectedLayout]} />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova Mídia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Ex.: Banner do Culto de Domingo" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["imagens","videos","documentos","audios","outros"] as MediaCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        <div className="inline-flex items-center gap-2">
                          {(() => { const Icon = categoryIcon(c); return <Icon className="h-4 w-4" />; })()}
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea placeholder="Resumo curto ou observações" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <div className="flex items-center gap-3">
                  <div className="h-24 w-32 rounded bg-muted overflow-hidden flex items-center justify-center">
                    {file ? (
                      (() => {
                        const isImg = file.type.startsWith("image/");
                        if (isImg) {
                          return <img src={URL.createObjectURL(file)} alt="Pré-visualização" className="h-full w-full object-cover" />;
                        }
                        const Icon = categoryIcon(category);
                        return <Icon className="h-5 w-5 text-muted-foreground" />;
                      })()
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <FileButton label="Escolher arquivo" onSelected={(file) => setFile(file)} />
                </div>
                <p className="text-xs text-muted-foreground">Imagens, vídeos, documentos ou áudios. Tamanho máximo conforme seu plano.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Público no site</Label>
                <div className="flex items-center gap-2">
                  <Checkbox checked={isPublic} onCheckedChange={(c) => setIsPublic(Boolean(c))} />
                  <span className="text-sm text-muted-foreground">Se marcado, adiciona esta mídia à seção Galeria (somente imagens).</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="cancel" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button onClick={uploadAndSave} disabled={uploading}>{uploading ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
