import { 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Globe, 
  Bell 
} from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

const benefits = [
  {
    icon: Users,
    title: "Gestão de Membros",
    description: "Cadastro completo com histórico, aniversários, ministérios e células vinculadas.",
  },
  {
    icon: Calendar,
    title: "Agenda de Eventos",
    description: "Organize cultos, reuniões e eventos especiais com escalas automáticas.",
  },
  {
    icon: MessageSquare,
    title: "Comunicação Integrada",
    description: "Envie avisos, convites e notificações por múltiplos canais.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    description: "Acompanhe presença, crescimento e engajamento em tempo real.",
  },
  {
    icon: Globe,
    title: "Site Institucional",
    description: "Presença digital profissional para sua igreja, sempre atualizada.",
  },
  {
    icon: Bell,
    title: "Notificações Automáticas",
    description: "Lembretes de eventos, aniversários e tarefas para toda a equipe.",
  },
];

export function BenefitsSection() {
  return (
    <section id="funcionalidades" className="py-24 gradient-hero scroll-mt-24">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Tudo que sua igreja precisa
          </h2>
          <p className="text-lg text-muted-foreground">
            Funcionalidades pensadas para simplificar a gestão e fortalecer sua comunidade.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <StaggerItem key={benefit.title}>
              <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
