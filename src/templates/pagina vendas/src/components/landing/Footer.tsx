import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const quickLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
];

export function Footer() {
  return (
    <footer className="bg-foreground dark:bg-background text-background dark:text-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 56 56" aria-label="CVG">
                <defs>
                  <linearGradient id="cvgGrad2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4F46E5"/>
                    <stop offset="100%" stopColor="#0EA5E9"/>
                  </linearGradient>
                </defs>
                <rect width="56" height="56" rx="14" fill="url(#cvgGrad2)" />
                <rect x="26" y="12" width="4" height="32" rx="2" fill="#ffffff"/>
                <rect x="12" y="26" width="32" height="4" rx="2" fill="#ffffff"/>
              </svg>
              <span className="text-xl font-bold">GraceHub</span>
            </div>
            <p className="text-sm text-background/70 dark:text-muted-foreground">Sistema moderno de gestão para igrejas.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                asChild
                className="bg-transparent border-background/30 text-background hover:bg-background/15 hover:border-background/40 hover:text-background dark:bg-transparent dark:border-border dark:text-foreground dark:hover:bg-muted/30 dark:hover:text-foreground"
              >
                <Link to="/auth?mode=login">Entrar</Link>
              </Button>
              <Button variant="gradient" asChild className="group hover:-translate-y-0.5">
                <Link to="/auth?mode=signup">
                  Começar gratuitamente
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 md:justify-self-center">
            {quickLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-background/70 dark:text-muted-foreground hover:text-background dark:hover:text-foreground">
                {l.label}
              </a>
            ))}
          </div>

          <div className="md:justify-self-end text-sm text-background/60 dark:text-muted-foreground">
            <p>© 2024 GraceHub</p>
            <p>Sistema de gestão para igrejas</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
