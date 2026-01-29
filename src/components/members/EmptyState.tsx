import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";

interface EmptyStateProps {
  searchQuery?: string;
  onAddMember: () => void;
  buttonLabel?: string;
}

export function EmptyState({ searchQuery, onAddMember, buttonLabel }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum membro encontrado</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Não encontramos membros com o termo "{searchQuery}". Tente buscar por
          outro nome, email ou telefone.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Button onClick={onAddMember} size="lg">
        <UserPlus className="mr-2 h-5 w-5" />
        {buttonLabel || "Adicionar Primeiro Membro"}
      </Button>

      
    </div>
  );
}
