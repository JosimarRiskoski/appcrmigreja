import { Button } from "@/components/ui/button";
import { Users, Search, Plus } from "lucide-react";

interface EmptyStateProps {
  searchQuery?: string;
  onAddMinistry: () => void;
}

export function EmptyState({ searchQuery, onAddMinistry }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum ministério encontrado</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Não encontramos ministérios com o termo "{searchQuery}". Tente buscar por
          outro nome ou descrição.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-primary/10 p-6 mb-4">
        <Users className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum ministério cadastrado</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Comece criando os ministérios da sua igreja. Organize seus membros
        por áreas de atuação e gerencie melhor sua comunidade.
      </p>
      <Button onClick={onAddMinistry} size="lg">
        <Plus className="mr-2 h-5 w-5" />
        Criar Primeiro Ministério
      </Button>

      
    </div>
  );
}
