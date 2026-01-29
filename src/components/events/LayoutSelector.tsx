import { Grid3x3, LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutType } from "@/types/event";
import { LayoutTooltip } from "./LayoutTooltip";
import { useState, useEffect } from "react";

interface LayoutSelectorProps {
  selectedLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const LAYOUTS = [
  { id: 'compact' as LayoutType, icon: Grid3x3, label: 'Compacto' },
  { id: 'medium' as LayoutType, icon: LayoutGrid, label: 'Médio' },
  { id: 'spaced' as LayoutType, icon: Rows3, label: 'Espaçoso' }
];

export const LayoutSelector = ({ selectedLayout, onLayoutChange }: LayoutSelectorProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('hasSeenLayoutTooltip');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
    }
  }, []);

  const handleCloseTooltip = () => {
    localStorage.setItem('hasSeenLayoutTooltip', 'true');
    setShowTooltip(false);
  };

  return (
    <div className="relative flex items-center gap-2 pl-4 border-l border-border">
      <span className="text-sm text-muted-foreground hidden md:inline">Visualização:</span>
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {LAYOUTS.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => onLayoutChange(id)}
            className={cn(
              "h-8 px-3 transition-all",
              selectedLayout === id
                ? "bg-background text-primary shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-2 hidden lg:inline">{label}</span>
          </Button>
        ))}
      </div>
      
      {showTooltip && <LayoutTooltip onClose={handleCloseTooltip} />}
    </div>
  );
};
