import { Member, LayoutType, STATUS_BADGES } from "@/types/member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Mail, Phone, Calendar, CalendarCheck, Users, CheckCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { maskPhone } from "@/lib/utils";

interface MemberCardProps {
  member: Member;
  layout: LayoutType;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onView: (member: Member) => void;
}

export function MemberCard({ member, layout, onEdit, onDelete, onView }: MemberCardProps) {
  const statusBadge = STATUS_BADGES[member.status];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthDate = (birthDate: string) => {
    const date = new Date(birthDate);
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const isBirthdayToday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  };

  const isBirthdayThisWeek = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const daysDiff = Math.abs(today.getDate() - birth.getDate());
    return today.getMonth() === birth.getMonth() && daysDiff <= 7;
  };

  if (layout === 'compact') {
    return (
      <Card className="p-3 hover:shadow-md hover:-translate-y-1 transition-all duration-200 min-h-[180px]">
        <div className="flex flex-col h-full">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{member.full_name}</h3>
            <Badge className={`${statusBadge.color} text-[10px] px-2 py-0.5 ml-auto`}>{statusBadge.text}</Badge>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            {member.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{maskPhone(member.phone)}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{formatBirthDate(member.birth_date)} · {calculateAge(member.birth_date)} anos</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {member.cell && (
              <Badge variant="outline" className="text-xs">
                {member.cell.name}
              </Badge>
            )}
            {member.birth_date && isBirthdayToday(member.birth_date) && (
              <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                🎂 Hoje
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-center pt-2 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDelete(member)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(member)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onView(member)}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (layout === 'medium') {
    return (
      <Card className="p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 min-h-[220px]">
        <div className="flex flex-col h-full">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{member.full_name}</h3>
            <Badge className={`${statusBadge.color} text-[10px] px-2 py-0.5 ml-auto`}>{statusBadge.text}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            {member.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{maskPhone(member.phone)}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{formatBirthDate(member.birth_date)} · {calculateAge(member.birth_date)} anos</span>
              </div>
            )}
            {member.baptized && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Batizado</span>
              </div>
            )}
            {member.member_since && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <CalendarCheck className="h-3 w-3" />
                <span>
                  Membro desde {format(new Date(member.member_since), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {member.cell && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{member.cell.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {member.birth_date && isBirthdayToday(member.birth_date) && (
              <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                🎂 Aniversariante
              </Badge>
            )}
            {member.birth_date && !isBirthdayToday(member.birth_date) && isBirthdayThisWeek(member.birth_date) && (
              <Badge variant="outline" className="text-pink-600">
                🎉 Aniversário esta semana
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-center pt-2 border-t">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDelete(member)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(member)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onView(member)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Spaced layout
  return (
    <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 min-h-[260px]">
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-lg truncate">{member.full_name}</h3>
          <Badge className={`${statusBadge.color} text-[10px] px-2 py-0.5 ml-auto`}>{statusBadge.text}</Badge>
        </div>

        <div className="space-y-3">
          {member.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{maskPhone(member.phone)}</span>
            </div>
          )}
          {member.birth_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatBirthDate(member.birth_date)} · {calculateAge(member.birth_date)} anos</span>
            </div>
          )}
          {member.baptized && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">Batizado</span>
            </div>
          )}
          {member.member_since && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                Membro desde {format(new Date(member.member_since), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          {member.cell && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{member.cell.name}</span>
              </div>
              {member.cell.meeting_day && member.cell.meeting_time && (
                <div className="text-xs text-muted-foreground ml-6">
                  Reunião: {member.cell.meeting_day} {member.cell.meeting_time}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {member.birth_date && isBirthdayToday(member.birth_date) && (
            <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
              🎂 Aniversariante
            </Badge>
          )}
          {member.birth_date && !isBirthdayToday(member.birth_date) && isBirthdayThisWeek(member.birth_date) && (
            <Badge variant="outline" className="text-pink-600">
              🎉 Aniversário esta semana
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-4 border-t flex items-center justify-center">
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDelete(member)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(member)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onView(member)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
