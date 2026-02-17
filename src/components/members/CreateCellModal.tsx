import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cellSchema, CellFormData } from "@/schemas/cellSchema";
import { useCells } from "@/hooks/useCells";
import { useEffect } from "react";
import { CellWithDetails } from "@/types/cell";

interface CreateCellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cellToEdit?: CellWithDetails | null;
}

const DAYS_OF_WEEK = [
  { value: "Segunda-feira", label: "Segunda-feira" },
  { value: "Terça-feira", label: "Terça-feira" },
  { value: "Quarta-feira", label: "Quarta-feira" },
  { value: "Quinta-feira", label: "Quinta-feira" },
  { value: "Sexta-feira", label: "Sexta-feira" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

export function CreateCellModal({
  open,
  onOpenChange,
  onSuccess,
  cellToEdit
}: CreateCellModalProps) {
  const { createCell, updateCell, loading } = useCells();

  const form = useForm<CellFormData>({
    resolver: zodResolver(cellSchema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      description: "",
      meeting_day: "",
      meeting_time: "",
      meeting_location: "",
    },
  });

  useEffect(() => {
    if (cellToEdit) {
      form.reset({
        name: cellToEdit.name,
        description: cellToEdit.description || "",
        meeting_day: cellToEdit.meeting_day || "",
        meeting_time: cellToEdit.meeting_time || "",
        meeting_location: cellToEdit.meeting_location || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        meeting_day: "",
        meeting_time: "",
        meeting_location: "",
      });
    }
  }, [cellToEdit, form, open]);

  const onSubmit = async (data: CellFormData) => {
    let success = false;

    if (cellToEdit) {
      success = await updateCell(cellToEdit.id, data);
    } else {
      success = await createCell(data);
    }

    if (success) {
      form.reset();
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cellToEdit ? "Editar Célula" : "Nova Célula"}</DialogTitle>
          <DialogDescription>
            {cellToEdit ? "Edite as informações da célula" : "Crie uma nova célula para organizar seus membros"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, () => toast.info('Existem campos obrigatórios não preenchidos'))} className="space-y-4">
            {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 && (
              <Alert>
                <AlertDescription>
                  Existem campos obrigatórios não preenchidos. Preencha os campos marcados com *.
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Célula *</FormLabel>
                  <FormControl>
                    <Input placeholder="Célula Alpha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição da célula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meeting_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Reunião</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="19:30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meeting_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de Reunião</FormLabel>
                  <FormControl>
                    <Input placeholder="Casa dos Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading ? (cellToEdit ? 'Salvando...' : 'Criando...') : (cellToEdit ? 'Salvar Alterações' : 'Criar Célula')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
