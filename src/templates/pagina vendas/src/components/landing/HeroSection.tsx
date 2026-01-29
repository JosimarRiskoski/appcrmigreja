import { Button } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/sistema.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-soft mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Gestão moderna para igrejas modernas
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Organize sua igreja em{" "}
            <span className="text-gradient">um só lugar</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            GraceHub centraliza membros, eventos, comunicação e presença digital.
            Mais organização, menos trabalho manual.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-3 flex justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Começar gratuitamente
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Social proof hint */}
          <p className="animate-fade-up-delay-4 mt-8 text-sm text-muted-foreground">
            Sem cartão de crédito • Configuração em minutos
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="animate-fade-up-delay-4 mt-20 relative">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-3xl transform scale-95" />
            <div className="relative">
              <img
                src={heroImage}
                alt="Dashboard GraceHub"
                className="w-full rounded-[30px] border border-border shadow-elevated"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
