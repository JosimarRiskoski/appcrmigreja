import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Cake, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BirthdayCardProps {
  member: {
    id: string;
    full_name: string;
    birth_date: string;
    photo_url: string | null;
    phone?: string | null;
  };
}

export function BirthdayCard({ member }: BirthdayCardProps) {
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthDate = (birthDate: string) => {
    const date = new Date(birthDate);
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  };

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

  const getUrgencyStyle = (daysUntil: number) => {
    if (daysUntil === 0) {
      return {
        badge: "Hoje! 🎉",
        badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        cardBorder: "border-red-300 dark:border-red-700",
        cardBg: "bg-red-50/50 dark:bg-red-900/10",
      };
    } else if (daysUntil === 1) {
      return {
        badge: "Amanhã 🎈",
        badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        cardBorder: "border-orange-300 dark:border-orange-700",
        cardBg: "bg-orange-50/50 dark:bg-orange-900/10",
      };
    } else if (daysUntil <= 3) {
      return {
        badge: `Em ${daysUntil} dias 🎁`,
        badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        cardBorder: "border-yellow-300 dark:border-yellow-700",
        cardBg: "bg-yellow-50/50 dark:bg-yellow-900/10",
      };
    } else if (daysUntil <= 7) {
      return {
        badge: `Em ${daysUntil} dias`,
        badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        cardBorder: "border-blue-300 dark:border-blue-700",
        cardBg: "bg-blue-50/50 dark:bg-blue-900/10",
      };
    } else {
      return {
        badge: `Em ${daysUntil} dias`,
        badgeColor: "bg-muted text-muted-foreground",
        cardBorder: "border-border",
        cardBg: "bg-card",
      };
    }
  };

  const handleSendMessage = () => {
    if (!member.phone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Este membro não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    const age = calculateAge(member.birth_date);
    const firstName = member.full_name.split(' ')[0];
    const message = encodeURIComponent(
      `🎉 Feliz aniversário, ${firstName}! 🎂\n\n` +
      `Que seus ${age} anos sejam repletos de bênçãos! 🙏✨`
    );
    
    const phoneNumber = member.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank');
  };

  const age = calculateAge(member.birth_date);
  const daysUntil = calculateDaysUntilBirthday(member.birth_date);
  const urgencyStyle = getUrgencyStyle(daysUntil);

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-md",
      urgencyStyle.cardBg,
      urgencyStyle.cardBorder
    )}>
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.photo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {member.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        {daysUntil <= 3 && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {daysUntil === 0 ? '🎉' : daysUntil}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-sm leading-tight">
            {member.full_name}
          </p>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium",
            urgencyStyle.badgeColor
          )}>
            {urgencyStyle.badge}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Cake className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatBirthDate(member.birth_date)} ({age} anos)</span>
        </p>
        
        {daysUntil <= 7 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 mt-1.5 text-xs"
            onClick={handleSendMessage}
          >
            <Phone className="h-3 w-3 mr-1" />
            Enviar mensagem
          </Button>
        )}
      </div>
    </div>
  );
}
