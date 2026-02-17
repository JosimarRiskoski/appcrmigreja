import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { eventSchema, EventFormData } from "@/schemas/eventSchema";
import { useEvents, DbEvent } from "@/hooks/useEvents";

const FEATURED_MARK = "[FEATURED]";
const parseFeatured = (desc: string | null) => !!(desc || "").includes(FEATURED_MARK);

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: DbEvent | null;
  onSuccess: () => void;
}

export function AddEventModal({ open, onOpenChange, event, onSuccess }: AddEventModalProps) {
  const { createEvent, updateEvent, checkConflicts, loading } = useEvents();
  const [dateOpen, setDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [confirmSameDayOpen, setConfirmSameDayOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EventFormData | null>(null);
  const [sameDayCount, setSameDayCount] = useState(0);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
    defaultValues: {
      title: "",
      date: undefined,
      time: "",
      endDate: undefined,
      endTime: "",
      location: "",
      description: "",
      featured: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        const d = new Date(event.event_date);
        const e = event.end_date ? new Date(event.end_date) : d;
        form.reset({
          title: event.title,
          date: d,
          time: format(d, "HH:mm"),
          endDate: e,
          endTime: format(e, "HH:mm"),
          location: event.location ?? "",
          description: (event.description ?? "").replace(FEATURED_MARK, "").trim(),
          featured: parseFeatured(event.description),
        });
      } else {
        form.reset({
          title: "",
          date: undefined,
          time: "",
          endDate: undefined,
          endTime: "",
          location: "",
          description: "",
          featured: false,
        });
      }
    }
  }, [open, event, form]);

  const onSubmit = async (data: EventFormData) => {
    // Conflict check logic
    const { conflict, count } = await checkConflicts(data.date, event?.id);

    if (conflict && !event) {
      // Just warning if create new event
      setSameDayCount(count);
      setPendingFormData(data);
      setConfirmSameDayOpen(true);
      return;
    }

    // Direct submit if update, or no conflict
    await handleFinalSubmit(data);
  };

  const handleFinalSubmit = async (data: EventFormData) => {
    let success = false;
    if (event) {
      success = await updateEvent(event.id, data);
    } else {
      success = await createEvent(data);
    }

    if (success) {
      setConfirmSameDayOpen(false);
      setPendingFormData(null);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription>
            {event ? "Atualize as informações do evento" : "Preencha os dados do novo evento"}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destacar no site</FormLabel>
                  <FormControl>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                      Destacar
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início *</FormLabel>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <div>Selecione a data de início</div>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                          onConfirm={(date) => {
                            field.onChange(date);
                            setDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fim *</FormLabel>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <div>Selecione a data de fim</div>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                          onConfirm={(date) => {
                            field.onChange(date);
                            setEndDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Matriz / Auditório Principal" {...field} />
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
                    <Textarea placeholder="Detalhes do evento, agenda, observações..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialog open={confirmSameDayOpen} onOpenChange={setConfirmSameDayOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Evento no mesmo dia</AlertDialogTitle>
                  <AlertDialogDescription>
                    {sameDayCount} evento(s) já estão marcados para este dia. Deseja adicionar este evento no mesmo dia?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setConfirmSameDayOpen(false); setPendingFormData(null); }}>Não</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (pendingFormData) await handleFinalSubmit(pendingFormData);
                    }}
                  >
                    Sim, adicionar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DialogFooter>
              <Button
                type="button"
                variant="cancel"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading ? "Salvando..." : event ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
