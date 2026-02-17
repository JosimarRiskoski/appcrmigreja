import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import FileButton from "@/components/ui/FileButton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter as ModalFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Image as ImageIcon, Search, Plus, ExternalLink, Edit2, Trash2, Book, BookOpen, BookMarked, GraduationCap, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { LayoutType } from "@/types/event";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReadingTip = {
  id: string;
  church_id: string;
  title: string;
  author: string;
  category: "livro" | "devocional" | "estudo" | "biblia";
  description: string | null;
  cover_url: string | null;
  buy_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const CATEGORIES = [
  { value: "livro", label: "Livro" },
  { value: "devocional", label: "Devocional" },
  { value: "estudo", label: "Estudo" },
  { value: "biblia", label: "Bíblia" },
] as const;

export default function DicasLeitura() {
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const tipsQuery = useQuery<ReadingTip[]>({
    queryKey: ["reading_tips", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_tips")
        .select("id, church_id, title, author, category, description, cover_url, buy_url, created_at, updated_at")
        .eq("church_id", churchId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReadingTip[];
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<ReadingTip["category"] | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetails, setShowDetails] = useState<ReadingTip | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<ReadingTip["category"]>("livro");
  const [description, setDescription] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingTip, setEditingTip] = useState<ReadingTip | null>(null);
  const LAYOUT_STORAGE_KEY = "graceHubReadingTipsLayoutPreference";
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved as LayoutType) || "medium";
  });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>("newest");

  const filteredTips = useMemo(() => {
    const rows = tipsQuery.data || [];
    return rows.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q);
      const matchesCat = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [tipsQuery.data, searchQuery, filterCategory]);

  const sortedTips = useMemo(() => {
    return [...filteredTips].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [filteredTips, sortOrder]);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setCategory("livro");
    setDescription("");
    setBuyUrl("");
    setCoverFile(null);
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  };

  const gridClasses: Record<LayoutType, string> = {
    compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
    medium: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    spaced: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
  };

  const cardInnerPadding: Record<LayoutType, string> = {
    compact: "p-3",
    medium: "p-4",
    spaced: "p-5",
  };

  const thumbClasses: Record<LayoutType, string> = {
    compact: "h-16 w-12",
    medium: "h-20 w-16",
    spaced: "h-24 w-20",
  };

  const titleClasses: Record<LayoutType, string> = {
    compact: "font-semibold text-sm truncate",
    medium: "font-semibold truncate",
    spaced: "font-semibold text-lg truncate",
  };

  const iconButtonSizeClass: Record<LayoutType, string> = {
    compact: "h-9 w-9",
    medium: "h-9 w-9",
    spaced: "h-10 w-10",
  };

  const iconSizeByLayout: Record<LayoutType, string> = {
    compact: "h-4 w-4",
    medium: "h-4 w-4",
    spaced: "h-4 w-4",
  };

  const badgeBaseByLayout: Record<LayoutType, string> = {
    compact: "text-[10px] px-2 py-0.5",
    medium: "text-xs px-2 py-0.5",
    spaced: "text-sm px-2.5 py-0.5",
  };

  const CATEGORY_BADGES: Record<ReadingTip["category"], string> = {
    livro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    devocional: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    estudo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    biblia: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  const CATEGORY_ICONS: Record<ReadingTip["category"], React.ElementType> = {
    livro: BookMarked,
    devocional: BookOpen,
    estudo: GraduationCap,
    biblia: Book,
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return editingTip?.cover_url ?? null;
    try {
      const filePath = `${churchId}/${crypto.randomUUID()}_${coverFile.name}`;
      const { error: upErr } = await supabase.storage.from("reading_tips").upload(filePath, coverFile, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("reading_tips").getPublicUrl(filePath);
      return data.publicUrl || null;
    } catch (e) {
      toast.error("Falha no upload da capa");
      return editingTip?.cover_url ?? null;
    }
  };

  const handleSaveNew = async () => {
    if (!churchId) return;
    if (!title.trim() || !author.trim()) {
      toast.error("Informe título e autor");
      return;
    }
    try {
      setSaving(true);
      const cover_url = await uploadCover();
      const { error } = await supabase.from("reading_tips").insert({
        church_id: churchId,
        title: title.trim(),
        author: author.trim(),
        category,
        description: description.trim() || null,
        cover_url,
        buy_url: buyUrl.trim() || null,
      });
      if (error) throw error;
      toast.success("Dica criada");
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["reading_tips", churchId] });
    } catch {
      toast.error("Erro ao salvar dica");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTip) return;
    try {
      setSaving(true);
      const cover_url = await uploadCover();
      const { error } = await supabase
        .from("reading_tips")
        .update({
          title: title.trim(),
          author: author.trim(),
          category,
          description: description.trim() || null,
          cover_url,
          buy_url: buyUrl.trim() || null,
        })
        .eq("id", editingTip.id);
      if (error) throw error;
      toast.success("Dica atualizada");
      setShowEditModal(false);
      setEditingTip(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["reading_tips", churchId] });
    } catch {
      toast.error("Erro ao atualizar dica");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tip: ReadingTip) => {
    try {
      const { error } = await supabase.from("reading_tips").delete().eq("id", tip.id);
      if (error) throw error;
      toast.success("Dica excluída");
      queryClient.invalidateQueries({ queryKey: ["reading_tips", churchId] });
    } catch {
      toast.error("Erro ao excluir dica");
    }
  };

  const openEdit = (tip: ReadingTip) => {
    setEditingTip(tip);
    setTitle(tip.title);
    setAuthor(tip.author);
    setCategory(tip.category);
    setDescription(tip.description || "");
    setBuyUrl(tip.buy_url || "");
    setCoverFile(null);
    setShowEditModal(true);
  };

  if (churchLoading || tipsQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (<div key={i} className="h-56 bg-muted rounded" />))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dicas de Leitura</h1>
            <p className="text-muted-foreground">Recomendações espirituais e materiais de estudo para os membros.</p>
          </div>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Dica
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou autor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ReadingTip["category"] | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LayoutSelector selectedLayout={selectedLayout} onLayoutChange={handleLayoutChange} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {sortedTips.length} {sortedTips.length === 1 ? "dica" : "dicas"}
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

      {filteredTips.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Nenhuma dica cadastrada</div>
              <Button variant="outline" onClick={() => { resetForm(); setShowAddModal(true); }}>Adicionar Dica</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedTips.map((t) => (
            <Card key={t.id} className="overflow-hidden hover:shadow-md transition-all">
              <div className={`flex gap-3 ${cardInnerPadding[selectedLayout]}`}>
                {selectedLayout !== 'compact' && (
                  <div className={`${thumbClasses[selectedLayout]} rounded bg-muted overflow-hidden flex items-center justify-center`}>
                    {t.cover_url ? (
                      <img src={t.cover_url} alt={t.title} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`${titleClasses[selectedLayout]} whitespace-nowrap`}>{t.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.author}</div>
                    </div>
                    <Badge className={`${badgeBaseByLayout[selectedLayout]} shrink-0 ${CATEGORY_BADGES[t.category]} inline-flex items-center gap-1`}>
                      {(() => {
                        const Icon = CATEGORY_ICONS[t.category];
                        return <Icon className={selectedLayout === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />;
                      })()}
                      {CATEGORIES.find(c => c.value === t.category)?.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={selectedLayout === 'spaced' ? 'w-full' : ''}
                      onClick={() => setShowDetails(t)}
                    >
                      Ver Detalhes
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={iconButtonSizeClass[selectedLayout]}
                          onClick={() => openEdit(t)}
                        >
                          <Edit2 className={iconSizeByLayout[selectedLayout]} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`hover:bg-destructive hover:text-destructive-foreground ${iconButtonSizeClass[selectedLayout]}`}
                          onClick={() => handleDelete(t)}
                        >
                          <Trash2 className={iconSizeByLayout[selectedLayout]} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Dica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Ex.: Bíblia Infantil - Letras Grandes" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Label>Autor</Label>
                <Input placeholder="Ex.: João da Silva" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ReadingTip["category"]) }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="inline-flex items-center gap-2">
                          {(() => {
                            const Icon = CATEGORY_ICONS[c.value as ReadingTip["category"]];
                            return <Icon className="h-4 w-4" />;
                          })()}
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link externo (opcional)</Label>
                <Input placeholder="URL para comprar/acessar" value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground">Ex.: link da loja, repositório ou página oficial.</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição (breve)</Label>
                <Textarea placeholder="Resumo curto ou observações" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capa</Label>
              <div className="flex items-center gap-3">
                <div className="h-24 w-20 rounded bg-muted overflow-hidden flex items-center justify-center">
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} alt="Pré-visualização" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <FileButton label="Escolher arquivo" accept="image/*" onSelected={(file) => setCoverFile(file)} />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: JPG, PNG. Opcional.</p>
            </div>

            <ModalFooter>
              <Button variant="cancel" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveNew} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </ModalFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Dica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                <Label>Autor</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ReadingTip["category"]) }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="inline-flex items-center gap-2">
                          {(() => {
                            const Icon = CATEGORY_ICONS[c.value as ReadingTip["category"]];
                            return <Icon className="h-4 w-4" />;
                          })()}
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link externo (opcional)</Label>
                <Input value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição (breve)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capa</Label>
              <div className="flex items-center gap-3">
                <div className="h-24 w-20 rounded bg-muted overflow-hidden flex items-center justify-center">
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} alt="Pré-visualização" className="h-full w-full object-cover" />
                  ) : editingTip?.cover_url ? (
                    <img src={editingTip.cover_url} alt="Capa" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <FileButton label="Escolher arquivo" accept="image/*" onSelected={(file) => setCoverFile(file)} />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: JPG, PNG. Opcional.</p>
            </div>

            <ModalFooter>
              <Button variant="cancel" onClick={() => setShowEditModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </ModalFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDetails} onOpenChange={(o) => !o && setShowDetails(null)}>
        <DialogContent className="sm:max-w-lg">
          {showDetails && (
            <div className="space-y-4">
              <div className="w-full h-56 bg-muted rounded overflow-hidden flex items-center justify-center">
                {showDetails.cover_url ? (
                  <img src={showDetails.cover_url} alt={showDetails.title} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xl font-bold break-words">{showDetails.title}</div>
                  <div className="text-sm text-muted-foreground">{showDetails.author}</div>
                </div>
                <Badge className={`${badgeBaseByLayout.medium} shrink-0 ${CATEGORY_BADGES[showDetails.category]} inline-flex items-center gap-1`}>
                  {(() => {
                    const Icon = CATEGORY_ICONS[showDetails.category];
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {CATEGORIES.find(c => c.value === showDetails.category)?.label}
                </Badge>
              </div>
              {showDetails.description && (
                <div className="text-sm">{showDetails.description}</div>
              )}
              {showDetails.buy_url && (
                <Button asChild>
                  <a href={showDetails.buy_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Comprar / Acessar
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
