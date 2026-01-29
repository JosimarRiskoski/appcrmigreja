import { Button } from "../ui/button";
import { ArrowRight, Check } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const planFeatures = [
  "Gestão completa de membros",
  "Agenda de eventos ilimitada",
  "Comunicação integrada",
  "Relatórios e dashboards",
  "Site institucional",
  "Suporte prioritário",
];

export function PlansSection() {
  return (
    <section id="planos" className="py-24 bg-background scroll-mt-24">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Planos para cada realidade
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para o tamanho e necessidades da sua igreja.
          </p>
        </AnimatedSection>

        <motion.div 
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="relative p-8 rounded-3xl bg-card border border-primary/30 shadow-elevated">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                Mais popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Plano Completo</h3>
              <p className="text-muted-foreground">
                Tudo que você precisa para uma gestão profissional
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {planFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="xl" className="w-full" asChild>
              <Link to="/auth?mode=signup">
                Começar agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Teste grátis por 7 dias • Sem compromisso
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
