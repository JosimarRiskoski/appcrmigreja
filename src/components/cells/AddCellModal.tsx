import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CellWithDetails } from "@/types/cell";
import { Loader2 } from "lucide-react";
import { useChurchId } from "@/hooks/useChurchId";
import { Alert, AlertDescription } from "@/components/ui/alert";

const cellSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  status: z.enum(["ativa", "inativa"]),
  leader_id: z.string().optional().nullable(),
  meeting_day: z.string().optional().nullable(),
  meeting_time: z.string().optional().nullable(),
  meeting_location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type CellFormData = z.infer<typeof cellSchema>;

interface AddCellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellToEdit?: CellWithDetails | null;
  onSuccess: () => void;
}

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export function AddCellModal({
  open,
  onOpenChange,
  cellToEdit,
  onSuccess,
}: AddCellModalProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [zipCode, setZipCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [occupiedLeaderIds, setOccupiedLeaderIds] = useState<string[]>([]);

  const form = useForm<CellFormData>({
    resolver: zodResolver(cellSchema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      status: "ativa",
      leader_id: null,
      meeting_day: null,
      meeting_time: null,
      meeting_location: null,
      description: null,
    },
  });

  const { data: churchId } = useChurchId();

  const loadMembers = useCallback(async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name")
        .eq("church_id", churchId as string)
        .eq("status", "ativo")
        .order("full_name");
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  }, [churchId]);

  const loadOccupiedLeaders = useCallback(async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from("cells")
        .select("leader_id")
        .eq("church_id", churchId as string);
      if (error) throw error;
      const ids = (data || [])
        .map((c: { leader_id: string | null }) => c.leader_id)
        .filter((id): id is string => !!id);
      const filtered = ids.filter((id) => id !== (cellToEdit?.leader_id || undefined));
      setOccupiedLeaderIds(filtered);
    } catch (error) {
      console.error("Erro ao carregar líderes ocupados:", error);
    }
  }, [churchId, cellToEdit?.leader_id]);

  useEffect(() => {
    if (open) {
      loadMembers();
      loadOccupiedLeaders();
      if (cellToEdit) {
        form.reset({
          name: cellToEdit.name,
          status: cellToEdit.status,
          leader_id: cellToEdit.leader_id,
          meeting_day: cellToEdit.meeting_day,
          meeting_time: cellToEdit.meeting_time,
          meeting_location: cellToEdit.meeting_location,
          description: cellToEdit.description,
        });
      } else {
        form.reset({
          name: "",
          status: "ativa",
          leader_id: null,
          meeting_day: null,
          meeting_time: null,
          meeting_location: null,
          description: null,
        });
      }
    }
  }, [open, cellToEdit, form, loadMembers, loadOccupiedLeaders]);

  const normalizeCep = (cep: string) => (cep || "").replace(/\D/g, "");

  const fetchCep = async (cep: string) => {
    const clean = normalizeCep(cep);
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (!json?.erro) {
        const cityUf = [json.localidade, json.uf].filter(Boolean).join("/");
        const location = [json.logradouro, json.bairro, cityUf].filter(Boolean).join(" - ");
        form.setValue("meeting_location", location);
      }
    } catch {
      return;
    }
  };

  

  const onSubmit = async (data: CellFormData) => {
    setLoading(true);
    try {
      if (!churchId) throw new Error("Igreja não encontrada");

      const composedLocation = [
        data.meeting_location || undefined,
        houseNumber ? `Nº ${houseNumber}` : undefined,
        zipCode ? `CEP ${zipCode}` : undefined,
      ].filter(Boolean).join(" | ");

      const cellData = {
        name: data.name,
        status: data.status,
        church_id: churchId,
        leader_id: data.leader_id || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
        meeting_location: composedLocation || null,
        description: data.description || null,
      };

      if (cellToEdit) {
        const { error } = await supabase
          .from("cells")
          .update(cellData)
          .eq("id", cellToEdit.id);

        if (error) throw error;
        toast.success("Célula atualizada com sucesso");
      } else {
        const { error } = await supabase.from("cells").insert([cellData]);

        if (error) throw error;
        toast.success("Célula criada com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar célula:", error);
      toast.error("Erro ao salvar célula");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cellToEdit ? "Editar Célula" : "Nova Célula"}
          </DialogTitle>
          <DialogDescription>
            {cellToEdit
              ? "Atualize as informações da célula"
              : "Preencha os dados para criar uma nova célula"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Célula *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Célula Alpha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
              name="leader_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Líder</FormLabel>
                  <Select
                      onValueChange={(v) => field.onChange(v === "null" ? null : v)}
                      value={field.value || undefined}
                    >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um líder" />
                      </SelectTrigger>
                    </FormControl>
                <SelectContent>
                  <SelectItem value="null">Sem líder definido</SelectItem>
                  {members
                    .filter((m) => !occupiedLeaderIds.includes(m.id) || m.id === (cellToEdit?.leader_id || ""))
                    .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
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
                name="meeting_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Reunião</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIAS_SEMANA.map((dia) => (
                          <SelectItem key={dia} value={dia}>
                            {dia}
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
                    <FormLabel>Horário da Reunião</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="w-32"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>CEP</FormLabel>
                <Input
                  placeholder="00000-000"
                  value={zipCode}
                  inputMode="numeric"
                  maxLength={8}
                  className="w-32"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setZipCode(digits);
                    fetchCep(digits);
                  }}
                />
                <span className="text-xs text-muted-foreground">Preenche o campo Local da Reunião</span>
              </div>

              <div>
                <FormLabel>Número</FormLabel>
                <Input
                  placeholder="Ex: 123"
                  value={houseNumber}
                  inputMode="numeric"
                  maxLength={10}
                  className="w-40"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setHouseNumber(digits);
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="meeting_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local da Reunião</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Rua X, 123 - Bairro Y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações sobre a célula..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
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
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cellToEdit ? "Atualizar" : "Criar"} Célula
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
