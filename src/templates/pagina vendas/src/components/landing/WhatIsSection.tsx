import { Database, Globe, Shield, Zap } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

const features = [
  {
    icon: Database,
    title: "Sistema completo",
    description: "Gestão de membros, células, ministérios e eventos integrados em uma única plataforma intuitiva.",
  },
  {
    icon: Globe,
    title: "Presença digital",
    description: "Site institucional e ferramentas de comunicação que mantêm sua comunidade conectada.",
  },
  {
    icon: Shield,
    title: "Dados seguros",
    description: "Informações protegidas com os mais altos padrões de segurança e privacidade.",
  },
  {
    icon: Zap,
    title: "Automação inteligente",
    description: "Reduza tarefas manuais com relatórios automáticos e notificações programadas.",
  },
];

export function WhatIsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            O que é o <span className="text-gradient">GraceHub</span>?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            GraceHub é o sistema de gestão que sua igreja precisa para operar com 
            organização, eficiência e profissionalismo no mundo digital.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-soft hover:shadow-card transition-all duration-300 h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 shadow-card group-hover:scale-105 transition-transform">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
