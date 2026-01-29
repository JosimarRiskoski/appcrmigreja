import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CellWithDetails, LayoutType, STATUS_BADGES } from "@/types/cell";
import { Edit, Trash2, Users, Calendar, Clock, MapPin, User, Phone, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { maskPhone } from "@/lib/utils";

interface CellCardProps {
  cell: CellWithDetails;
  layout: LayoutType;
  onEdit: (cell: CellWithDetails) => void;
  onDelete: (cell: CellWithDetails) => void;
  onViewMembers?: (cell: CellWithDetails) => void;
  onAddMember?: (cell: CellWithDetails) => void;
  actionsOrder?: ("edit" | "add_member" | "view_members" | "delete")[];
}

export function CellCard({ cell, layout, onEdit, onDelete, onViewMembers, onAddMember, actionsOrder }: CellCardProps) {
  const navigate = useNavigate();

  const handleViewMembers = () => {
    if (onViewMembers) {
      onViewMembers(cell);
    } else {
      navigate(`/membros?cell_id=${cell.id}`);
    }
  };

  const orderBase = actionsOrder || ["view_members", "add_member", "edit", "delete"];
  const hasMembers = (cell.member_count || 0) > 0;
  const finalOrder: ("edit" | "add_member" | "view_members" | "delete")[] = [];
  for (const k of orderBase) {
    if (k === "view_members") {
      if (hasMembers) finalOrder.push("view_members"); else finalOrder.push("add_member");
      continue;
    }
    if (k === "add_member") {
      if (!hasMembers) finalOrder.push("add_member");
      continue;
    }
    finalOrder.push(k);
  }
  if (!hasMembers && !finalOrder.includes("add_member")) finalOrder.push("add_member");

  const renderAction = (key: "edit" | "add_member" | "view_members" | "delete") => {
    if (key === "view_members") {
      return (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant={layout === "compact" ? "ghost" : "outline"}
              size="icon"
              onClick={handleViewMembers}
            >
              <Users className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver membros</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (key === "add_member") {
      return (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant={layout === "compact" ? "ghost" : "outline"}
              size="icon"
              onClick={() => onAddMember && onAddMember(cell)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adicionar membro</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (key === "edit") {
      return (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant={layout === "compact" ? "ghost" : "outline"}
              size="icon"
              onClick={() => onEdit(cell)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Tooltip key={key}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete(cell)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Excluir</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (layout === 'compact') {
    return (
      <Card className="transition-all transition-transform duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{cell.name}</h3>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_BADGES[cell.status].color}>
                  {STATUS_BADGES[cell.status].text}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cell.member_count || 0}</span>
                </div>
              </div>
            </div>

            {cell.leader && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{cell.leader.full_name} (Líder)</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {cell.meeting_day && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{cell.meeting_day}</span>
                </div>
              )}
              {cell.meeting_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{cell.meeting_time}</span>
                </div>
              )}
            </div>

            {cell.meeting_location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{cell.meeting_location}</span>
              </div>
            )}

            <div className="flex items-center justify-center pt-2 border-t">
              <TooltipProvider>
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {finalOrder.map(renderAction)}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (layout === 'medium') {
    return (
      <Card className="transition-all transition-transform duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg truncate">{cell.name}</h3>
            <div className="flex items-center gap-2">
              <Badge className={STATUS_BADGES[cell.status].color}>
                {STATUS_BADGES[cell.status].text}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{cell.member_count || 0}</span>
              </div>
            </div>
          </div>

          {cell.leader && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{cell.leader.full_name} (Líder)</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {cell.meeting_day && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{cell.meeting_day}</span>
              </div>
            )}
            {cell.meeting_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{cell.meeting_time}</span>
              </div>
            )}
          </div>

          {cell.meeting_location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{cell.meeting_location}</span>
            </div>
          )}

          {cell.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{cell.description}</p>
          )}

          <div className="flex items-center justify-center pt-2 border-t">
            <TooltipProvider>
              <div className="flex gap-3">
                {finalOrder.map(renderAction)}
              </div>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Spaced layout
  return (
    <Card className="transition-all transition-transform duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold truncate">{cell.name}</h3>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_BADGES[cell.status].color}>
              {STATUS_BADGES[cell.status].text}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{cell.member_count || 0}</span>
            </div>
          </div>
        </div>

        {cell.leader && (
          <div className="group relative p-4 rounded-xl border bg-gradient-to-br from-muted/50 to-background">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={cell.leader.photo_url || undefined} />
                <AvatarFallback className="text-xl">
                  {cell.leader.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{cell.leader.full_name}</p>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Líder</Badge>
                </div>
                {cell.leader.phone && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${cell.leader.phone}`} className="hover:text-primary">{maskPhone(cell.leader.phone)}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(cell.meeting_day || cell.meeting_time) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{cell.meeting_day} {cell.meeting_time && `às ${cell.meeting_time}`}</span>
          </div>
        )}

        {cell.meeting_location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{cell.meeting_location}</span>
          </div>
        )}

        {cell.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{cell.description}</p>
        )}

        

        

        <TooltipProvider>
          <div className="flex gap-4 pt-4 border-t justify-center">
            {finalOrder.map(renderAction)}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
