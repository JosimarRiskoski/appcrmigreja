import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, Video, FileText, Music, Link as LinkIcon, Download } from "lucide-react";

type MediaCategory = "imagens" | "videos" | "documentos" | "audios" | "outros";

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  category: MediaCategory;
  public_url: string | null;
  storage_path?: string | null;
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

export default function MidiaShare() {
  const { share_id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("media_library")
          .select("id, title, description, category, public_url, storage_path")
          .eq("share_id", share_id as string)
          .single();
        setItem((data || null) as MediaItem | null);
      } finally {
        setLoading(false);
      }
    })();
  }, [share_id]);

  const handleDownload = useCallback(async () => {
    if (!item) return;
    setDownloading(true);
    try {
      const ext = (() => {
        const parts = (item.storage_path || "").split(".");
        return parts.length > 1 ? parts[parts.length - 1] : "";
      })();
      const filename = `${(item.title || "midia").replace(/\s+/g, "_")}${ext ? `.${ext}` : ""}`;

      if (item.storage_path) {
        const { data } = await supabase.storage.from("media").download(item.storage_path);
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }
      }
      if (item.public_url) {
        const resp = await fetch(item.public_url);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  }, [item]);

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Mídia não encontrada</p>
          <p className="text-muted-foreground">Verifique se o link está correto</p>
        </div>
      </div>
    );
  }

  const Icon = categoryIcon(item.category);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-muted/30 to-transparent">
      <Card className="max-w-3xl w-full overflow-hidden">
        <CardHeader className="border-b bg-card/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div className="space-y-1">
                <CardTitle className="text-xl break-words">{item.title}</CardTitle>
                {item.description && (
                  <CardDescription className="whitespace-pre-line">{item.description}</CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden rounded-md">
            {item.category === "imagens" && item.public_url ? (
              <img src={item.public_url} alt={item.title} className="h-full w-full object-contain" />
            ) : item.category === "videos" && item.public_url ? (
              <video src={item.public_url} controls className="h-full w-full" />
            ) : item.category === "audios" && item.public_url ? (
              <audio src={item.public_url} controls className="w-full" />
            ) : item.public_url ? (
              <a href={item.public_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                <LinkIcon className="h-5 w-5" /> Visualizar em nova guia
              </a>
            ) : (
              <Icon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3 px-4 pt-4 pb-4">
          <div className="flex items-center gap-2">
            {item.public_url && (
              <a href={item.public_url} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" /> Visualizar em nova guia
                </Button>
              </a>
            )}
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Baixar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
