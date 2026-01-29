import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Church, LayoutGrid, Smartphone, Users } from "lucide-react";

const Vendas = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-full">
            <Church className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Organize sua igreja com o GraceHub
          </h1>
          <p className="text-lg text-muted-foreground">
            Um sistema simples e completo para centralizar pessoas, eventos, comunicação e seu site em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="px-6">
              <a href="/auth?mode=signup">Testar grátis por 7 dias</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-6">
              <a href="/auth?mode=login">Entrar na minha conta</a>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Sem cartão de crédito • O teste começa ao criar sua conta
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-16 pb-20">
        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Problemas comuns do dia a dia</h2>
          <Card>
            <CardContent className="p-6 grid gap-3 md:grid-cols-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Planilhas espalhadas e difíceis de manter</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Conversas em vários grupos de WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Falta de controle de eventos e presença</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Site desatualizado e sem informações claras</li>
              </ul>
              <div className="text-muted-foreground">
                Esses desafios consomem tempo e energia dos líderes e administradores. O GraceHub nasce para simplificar e organizar.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Tudo em um só lugar</h2>
          <p className="text-muted-foreground mb-4">
            O GraceHub centraliza gestão de pessoas, eventos, comunicação, site e, no plano premium, um app para membros.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-6 space-y-2"><Users className="h-6 w-6 text-primary" /><div className="font-medium">Pessoas</div><div className="text-sm text-muted-foreground">Organize membros e visitantes com clareza.</div></CardContent></Card>
            <Card><CardContent className="p-6 space-y-2"><LayoutGrid className="h-6 w-6 text-primary" /><div className="font-medium">Eventos</div><div className="text-sm text-muted-foreground">Controle programação e presença em cultos.</div></CardContent></Card>
            <Card><CardContent className="p-6 space-y-2"><Smartphone className="h-6 w-6 text-primary" /><div className="font-medium">App para membros</div><div className="text-sm text-muted-foreground">Disponível no plano premium.</div></CardContent></Card>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">O que é o GraceHub</h2>
          <p className="text-muted-foreground">É um sistema de gestão para igrejas, feito para pastores, líderes e administradores que precisam de simplicidade e organização.</p>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Como funciona em 3 passos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-6"><div className="font-medium mb-2">1. Criar conta</div><div className="text-sm text-muted-foreground">Leva poucos minutos.</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="font-medium mb-2">2. Onboarding da igreja</div><div className="text-sm text-muted-foreground">Cadastre sua igreja com apoio do passo a passo.</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="font-medium mb-2">3. Começar a usar</div><div className="text-sm text-muted-foreground">O trial de 7 dias inicia automaticamente.</div></CardContent></Card>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Benefícios principais</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5" /> Organização de pessoas</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5" /> Controle de eventos e presença</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5" /> Comunicação centralizada</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5" /> Site sempre atualizado</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5" /> App para membros (plano premium)</li>
          </ul>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Diferenciais</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Feito exclusivamente para igrejas</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Simples, intuitivo e escalável</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Painel, site e app integrados</li>
          </ul>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Planos e Trial</h2>
          <p className="text-muted-foreground">
            Após os 7 dias de teste completo, você pode escolher um plano pago. Não exibimos preços aqui para manter o foco na avaliação.
          </p>
        </section>

        <section className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Comece agora</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="px-6">
              <a href="/auth?mode=signup">Testar grátis por 7 dias</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-6">
              <a href="/auth?mode=login">Entrar na minha conta</a>
            </Button>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-4">
            <Card><CardContent className="p-6"><div className="font-medium mb-1">O que acontece após criar conta?</div><div className="text-sm text-muted-foreground">Você é direcionado para o onboarding e cadastra sua igreja.</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="font-medium mb-1">O trial é automático?</div><div className="text-sm text-muted-foreground">Sim, seu teste de 7 dias começa assim que a conta é criada.</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="font-medium mb-1">Posso cancelar?</div><div className="text-sm text-muted-foreground">Sim, a qualquer momento durante o período de teste.</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="font-medium mb-1">Já tenho conta, como entro?</div><div className="text-sm text-muted-foreground">Use o botão “Entrar na minha conta” acima ou acesse /auth.</div></CardContent></Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Vendas;
