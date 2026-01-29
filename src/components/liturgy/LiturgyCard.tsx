import { Calendar, MapPin, User, BookOpen, Edit2, Trash2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Liturgy, LayoutType, STATUS_BADGES } from "@/types/liturgy";

interface LiturgyCardProps {
  liturgy: Liturgy;
  layout: LayoutType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOrder: (id: string) => void;
}

export const LiturgyCard = ({ liturgy, layout, onEdit, onDelete, onEditOrder }: LiturgyCardProps) => {
  const badge = STATUS_BADGES[liturgy.status];
  
  const cardClasses = cn(
    "bg-card border border-border rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
    layout === 'compact' && "p-3",
    layout === 'medium' && "p-4",
    layout === 'spaced' && "p-5"
  );

  const titleClasses = cn(
    "font-bold text-foreground mb-2",
    layout === 'compact' && "text-sm",
    layout === 'medium' && "text-lg",
    layout === 'spaced' && "text-xl"
  );

  const textClasses = cn(
    "text-muted-foreground",
    layout === 'compact' && "text-xs",
    layout === 'medium' && "text-sm",
    layout === 'spaced' && "text-base"
  );

  const iconSize = layout === 'compact' ? 11 : layout === 'medium' ? 14 : 16;

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between mb-3">
        <h3 className={titleClasses}>{liturgy.title}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => onEdit(liturgy.id)}
            aria-label="Editar programação"
            title="Editar"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => onEditOrder(liturgy.id)}
            aria-label="Editar ordem"
            title="Ordem"
          >
            <ListChecks className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete(liturgy.id)}
            aria-label="Excluir programação"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {layout !== 'compact' && <div className="border-t border-border mb-3" />}

      <div className={cn("space-y-2", layout === 'compact' && "space-y-1")}>
        <div className="flex items-center gap-2">
          <Calendar className="shrink-0" size={iconSize} />
          <span className={textClasses}>
            {liturgy.date} às {liturgy.time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="shrink-0" size={iconSize} />
          <span className={textClasses}>{liturgy.minister}</span>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="shrink-0" size={iconSize} />
          <span className={textClasses}>
            {layout === 'spaced' && 'Tema: '}{liturgy.theme}
          </span>
        </div>

        {layout !== 'compact' && (
          <div className="flex items-center gap-2">
            <MapPin className="shrink-0" size={iconSize} />
            <span className={textClasses}>
              {liturgy.location} · {liturgy.type}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <Badge className={cn("text-xs font-semibold", badge.color)}>
          {layout !== 'compact' && <span className="mr-1">{badge.icon}</span>}
          {badge.text}
        </Badge>
      </div>

      {layout === 'medium' && (
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Ver Detalhes
          </Button>
        </div>
      )}

      {layout === 'spaced' && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Ver Detalhes
          </Button>
          <Button
            variant="outline"
            className="flex-1 hover:bg-muted"
            onClick={() => onEdit(liturgy.id)}
          >
            Editar
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => onEditOrder(liturgy.id)}
          >
            Ordem
          </Button>
        </div>
      )}
    </div>
  );
};
