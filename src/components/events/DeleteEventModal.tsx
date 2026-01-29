import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Event } from "@/types/event";

interface DeleteEventModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteEventModal = ({ isOpen, event, onClose, onConfirm }: DeleteEventModalProps) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Excluir "{event.title}"?</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Você está prestes a excluir este evento permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="text-left space-y-3">
          <p className="text-foreground">Este evento possui:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• {event.attendees} pessoas inscritas</li>
            <li>• Voluntários escalados</li>
            <li>• Materiais vinculados</li>
          </ul>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800 font-medium">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="cancel"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            Sim, Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
