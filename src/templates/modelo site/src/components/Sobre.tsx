import { Users, Heart, BookOpen } from "lucide-react";

type Stat = { icon: "users" | "heart" | "book"; value: string; label: string };
const Sobre = ({ title, subtitle, paragraphs, stats }: { title?: string; subtitle?: string; paragraphs?: string[]; stats?: Stat[] }) => {
  return (
    <section id="sobre" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Nossa História
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-8">
            {title || "Sobre a Igreja Vida Nova"}
          </h2>

          {((paragraphs && paragraphs.length) ? paragraphs : [
            "Fundada há mais de 30 anos, a Igreja Vida Nova nasceu do sonho de criar uma comunidade de fé onde todos pudessem encontrar amor, acolhimento e propósito. Nossa missão é compartilhar o amor de Cristo e transformar vidas através da Palavra de Deus.",
            "Hoje somos uma família com milhares de membros, unidos pelo mesmo propósito: servir a Deus e ao próximo. Convidamos você a fazer parte dessa história!",
          ]).map((p, i) => (
            <p key={i} className={`text-muted-foreground text-lg leading-relaxed ${i === 0 ? "mb-8" : "mb-12"}`}>
              {p}
            </p>
          ))}

          <div className="grid md:grid-cols-3 gap-8">
            {((stats && stats.length) ? stats : [
              { icon: "users", value: "5.000+", label: "Membros" },
              { icon: "heart", value: "30+", label: "Anos de História" },
              { icon: "book", value: "50+", label: "Grupos de Estudo" },
            ]).map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {s.icon === "users" ? <Users className="h-8 w-8 text-primary" /> : s.icon === "heart" ? <Heart className="h-8 w-8 text-primary" /> : <BookOpen className="h-8 w-8 text-primary" />}
                </div>
                <h3 className="text-3xl font-bold text-foreground">{s.value}</h3>
                <p className="text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sobre;
