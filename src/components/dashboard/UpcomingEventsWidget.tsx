import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventCard } from "./EventCard";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpcomingEventsWidgetProps {
  events: Array<{
    id: string;
    title: string;
    event_date: string;
    location: string;
  }>;
}

export function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
  const navigate = useNavigate();
  const displayEvents = events.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum evento próximo
          </p>
        ) : (
          <>
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/eventos")}
            >
              Ver todos os eventos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
