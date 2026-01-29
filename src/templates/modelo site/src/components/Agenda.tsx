import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Agenda = ({ eventos }: { eventos?: { data: string; mes: string; titulo: string; horario: string; local: string; destaque: boolean }[] }) => {
  const data = Array.isArray(eventos) ? eventos : [];
  if (data.length === 0) return null;
  return (
    <section id="agenda" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Programação
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Fique por dentro dos<br />próximos eventos
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((evento, index) => (
            <Card 
              key={index} 
              className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer group ${
                evento.destaque ? "border-primary border-2" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className={`p-4 text-center ${evento.destaque ? "bg-primary" : "bg-muted"}`}>
                  <span className={`text-4xl font-bold ${evento.destaque ? "text-primary-foreground" : "text-foreground"}`}>
                    {evento.data}
                  </span>
                  <p className={`text-sm font-medium ${evento.destaque ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {evento.mes}
                  </p>
                </div>
                <div className="p-5">
                  {evento.destaque && (
                    <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded mb-2">
                      DESTAQUE
                    </span>
                  )}
                  <h3 className="font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {evento.titulo}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{evento.horario}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{evento.local}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Agenda;
