import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { LayoutType } from "@/types/member";
import { Search, Cake, Calendar, Mail, Phone, Gift } from "lucide-react";
 
import { format, differenceInYears, getMonth, getDate, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BirthdayMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string;
  photo_url: string | null;
  age?: number;
  daysUntilBirthday?: number;
  isToday?: boolean;
}

const MESES = [
  { value: 'all', label: 'Todos os meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

export default function Aniversariantes() {
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => 'all');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem("graceHubBirthdaysLayoutPreference");
    return (saved as LayoutType) || "medium";
  });

  useEffect(() => {
    loadBirthdays();
  }, []);

  

  const loadBirthdays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) return;

      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, email, phone, birth_date, photo_url")
        .eq("church_id", profile.church_id)
        .not("birth_date", "is", null)
        .order("full_name");

      if (error) throw error;

      const today = new Date();
      const membersWithAge = (data || []).map((member) => {
        const birthDate = parseISO(member.birth_date);
        const age = differenceInYears(today, birthDate);
        
        const nextBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );
        
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...member,
          age,
          daysUntilBirthday: daysUntil,
          isToday: isToday(nextBirthday),
        };
      });

      membersWithAge.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return (a.daysUntilBirthday || 0) - (b.daysUntilBirthday || 0);
      });

      setMembers(membersWithAge);
    } catch (error) {
      console.error("Erro ao carregar aniversariantes:", error);
      toast.error("Erro ao carregar aniversariantes");
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem("graceHubBirthdaysLayoutPreference", layout);
  };

  const filteredMembers = members.filter((member) => {
    const birthDate = parseISO(member.birth_date);
    const memberMonth = getMonth(birthDate);

    if (selectedMonth !== "all" && memberMonth !== parseInt(selectedMonth)) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return member.full_name.toLowerCase().includes(query);
    }

    return true;
  });

  const gridClasses = {
    compact: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    medium: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    spaced: "grid grid-cols-1 md:grid-cols-2 gap-6",
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cake className="h-8 w-8" />
            Aniversariantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Celebre os aniversários dos membros da sua igreja
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aniversariantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por mês" />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((mes) => (
              <SelectItem key={mes.value} value={mes.value}>
                {mes.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <LayoutSelector
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Cake className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Nenhum aniversariante encontrado
          </h3>
          <p className="text-muted-foreground text-center">
            {searchQuery
              ? "Tente ajustar sua busca"
              : "Não há aniversariantes para o filtro selecionado"}
          </p>
        </div>
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {filteredMembers.map((member) => (
            <BirthdayCard
              key={member.id}
              member={member}
              layout={selectedLayout}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BirthdayCardProps {
  member: BirthdayMember;
  layout: LayoutType;
}

function BirthdayCard({ member, layout }: BirthdayCardProps) {
  const birthDate = parseISO(member.birth_date);
  const formattedDate = format(birthDate, "dd 'de' MMMM", { locale: ptBR });
  
  if (layout === "compact") {
    return (
      <Card className={member.isToday ? "border-primary shadow-lg" : "hover:shadow-md transition-all"}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.photo_url || undefined} />
              <AvatarFallback>
                {member.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate">{member.full_name}</h3>
                {member.isToday && (
                  <Badge className="bg-primary shrink-0">
                    <Gift className="h-3 w-3 mr-1" />
                    Hoje!
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {member.age} anos
                {!member.isToday && ` • ${member.daysUntilBirthday} dias`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (layout === "medium") {
    return (
      <Card className={member.isToday ? "border-primary shadow-lg" : "hover:shadow-md transition-all"}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.photo_url || undefined} />
                <AvatarFallback className="text-lg">
                  {member.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-lg">{member.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {member.age} anos
                </p>
              </div>
            </div>
            
            {member.isToday && (
              <Badge className="bg-primary">
                <Gift className="h-3 w-3 mr-1" />
                Hoje!
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Cake className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            
            {!member.isToday && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Em {member.daysUntilBirthday} dias</span>
              </div>
            )}

            {member.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{member.email}</span>
              </div>
            )}

            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Enviar mensagem
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Spaced layout
  return (
    <Card className={member.isToday ? "border-primary shadow-lg" : "hover:shadow-md transition-all"}>
      <CardContent className="p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="h-24 w-24">
            <AvatarImage src={member.photo_url || undefined} />
            <AvatarFallback className="text-2xl">
              {member.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-xl font-bold">{member.full_name}</h3>
            <p className="text-muted-foreground">
              {member.age} anos
            </p>
          </div>

          {member.isToday && (
            <Badge className="bg-primary text-base px-4 py-1">
              <Gift className="h-4 w-4 mr-2" />
              Aniversário Hoje!
            </Badge>
          )}
        </div>

        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            <span className="font-medium capitalize text-lg">{formattedDate}</span>
          </div>
          
          {!member.isToday && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Faltam {member.daysUntilBirthday} dias</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {member.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{member.email}</span>
            </div>
          )}

          {member.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          {member.phone && (
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
