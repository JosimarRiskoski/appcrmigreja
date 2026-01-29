import { Ministry, LayoutType } from "@/types/ministry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Users, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MinistryCardProps {
  ministry: Ministry;
  layout: LayoutType;
  onEdit: (ministry: Ministry) => void;
  onDelete: (ministry: Ministry) => void;
  onView?: (ministry: Ministry) => void;
}

export function MinistryCard({ ministry, layout, onEdit, onDelete, onView }: MinistryCardProps) {
  const memberCount = ministry.ministry_members?.length || 0;

  if (layout === 'compact') {
    return (
      <Card className="p-3 hover:shadow-md hover:-translate-y-1 transition-all duration-200" onClick={() => onView?.(ministry)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: ministry.color }}
            />
            <h3 className="font-semibold text-sm truncate">{ministry.name}</h3>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(ministry); }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => { e.stopPropagation(); onDelete(ministry); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {ministry.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {ministry.description}
          </p>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          {ministry.leader && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{ministry.leader.full_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
          </div>
        </div>
      </Card>
    );
  }

  if (layout === 'medium') {
    return (
      <Card className="p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" onClick={() => onView?.(ministry)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: ministry.color }}
            />
            <h3 className="font-semibold text-base truncate">{ministry.name}</h3>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(ministry); }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => { e.stopPropagation(); onDelete(ministry); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {ministry.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {ministry.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          {ministry.leader && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{ministry.leader.full_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
          </div>
        </div>

        
      </Card>
    );
  }

  // Spaced layout
  return (
    <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200" onClick={() => onView?.(ministry)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-5 h-5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: ministry.color }}
          />
          <h3 className="font-semibold text-lg truncate">{ministry.name}</h3>
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit(ministry); }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => { e.stopPropagation(); onDelete(ministry); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {ministry.description && (
        <p className="text-sm text-muted-foreground mb-4">
          {ministry.description}
        </p>
      )}

      <div className="space-y-3">
        {ministry.leader && (
          <div className="group relative p-4 rounded-xl border bg-gradient-to-br from-muted/50 to-background">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={ministry.leader.photo_url || undefined} />
                <AvatarFallback className="text-xl">
                  {ministry.leader.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{ministry.leader.full_name}</p>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Líder</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1">Gerenciar Membros</Button>
      </div>
    </Card>
  );
}
