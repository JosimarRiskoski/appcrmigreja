import { Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const defaultVideos = [
  {
    id: "dQw4w9WgXcQ",
    title: "Culto de Adoração | Domingo",
    description: "Mensagem especial sobre fé e esperança",
    duration: "1:30:00",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Estudo Bíblico | Quarta",
    description: "Série sobre os Salmos",
    duration: "45:00",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Louvor e Adoração",
    description: "Momentos de louvor com nossa equipe",
    duration: "25:00",
  },
];

const Transmissoes = ({ videos, featuredId }: { videos?: { id: string; title: string; description: string; duration: string }[]; featuredId?: string }) => {
  const data = videos && videos.length ? videos : defaultVideos;
  const featured = featuredId || data[0]?.id || "dQw4w9WgXcQ";
  return (
    <section id="transmissoes" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Igreja TV
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Nossas Transmissões
            </h2>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0 gap-2">
            Ver Todos <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Video */}
          <Card className="md:col-span-2 lg:col-span-2 overflow-hidden group">
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${featured}`}
                  title="Transmissão ao vivo"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  AO VIVO
                </span>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Culto Dominical - Ao Vivo
                </h3>
                <p className="text-muted-foreground">
                  Acompanhe nossa transmissão ao vivo todos os domingos às 10h e 18h
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video List */}
          <div className="space-y-4">
            {data.map((video, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="relative w-32 h-24 flex-shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 group-hover:bg-foreground/50 transition-colors">
                        <Play className="h-8 w-8 text-card fill-card" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-foreground/80 text-card text-xs px-1 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="py-3 pr-4">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Transmissoes;
