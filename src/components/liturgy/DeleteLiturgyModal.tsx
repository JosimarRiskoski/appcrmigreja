import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Liturgy } from "@/types/liturgy";

interface DeleteLiturgyModalProps {
  isOpen: boolean;
  liturgy: Liturgy | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteLiturgyModal = ({ isOpen, liturgy, onClose, onConfirm }: DeleteLiturgyModalProps) => {
  if (!liturgy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            Excluir "{liturgy.title}"?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Esta programação está programada para:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{liturgy.date} às {liturgy.time}</li>
              <li>Ministro: {liturgy.minister}</li>
              <li>Local: {liturgy.location}</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">
              Esta ação não pode ser desfeita
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Sim, Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
