import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const liturgySchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  date: z.date({ required_error: "Selecione a data" }),
  time: z.string().min(5, "Informe horário HH:mm"),
  minister: z.string().min(3, "Ministro deve ter pelo menos 3 caracteres"),
  theme: z.string().min(3, "Tema deve ter pelo menos 3 caracteres"),
  location: z.string().optional(),
  type: z.enum(["Culto", "Celebração", "Santa Ceia", "Vigília"]),
});

type LiturgyFormData = z.infer<typeof liturgySchema>;

interface DbEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  minister: string;
  theme: string;
  type: "Culto" | "Celebração" | "Santa Ceia" | "Vigília";
}

interface AddLiturgyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: DbEvent | null;
  onSuccess: () => void;
}

export function AddLiturgyModal({ open, onOpenChange, event, onSuccess }: AddLiturgyModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<LiturgyFormData>({
    resolver: zodResolver(liturgySchema),
    mode: 'onChange',
    defaultValues: {
      title: "",
      date: undefined,
      time: "",
      minister: "",
      theme: "",
      location: "",
      type: "Culto",
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        const d = new Date(event.event_date);
        form.reset({
          title: event.title,
          date: d,
          time: format(d, "HH:mm"),
          minister: event.minister || "",
          theme: event.theme || "",
          location: event.location ?? "",
          type: event.type,
        });
      } else {
        form.reset({
          title: "",
          date: undefined,
          time: "",
          minister: "",
          theme: "",
          location: "",
          type: "Culto",
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

  const onSubmit = async (data: LiturgyFormData) => {
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

      const eventDateIso = combineDateTime(data.date, data.time).toISOString();

      const liturgyData = {
        church_id: profile.church_id,
        title: data.title,
        event_date: eventDateIso,
        location: data.location ? data.location : null,
        minister: data.minister,
        theme: data.theme,
        type: data.type,
      };

      if (event) {
        const { error } = await supabase
          .from("liturgies")
          .update(liturgyData)
          .eq("id", event.id);
        if (error) throw error;
        toast.success("Programação atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("liturgies")
          .insert(liturgyData);
        if (error) throw error;
        toast.success("Programação criada com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar programação";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Programação" : "Nova Programação"}</DialogTitle>
          <DialogDescription>
            {event ? "Atualize as informações da programação" : "Preencha os dados da programação"}
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
                    <Input placeholder="Culto Dominical" {...field} />
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
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <div>Selecione uma data</div>}
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
            </div>

            <FormField
              control={form.control}
              name="minister"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ministro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Pastor João" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tema da mensagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Matriz / Auditório" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Culto">Culto</SelectItem>
                        <SelectItem value="Celebração">Celebração</SelectItem>
                        <SelectItem value="Santa Ceia">Santa Ceia</SelectItem>
                        <SelectItem value="Vigília">Vigília</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
