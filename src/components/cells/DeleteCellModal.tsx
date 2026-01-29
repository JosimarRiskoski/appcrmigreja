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
import { CellWithDetails } from "@/types/cell";

interface DeleteCellModalProps {
  cell: CellWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteCellModal({
  cell,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCellModalProps) {
  if (!cell) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a excluir a célula{" "}
              <span className="font-semibold text-foreground">{cell.name}</span>.
            </p>
            {cell.member_count && cell.member_count > 0 ? (
              <p className="text-yellow-600 dark:text-yellow-500">
                ⚠️ Esta célula possui {cell.member_count} membro(s) vinculado(s).
                Os membros não serão excluídos, apenas desvinculados da célula.
              </p>
            ) : (
              <p>Esta ação não pode ser desfeita.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
