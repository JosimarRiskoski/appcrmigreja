import { UserPlus, Settings, Rocket } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Crie sua conta",
    description: "Cadastro simples e rápido. Em poucos minutos sua igreja está pronta para começar.",
  },
  {
    icon: Settings,
    number: "02",
    title: "Configure seu espaço",
    description: "Personalize ministérios, células e estrutura organizacional conforme sua realidade.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Comece a usar",
    description: "Convide sua equipe e comece a transformar a gestão da sua igreja.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-background scroll-mt-24">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Como funciona
          </h2>
          <p className="text-lg text-muted-foreground">
            Três passos simples para transformar a gestão da sua igreja.
          </p>
        </AnimatedSection>

        <div className="max-w-5xl mx-auto">
          <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
            
            {steps.map((step) => (
              <StaggerItem key={step.title} className="relative text-center">
                <div className="relative z-10 w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-card mb-6">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">{step.number}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
