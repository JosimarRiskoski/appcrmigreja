import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function RecentActivitiesWidget() {
  // Placeholder - pode ser implementado futuramente com um log de atividades
  const activities = [
    {
      id: 1,
      text: "Sistema iniciado com sucesso",
      time: "Agora",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="text-sm">
              <p className="text-foreground">• {activity.text}</p>
              <p className="text-muted-foreground text-xs ml-3 mt-1">
                {activity.time}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
