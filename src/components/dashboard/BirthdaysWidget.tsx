import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BirthdayCard } from "./BirthdayCard";
import { ArrowRight, Cake } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BirthdaysWidgetProps {
  birthdays: Array<{
    id: string;
    full_name: string;
    birth_date: string;
    photo_url: string | null;
    phone?: string | null;
  }>;
}

export function BirthdaysWidget({ birthdays }: BirthdaysWidgetProps) {
  const navigate = useNavigate();

  const calculateDaysUntilBirthday = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const todayBirthdays = birthdays.filter(b => calculateDaysUntilBirthday(b.birth_date) === 0);
  const nextWeekBirthdays = birthdays.filter(b => {
    const days = calculateDaysUntilBirthday(b.birth_date);
    return days > 0 && days <= 7;
  });
  const laterThisMonthBirthdays = birthdays.filter(b => {
    const days = calculateDaysUntilBirthday(b.birth_date);
    return days > 7 && days <= 30;
  });

  const upcomingCount = birthdays.filter(b => calculateDaysUntilBirthday(b.birth_date) <= 7).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cake className="h-5 w-5 text-primary" />
            Próximos Aniversários
          </CardTitle>
          {upcomingCount > 0 && (
            <Badge variant="secondary" className="font-mono">
              {upcomingCount}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Nos próximos 30 dias
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {birthdays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aniversariante nos próximos 30 dias
          </p>
        ) : (
          <>
            {todayBirthdays.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  Hoje
                  <div className="h-px flex-1 bg-border" />
                </h4>
                {todayBirthdays.map((member) => (
                  <BirthdayCard key={member.id} member={member} />
                ))}
              </div>
            )}
            
            {nextWeekBirthdays.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  Próximos 7 dias
                  <div className="h-px flex-1 bg-border" />
                </h4>
                {nextWeekBirthdays.slice(0, 3).map((member) => (
                  <BirthdayCard key={member.id} member={member} />
                ))}
                {nextWeekBirthdays.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {nextWeekBirthdays.length - 3} outro{nextWeekBirthdays.length - 3 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
            
            {laterThisMonthBirthdays.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  Resto do mês
                  <div className="h-px flex-1 bg-border" />
                </h4>
                {laterThisMonthBirthdays.slice(0, 2).map((member) => (
                  <BirthdayCard key={member.id} member={member} />
                ))}
                {laterThisMonthBirthdays.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {laterThisMonthBirthdays.length - 2} outro{laterThisMonthBirthdays.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
            
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => navigate("/aniversariantes")}
            >
              Ver todos os aniversariantes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
