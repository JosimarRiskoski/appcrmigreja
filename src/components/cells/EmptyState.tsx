import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";

interface EmptyStateProps {
  hasSearch: boolean;
  onAddClick: () => void;
}

export function EmptyState({ hasSearch, onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Home className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {hasSearch ? "Nenhuma célula encontrada" : "Nenhuma célula cadastrada"}
      </h3>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {hasSearch
          ? "Tente ajustar os filtros de busca para encontrar o que procura"
          : "Crie sua primeira célula para começar a organizar os membros em grupos pequenos"}
      </p>
      {!hasSearch && (
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Célula
        </Button>
      )}
    </div>
  );
}
