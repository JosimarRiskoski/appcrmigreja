import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string;
  };
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {event.title}
        </h4>
        {event.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {event.location}
          </p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {formatEventDate(event.event_date)} · {formatEventTime(event.event_date)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs mt-2"
          onClick={() => navigate("/eventos")}
        >
          Ver detalhes
        </Button>
      </div>
    </div>
  );
}
