import { Ministry } from "@/types/ministry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DeleteMinistryModalProps {
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteMinistryModal({
  ministry,
  open,
  onOpenChange,
  onConfirm,
}: DeleteMinistryModalProps) {
  if (!ministry) return null;

  const memberCount = ministry.ministry_members?.length || 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir "{ministry.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a excluir este ministério permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 mt-2">
          {memberCount > 0 && (
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">Este ministério:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Possui {memberCount} {memberCount === 1 ? 'membro' : 'membros'} vinculado{memberCount === 1 ? '' : 's'}</li>
                {ministry.leader && <li>Tem {ministry.leader.full_name} como líder</li>}
              </ul>
            </div>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta ação não pode ser desfeita. Os membros não serão excluídos, apenas desvinculados do ministério.
            </AlertDescription>
          </Alert>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:bg-destructive hover:text-destructive-foreground">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
