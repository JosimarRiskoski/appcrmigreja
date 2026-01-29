import { CheckCircle, Sparkles } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

export function SolutionSection() {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">A solução</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Apresentamos o{" "}
            <span className="text-gradient">GraceHub</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            Uma plataforma completa que transforma a gestão da sua igreja. 
            Tudo conectado, tudo organizado, tudo em um só lugar.
          </p>

          <StaggerContainer className="flex flex-wrap justify-center gap-4">
            {[
              "Centralização total",
              "Fácil de usar",
              "Sempre acessível",
              "Suporte dedicado",
            ].map((item) => (
              <StaggerItem key={item}>
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border shadow-soft">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium">{item}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimatedSection>
      </div>
    </section>
  );
}
