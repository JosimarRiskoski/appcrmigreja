import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasFilters: boolean;
  onCreateEvent: () => void;
}

export const EmptyState = ({ hasFilters, onCreateEvent }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 p-6 bg-muted/50 rounded-full">
        <Calendar className="h-16 w-16 text-muted-foreground" />
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-2">
        {hasFilters ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {hasFilters 
          ? 'Tente ajustar os filtros ou buscar por outros termos'
          : 'Comece criando seu primeiro evento para gerenciar as atividades da igreja'
        }
      </p>

      {!hasFilters && (
        <Button
          size="lg"
          className="bg-primary hover:bg-primary-hover"
          onClick={onCreateEvent}
        >
          <Plus className="h-5 w-5 mr-2" />
          Criar Primeiro Evento
        </Button>
      )}

      
    </div>
  );
};
