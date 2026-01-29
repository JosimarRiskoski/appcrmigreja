import { FileX, Calendar, Users, Clock, AlertCircle } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

const problems = [
  {
    icon: FileX,
    title: "Planilhas dispersas",
    description: "Dados de membros espalhados em diferentes arquivos e sistemas.",
  },
  {
    icon: Calendar,
    title: "Eventos desorganizados",
    description: "Dificuldade para coordenar escalas e comunicar alterações.",
  },
  {
    icon: Users,
    title: "Comunicação fragmentada",
    description: "Mensagens perdidas entre WhatsApp, e-mail e avisos presenciais.",
  },
  {
    icon: Clock,
    title: "Tempo desperdiçado",
    description: "Horas gastas em tarefas administrativas repetitivas.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive mb-6">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">O problema</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Gestão manual gera{" "}
            <span className="text-destructive">caos e retrabalho</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Sem um sistema integrado, sua equipe perde tempo e informações importantes se perdem no caminho.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {problems.map((problem) => (
            <StaggerItem key={problem.title}>
              <div className="group p-6 rounded-2xl bg-card border border-border hover:border-destructive/30 shadow-soft hover:shadow-card transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
