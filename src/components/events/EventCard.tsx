import { Calendar, MapPin, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Event, STATUS_BADGES, LayoutType } from "@/types/event";

interface EventCardProps {
  event: Event;
  layout: LayoutType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EventCard = ({ event, layout, onEdit, onDelete }: EventCardProps) => {
  const statusInfo = STATUS_BADGES[event.status];
  
  const cardClasses = cn(
    "border border-border rounded-lg transition-all duration-200",
    event.status === 'past' ? "bg-red-50" : "bg-card",
    event.status === 'past' ? "opacity-90" : "hover:shadow-lg hover:-translate-y-1",
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
  const isPast = event.status === 'past';

  return (
    <div className={cardClasses}>
      {/* Header com título e ações */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={titleClasses}>{event.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete(event.id)}
            title="Excluir evento"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {layout !== 'compact' && <div className="border-t border-border mb-3" />}

      {/* Informações do evento */}
      <div className="space-y-2">
        <div className={cn("flex items-center gap-2", textClasses)}>
          <Calendar className="shrink-0" size={iconSize} />
          <span>{event.date} às {event.time}</span>
        </div>
        
        <div className={cn("flex items-center gap-2", textClasses)}>
          <MapPin className="shrink-0" size={iconSize} />
          <span>{event.location}</span>
        </div>
        
        <div className={cn("flex items-center gap-2", textClasses)}>
          <Users className="shrink-0" size={iconSize} />
          <span>
            {event.type && `${event.type} · `}
            {event.attendees} {event.attendees === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>
      </div>

      {/* Badge de status */}
      <div className="mt-3">
        <Badge className={cn("text-xs font-medium", statusInfo.color)}>
          {statusInfo.icon} {statusInfo.text}
        </Badge>
      </div>

      {/* Botões de ação (apenas em layouts maiores) */}
      {layout === 'medium' && !isPast && (
        <Button
          variant="outline"
          className="w-full mt-3 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => onEdit(event.id)}
        >
          Ver Detalhes
        </Button>
      )}

      {layout === 'spaced' && !isPast && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => onEdit(event.id)}
          >
            Ver Detalhes
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-primary hover:bg-primary-hover"
          >
            Check-in
          </Button>
        </div>
      )}
    </div>
  );
};
