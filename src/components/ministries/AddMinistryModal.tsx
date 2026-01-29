import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Ministry, DEFAULT_COLORS } from "@/types/ministry";
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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ministrySchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  leader_id: z.string().optional(),
  color: z.string(),
});

type MinistryFormData = z.infer<typeof ministrySchema>;

interface AddMinistryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry | null;
  onSuccess: () => void;
}

interface Member {
  id: string;
  full_name: string;
}

export function AddMinistryModal({
  open,
  onOpenChange,
  ministry,
  onSuccess,
}: AddMinistryModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (open) {
      loadMembers();
      if (ministry) {
        form.reset({
          name: ministry.name,
          description: ministry.description || "",
          leader_id: ministry.leader_id || undefined,
          color: ministry.color,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          color: "#3b82f6",
        });
      }
    }
  }, [open, ministry, form]);

  const loadMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();

      if (!profile?.church_id) return;

      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('church_id', profile.church_id)
        .eq('status', 'ativo')
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const onSubmit = async (data: MinistryFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();

      if (!profile?.church_id) throw new Error('Igreja não encontrada');

      const ministryData = {
        church_id: profile.church_id,
        name: data.name,
        description: data.description || null,
        leader_id: data.leader_id === 'null' ? null : data.leader_id || null,
        color: data.color,
      };

      if (ministry) {
        const { error } = await supabase
          .from('ministries')
          .update(ministryData)
          .eq('id', ministry.id);

        if (error) throw error;
        toast.success('Ministério atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('ministries')
          .insert(ministryData);

        if (error) throw error;
        toast.success('Ministério criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar ministério';
      console.error('Erro ao salvar ministério:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {ministry ? 'Editar Ministério' : 'Novo Ministério'}
          </DialogTitle>
          <DialogDescription>
            {ministry 
              ? 'Atualize as informações do ministério' 
              : 'Crie um novo ministério para organizar seus membros'}
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
                  <FormLabel>Nome do Ministério *</FormLabel>
                  <FormControl>
                    <Input placeholder="Louvor e Adoração" {...field} />
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
                    <Textarea 
                      placeholder="Descreva o propósito e atividades deste ministério..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leader_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Líder</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um líder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nenhum</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha o responsável pelo ministério
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Cor para identificação visual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {loading ? 'Salvando...' : ministry ? 'Atualizar' : 'Criar Ministério'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
