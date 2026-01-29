import { Check } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

const differentials = [
  {
    title: "Feito para igrejas",
    description: "Desenvolvido especificamente para as necessidades reais de comunidades de fé.",
  },
  {
    title: "Interface intuitiva",
    description: "Design moderno e fácil de usar, mesmo para quem não é familiarizado com tecnologia.",
  },
  {
    title: "Suporte humanizado",
    description: "Equipe dedicada para ajudar em cada etapa da sua jornada.",
  },
  {
    title: "Atualizações constantes",
    description: "Novas funcionalidades e melhorias baseadas no feedback da comunidade.",
  },
  {
    title: "Escalável",
    description: "Cresce junto com sua igreja, de pequenos grupos a grandes congregações.",
  },
  {
    title: "Integração completa",
    description: "Todos os módulos conectados para uma gestão verdadeiramente unificada.",
  },
];

export function DifferentialsSection() {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Por que escolher o{" "}
                <span className="text-gradient">GraceHub</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Mais do que um software, somos parceiros na missão de organizar 
                e fortalecer sua comunidade.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 gap-4">
              {differentials.map((diff) => (
                <StaggerItem key={diff.title}>
                  <div className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-card hover:border-primary/30 transition-all duration-300 h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{diff.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {diff.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
