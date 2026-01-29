import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Church, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateChurch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const churchName = formData.get("churchName") as string;
    const slug = churchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Create church
      const { data: church, error: churchError } = await supabase
        .from("churches")
        .insert({
          name: churchName,
          slug,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          city: formData.get("city") as string,
          state: formData.get("state") as string,
        })
        .select()
        .single();

      if (churchError) throw churchError;

      // Update profile with church_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ church_id: church.id })
        .eq("id", user.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Igreja criada com sucesso!",
        description: "Seu período de teste de 7 dias começou agora.",
      });

      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar igreja";
      toast({
        title: "Erro ao criar igreja",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-primary rounded-full">
              <Church className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Bem-vindo ao GraceHub!
          </CardTitle>
          <CardDescription className="text-base">
            Vamos configurar sua igreja. Você terá 7 dias de teste gratuito com acesso completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateChurch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="churchName">Nome da Igreja *</Label>
              <Input
                id="churchName"
                name="churchName"
                placeholder="Igreja Batista Central"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contato *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@igreja.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  required
                  onChange={(e) => { e.currentTarget.value = maskPhone(e.currentTarget.value); }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="São Paulo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="SP"
                  required
                  maxLength={2}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">O que você ganha no período de teste:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Acesso completo ao painel administrativo</li>
                <li>✓ Gestão de membros, eventos e ministérios</li>
                <li>✓ 1 modelo de site para sua igreja</li>
                <li>✓ Central de mídia e pedidos de oração</li>
                <li>✓ 7 dias para testar sem compromisso</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Minha Igreja e Começar Teste
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
