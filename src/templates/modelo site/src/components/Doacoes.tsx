import { Heart, Users, BookOpen, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const defaultCausas = [
  {
    icon: Users,
    titulo: "Ação Social",
    descricao: "Apoie famílias em situação de vulnerabilidade com cestas básicas e assistência.",
  },
  {
    icon: BookOpen,
    titulo: "Missões",
    descricao: "Contribua para levar a palavra de Deus a comunidades distantes.",
  },
  {
    icon: Home,
    titulo: "Infraestrutura",
    descricao: "Ajude na manutenção e melhorias do nosso templo.",
  },
];

type Causa = { icon?: "users" | "book" | "home"; titulo: string; descricao: string };
const Doacoes = ({ title, subtitle, ctaText, pixKey, bankInfo, causas }: { title?: string; subtitle?: string; ctaText?: string; pixKey?: string; bankInfo?: { banco?: string; agencia?: string; conta?: string; cnpj?: string }; causas?: Causa[] }) => {
  return (
    <section id="doacoes" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Heart className="h-5 w-5" />
              <span className="font-semibold text-sm">Faça sua contribuição</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {title || "Sua colaboração é muito importante para o avanço do reino."}
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8">
              {subtitle || "A igreja está empenhada em muitas frentes sociais. Honre o Senhor com generosidade e seja um agente de transformação! Conheça as formas de contribuir:"}
            </p>

            <div className="space-y-4 mb-8">
              {((causas && causas.length) ? causas : defaultCausas).map((causa, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      {(causa.icon === "book" ? <BookOpen className="h-6 w-6 text-primary" /> : causa.icon === "home" ? <Home className="h-6 w-6 text-primary" /> : causa.icon === "users" ? <Users className="h-6 w-6 text-primary" /> : <Users className="h-6 w-6 text-primary" />)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{causa.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{causa.descricao}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button size="lg" className="gap-2">
              {ctaText || "Quero Contribuir"} <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Content - Donation Card */}
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Formas de Contribuição</h3>
              
              <div className="space-y-6">
                <div className="bg-primary-foreground/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">PIX</h4>
                  <p className="text-primary-foreground/80 text-sm mb-2">Chave PIX:</p>
                  <code className="bg-primary-foreground/20 px-3 py-2 rounded text-sm block">
                    {pixKey || "igreja@vidanova.com.br"}
                  </code>
                </div>

                <div className="bg-primary-foreground/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Transferência Bancária</h4>
                  <div className="text-primary-foreground/80 text-sm space-y-1">
                    <p>Banco: {bankInfo?.banco || "001 - Banco do Brasil"}</p>
                    <p>Agência: {bankInfo?.agencia || "1234-5"}</p>
                    <p>Conta: {bankInfo?.conta || "12345-6"}</p>
                    <p>CNPJ: {bankInfo?.cnpj || "00.000.000/0001-00"}</p>
                  </div>
                </div>

                <div className="bg-primary-foreground/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Presencial</h4>
                  <p className="text-primary-foreground/80 text-sm">
                    Você também pode contribuir durante os cultos através dos envelopes de oferta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Doacoes;
