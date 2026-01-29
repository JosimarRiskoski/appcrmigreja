import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface LayoutTooltipProps {
  onClose: () => void;
}

export const LayoutTooltip = ({ onClose }: LayoutTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-primary text-primary-foreground rounded-lg shadow-2xl p-4 z-50 animate-fade-in">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-primary-foreground/20 rounded-full shrink-0">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">Personalize sua visualização!</h3>
          <p className="text-sm text-primary-foreground/90">
            Você pode alternar entre 3 densidades de layout. Sua preferência será salva automaticamente.
          </p>
        </div>
      </div>

      <Button
        onClick={handleClose}
        className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
      >
        Entendi!
      </Button>
    </div>
  );
};
