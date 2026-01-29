import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

const eventSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  date: z.date({ required_error: "Selecione a data do início" }),
  time: z.string().min(5, "Informe o horário de início no formato HH:mm"),
  endDate: z.date({ required_error: "Selecione a data de fim do evento" }),
  endTime: z.string().min(5, "Informe o horário de fim no formato HH:mm"),
  location: z.string().optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
}).refine((data) => {
  const s = new Date(data.date);
  const [sh, sm] = data.time.split(":").map(Number);
  s.setHours(sh, sm, 0, 0);
  const e = new Date(data.endDate);
  const [eh, em] = data.endTime.split(":").map(Number);
  e.setHours(eh, em, 0, 0);
  return e.getTime() >= s.getTime();
}, { message: "Fim do evento deve ser após o início", path: ["endTime"] });

type EventFormData = z.infer<typeof eventSchema>;

const FEATURED_MARK = "[FEATURED]";
const withFeatured = (desc: string | null, featured: boolean) => {
  const base = desc || "";
  const cleaned = base.replace(FEATURED_MARK, "").trim();
  return featured ? `${FEATURED_MARK} ${cleaned}`.trim() : (cleaned || null);
};
const parseFeatured = (desc: string | null) => !!(desc || "").includes(FEATURED_MARK);

interface DbEvent {
  id: string;
  title: string;
  event_date: string;
  end_date: string | null;
  location: string | null;
  description: string | null;
}

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: DbEvent | null;
  onSuccess: () => void;
}

export function AddEventModal({ open, onOpenChange, event, onSuccess }: AddEventModalProps) {
  const [loading, setLoading] = useState(false);
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

  const combineDateTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const start = combineDateTime(data.date, data.time);
      const end = combineDateTime(data.endDate, data.endTime);

      const { data: existingExact } = await supabase
        .from("events")
        .select("id")
        .eq("church_id", profile.church_id)
        .eq("title", data.title)
        .eq("event_date", start.toISOString())
        .limit(1);

      if ((existingExact || []).length > 0) {
        if (!event || (event && (existingExact || [])[0].id !== event.id)) {
          throw new Error("Já existe um evento com o mesmo título e horário");
        }
      }

      const dayStart = startOfDay(start).toISOString();
      const dayEnd = endOfDay(start).toISOString();
      let sameDayQuery = supabase
        .from("events")
        .select("id")
        .eq("church_id", profile.church_id)
        .gte("event_date", dayStart)
        .lt("event_date", dayEnd);
      if (event?.id) {
        sameDayQuery = sameDayQuery.neq("id", event.id);
      }
      const { data: sameDay } = await sameDayQuery;
      if ((sameDay || []).length > 0 && !event) {
        setSameDayCount((sameDay || []).length);
        setPendingFormData(data);
        setConfirmSameDayOpen(true);
        setLoading(false);
        return;
      }

      const eventData = {
        church_id: profile.church_id,
        title: data.title,
        event_date: start.toISOString(),
        end_date: end.toISOString(),
        location: data.location ? data.location : null,
        description: withFeatured(data.description ? data.description : null, !!data.featured),
        created_by: user.id,
      };

      if (event) {
        const { error } = await supabase
          .from("events")
          .update({
            church_id: eventData.church_id,
            title: eventData.title,
            event_date: eventData.event_date,
            end_date: eventData.end_date,
            location: eventData.location,
            description: eventData.description,
          })
          .eq("id", event.id);
        if (error) throw error;
        toast.success("Evento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData);
        if (error) throw error;
        toast.success("Evento criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar evento";
      toast.error(message);
    } finally {
      setLoading(false);
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
                      if (!pendingFormData) return;
                      setLoading(true);
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error("Usuário não autenticado");
                        const { data: profile } = await supabase
                          .from("profiles")
                          .select("church_id")
                          .eq("id", user.id)
                          .single();
                        if (!profile?.church_id) throw new Error("Igreja não encontrada");
                        const start = combineDateTime(pendingFormData.date, pendingFormData.time);
                        const end = combineDateTime(pendingFormData.endDate, pendingFormData.endTime);
                        const eventData = {
                          church_id: profile.church_id,
                          title: pendingFormData.title,
                          event_date: start.toISOString(),
                          end_date: end.toISOString(),
                          location: pendingFormData.location ? pendingFormData.location : null,
                          description: withFeatured(pendingFormData.description ? pendingFormData.description : null, !!pendingFormData.featured),
                          created_by: user.id,
                        };
                        const { error } = await supabase.from("events").insert(eventData);
                        if (error) throw error;
                        toast.success("Evento criado com sucesso!");
                        setConfirmSameDayOpen(false);
                        setPendingFormData(null);
                        onSuccess();
                        onOpenChange(false);
                      } catch (e) {
                        const message = e instanceof Error ? e.message : "Erro ao salvar evento";
                        toast.error(message);
                      } finally {
                        setLoading(false);
                      }
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
