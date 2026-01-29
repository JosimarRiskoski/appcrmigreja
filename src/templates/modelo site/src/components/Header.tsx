import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = ({ siteTitle, navLinks: navLinksProp, logoUrl }: { siteTitle?: string; navLinks?: { href: string; label: string }[]; logoUrl?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = navLinksProp && navLinksProp.length ? navLinksProp : [
    { href: "#inicio", label: "Início" },
    { href: "#transmissoes", label: "Transmissões" },
    { href: "#agenda", label: "Agenda" },
    { href: "#doacoes", label: "Doações" },
    { href: "#galeria", label: "Galeria" },
    { href: "#app", label: "App" },
    { href: "#sobre", label: "Sobre" },
    { href: "#contato", label: "Contato" },
  ];

  const title = siteTitle || "Igreja Vida Nova";
  const initial = (title || "I").charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="#inicio" className="flex items-center gap-2 text-xl font-bold text-primary">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-6 md:h-10 w-auto object-contain" />
            ) : (
              <div className="h-6 w-6 md:h-10 md:w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm">
                {initial}
              </div>
            )}
            <span>{title}</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
