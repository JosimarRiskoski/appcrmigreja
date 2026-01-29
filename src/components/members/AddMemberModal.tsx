import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Member, Cell } from "@/types/member";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileButton from "@/components/ui/FileButton";
import { Calendar } from "@/components/ui/calendar";
import { cn, maskPhone } from "@/lib/utils";
import { toast } from "sonner";
import { CreateCellModal } from "./CreateCellModal";
import { useChurchId } from "@/hooks/useChurchId";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Alert, AlertDescription } from "@/components/ui/alert";

const memberSchema = z.object({
  full_name: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birth_date: z.date().optional(),
  status: z.enum(["ativo", "inativo", "visitante"]),
  baptized: z.boolean(),
  member_since: z.date().optional(),
  cell_id: z.string().optional(),
  ministry_ids: z.array(z.string()).optional(),
  zip_code: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  address_number: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSuccess: () => void;
  prefillCellId?: string;
  prefillData?: Partial<Member>;
  variant?: 'dialog' | 'content';
}

export function AddMemberModal({
  open,
  onOpenChange,
  member,
  onSuccess,
  prefillCellId,
  prefillData,
  variant = 'dialog',
}: AddMemberModalProps) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [ministries, setMinistries] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [showCreateCell, setShowCreateCell] = useState(false);
  const [loading, setLoading] = useState(false);
  const [birthOpen, setBirthOpen] = useState(false);
  const [memberSinceOpen, setMemberSinceOpen] = useState(false);
  const [ministriesOpen, setMinistriesOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      status: undefined,
      baptized: undefined as unknown as boolean,
      ministry_ids: [],
      cell_id: undefined,
      zip_code: "",
      address: "",
      address_number: "",
      city: "",
      notes: "",
    },
  });

  const { data: churchId } = useChurchId();

  const loadCells = useCallback(async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from('cells')
        .select('id, name, leader_id, meeting_day, meeting_time, meeting_location')
        .eq('church_id', churchId as string)
        .order('name');
      if (error) throw error;
      setCells(data || []);
    } catch (error) {
      console.error('Erro ao carregar células:', error);
    }
  }, [churchId]);

  const loadMinistries = useCallback(async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name, color')
        .eq('church_id', churchId as string)
        .order('name');
      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error('Erro ao carregar ministérios:', error);
    }
  }, [churchId]);

  const loadMemberMinistries = useCallback(async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('ministry_members')
        .select('ministry_id')
        .eq('member_id', memberId);
      if (error) throw error;
      const ministryIds = data?.map(mm => mm.ministry_id) || [];
      form.setValue('ministry_ids', ministryIds);
    } catch (error) {
      console.error('Erro ao carregar ministérios do membro:', error);
    }
  }, [form]);

  useEffect(() => {
    if (open) {
      loadCells();
      loadMinistries();
      if (member) {
        loadMemberMinistries(member.id);
        form.reset({
          full_name: member.full_name,
          email: member.email || "",
          phone: member.phone || "",
          status: member.status,
          baptized: member.baptized,
          birth_date: member.birth_date ? new Date(member.birth_date) : undefined,
          member_since: member.member_since ? new Date(member.member_since) : undefined,
          cell_id: member.cell_id || undefined,
          ministry_ids: [],
          zip_code: member.zip_code || "",
          address: member.address || "",
          address_number: "",
          city: member.city || "",
          notes: member.notes || "",
        });
      } else {
        form.reset({
          full_name: (prefillData?.full_name || "").trim(),
          email: prefillData?.email || "",
          phone: prefillData?.phone || "",
          status: prefillData?.status || undefined,
          baptized: undefined as unknown as boolean,
          ministry_ids: [],
          cell_id: prefillCellId || undefined,
          zip_code: prefillData?.zip_code || "",
          address: prefillData?.address || "",
          address_number: prefillData?.address_number || "",
          city: prefillData?.city || "",
          notes: prefillData?.notes || "",
          birth_date: prefillData?.birth_date ? new Date(prefillData.birth_date) : undefined,
          member_since: prefillData?.member_since ? new Date(prefillData.member_since) : undefined,
        });
      }
    }
  }, [open, member, form, loadCells, loadMinistries, loadMemberMinistries, prefillCellId, prefillData]);

  const normalizeCep = (cep: string) => (cep || "").replace(/\D/g, "");

  const fetchCep = async (cep: string) => {
    const clean = normalizeCep(cep);
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (!json?.erro) {
        form.setValue('address', [json.logradouro, json.bairro].filter(Boolean).join(' - '));
        form.setValue('city', [json.localidade, json.uf].filter(Boolean).join('/'));
      }
    } catch {
      return;
    }
  };

  const uploadAvatar = async (memberId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    try {
      const filePath = `members/${memberId}/avatar_${crypto.randomUUID()}_${avatarFile.name}`;
      const tryUpload = async (bucket: string): Promise<{ ok: boolean; url?: string; message?: string }> => {
        const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type || 'application/octet-stream',
          cacheControl: '3600',
        });
        if (upErr) return { ok: false, message: upErr.message };
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { ok: true, url: pub?.publicUrl ?? null };
      };
      let result = await tryUpload('church-logos');
      if (!result.ok && String(result.message || '').toLowerCase().includes('not found')) {
        result = await tryUpload('media');
      }
      if (!result.ok) {
        toast.error(String(result.message || 'Falha no upload da foto'));
        return null;
      }
      return result.url || null;
    } catch (e) {
      const msg = (e as { message?: string } | undefined)?.message || 'Falha inesperada no upload da foto';
      toast.error(msg);
      return null;
    }
  };

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      if (!churchId) throw new Error('Igreja não encontrada');

      const fullAddress = [
        data.address || undefined,
        data.address_number ? `Nº ${data.address_number}` : undefined,
      ].filter(Boolean).join(', ');
      const memberData = {
        church_id: churchId,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        birth_date: data.birth_date ? format(data.birth_date, 'yyyy-MM-dd') : null,
        status: data.status,
        baptized: data.baptized,
        member_since: data.member_since ? format(data.member_since, 'yyyy-MM-dd') : null,
        cell_id: data.cell_id || null,
        zip_code: (data.zip_code || null) as string | null,
        address: (fullAddress || null) as string | null,
        city: (data.city || null) as string | null,
        notes: (data.notes || null) as string | null,
      };

      if (member) {
        const { error } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', member.id);

        if (error) {
          const msg = String(error.message || '');
          const fallbackData = {
            church_id: memberData.church_id,
            full_name: memberData.full_name,
            email: memberData.email,
            phone: memberData.phone,
            birth_date: memberData.birth_date,
            status: memberData.status,
            baptized: memberData.baptized,
            member_since: memberData.member_since,
            cell_id: memberData.cell_id,
            address: memberData.address,
            city: memberData.city,
            notes: memberData.notes,
          };
          if (msg.toLowerCase().includes('column')) {
            const retry = await supabase.from('members').update(fallbackData).eq('id', member.id);
            if (retry.error) throw retry.error;
            toast.warning('Banco sem colunas de endereço/CEP/cidade. Demais dados atualizados.');
          } else {
            throw error;
          }
        }

        // Atualizar ministérios
        await supabase
          .from('ministry_members')
          .delete()
          .eq('member_id', member.id);

        if (data.ministry_ids && data.ministry_ids.length > 0) {
          const ministryMembersData = data.ministry_ids.map(ministry_id => ({
            member_id: member.id,
            ministry_id,
          }));

          await supabase
            .from('ministry_members')
            .insert(ministryMembersData);
        }

        if (avatarFile) {
          const url = await uploadAvatar(member.id);
          if (url) {
            const { error: photoErr } = await supabase
              .from('members')
              .update({ photo_url: url })
              .eq('id', member.id);
            if (photoErr) {
              toast.error('Sem permissão para atualizar a foto do membro');
            }
          }
        }

        toast.success('Membro atualizado com sucesso!');
        onSuccess();
      } else {
        const { data: newMemberInitial, error } = await supabase
          .from('members')
          .insert(memberData)
          .select()
          .single();

        let newMember = newMemberInitial;
        if (error) {
          const msg = String(error.message || '');
          const fallbackData = {
            church_id: memberData.church_id,
            full_name: memberData.full_name,
            email: memberData.email,
            phone: memberData.phone,
            birth_date: memberData.birth_date,
            status: memberData.status,
            baptized: memberData.baptized,
            member_since: memberData.member_since,
            cell_id: memberData.cell_id,
            address: memberData.address,
            city: memberData.city,
            notes: memberData.notes,
          };
          if (msg.toLowerCase().includes('column')) {
            const retry = await supabase.from('members').insert(fallbackData).select().single();
            if (retry.error) throw retry.error;
            newMember = retry.data as Member;
            toast.warning('Banco sem colunas de endereço/CEP/cidade. Demais dados salvos.');
          } else {
            throw error;
          }
        }

        // Adicionar aos ministérios selecionados
        if (data.ministry_ids && data.ministry_ids.length > 0 && newMember) {
          const ministryMembersData = data.ministry_ids.map(ministry_id => ({
            member_id: newMember.id,
            ministry_id,
          }));

          await supabase
            .from('ministry_members')
            .insert(ministryMembersData);
        }

        if (avatarFile && newMember) {
          const url = await uploadAvatar(newMember.id);
          if (url) {
            const { error: photoErr } = await supabase
              .from('members')
              .update({ photo_url: url })
              .eq('id', newMember.id);
            if (photoErr) {
              toast.error('Sem permissão para atualizar a foto do membro');
            }
          }
        }

        toast.success('Membro adicionado com sucesso!');
        onSuccess();
      }

      if (variant === 'dialog') {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar membro';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCellCreated = () => {
    loadCells();
    setShowCreateCell(false);
    toast.success('Célula criada com sucesso!');
  };

  const formNode = (
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
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="joao@email.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" value={field.value || ""} onChange={(e) => field.onChange(maskPhone(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Aniversário</FormLabel>
                      <Popover open={birthOpen} onOpenChange={setBirthOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              onClick={() => setBirthOpen(true)}
                            >
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="pointer-events-auto"
                            onConfirm={(date) => {
                              field.onChange(date);
                              setBirthOpen(false);
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
                  name="member_since"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Membro Desde</FormLabel>
                      <Popover open={memberSinceOpen} onOpenChange={setMemberSinceOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              onClick={() => setMemberSinceOpen(true)}
                            >
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                            onConfirm={(date) => {
                              field.onChange(date);
                              setMemberSinceOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto,auto,1fr] gap-3 items-end">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 px-2 w-32 truncate">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="visitante">Visitante</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baptized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batizado *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "true")} 
                        value={field.value === true ? 'true' : field.value === false ? 'false' : undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 px-2 w-32 truncate">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cell_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Célula</FormLabel>
                      <div className="flex gap-2 items-end">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-w-0 w-full max-w-[22rem] h-9 px-2">
                              <SelectValue placeholder="Selecione uma célula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cells.map((cell) => (
                              <SelectItem key={cell.id} value={cell.id}>
                                {cell.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateCell(true)}
                          className="h-9 px-3"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Célula
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
          </div>

          

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} onChange={(e) => { field.onChange(e.target.value); fetchCep(e.target.value); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nº"
                      inputMode="numeric"
                      {...field}
                      onKeyDown={(e) => {
                        const k = e.key;
                        const allow = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                        if (allow.includes(k) || e.ctrlKey || e.metaKey) return;
                        if (!/^[0-9]$/.test(k)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text');
                        field.onChange(text.replace(/\D/g, ''));
                      }}
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade/UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea placeholder="Opcional: quem convidou, outras observações" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3">
            <FileButton label="Upload foto de perfil" accept="image/*" onSelected={setAvatarFile} />
            {avatarFile && <span className="text-sm text-muted-foreground truncate max-w-[50%]">{avatarFile.name}</span>}
          </div>

              <FormField
                control={form.control}
                name="ministry_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Ministérios</FormLabel>
                    <Popover open={ministriesOpen} onOpenChange={setMinistriesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setMinistriesOpen(true)}
                        >
                          {field.value && field.value.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {field.value.map((id) => {
                                const m = ministries.find((mm) => mm.id === id);
                                if (!m) return null;
                                return (
                                  <Badge key={id} className="text-xs">
                                    {m.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Selecionar ministérios</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[28rem] p-0" align="start">
                        {ministries.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">Nenhum ministério cadastrado</div>
                        ) : (
                          <Command>
                            <CommandInput placeholder="Buscar ministérios..." />
                            <CommandList>
                              <CommandEmpty>Nenhum resultado</CommandEmpty>
                              <CommandGroup>
                                {ministries.map((ministry) => {
                                  const selected = (field.value || []).includes(ministry.id);
                                  return (
                                    <CommandItem
                                      key={ministry.id}
                                      onSelect={() => {
                                        const current = field.value || [];
                                        field.onChange(
                                          selected
                                            ? current.filter((v) => v !== ministry.id)
                                            : [...current, ministry.id]
                                        );
                                      }}
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: ministry.color || "#3b82f6" }}
                                      />
                                      {ministry.name}
                                      {selected && (
                                        <span className="ml-auto text-xs text-primary">selecionado</span>
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        )}
                        <div className="p-2 border-t flex justify-end">
                          <Button type="button" onClick={() => setMinistriesOpen(false)}>
                            OK
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

        {variant === 'dialog' ? (
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
              {loading ? 'Salvando...' : member ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        ) : (
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !form.formState.isValid}>
              {loading ? 'Convertendo...' : 'Converter'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  return (
    <>
      {variant === 'dialog' ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {member ? 'Editar Membro' : 'Novo Membro'}
              </DialogTitle>
              <DialogDescription>
                {member 
                  ? 'Atualize as informações do membro' 
                  : 'Preencha os dados do novo membro'}
              </DialogDescription>
            </DialogHeader>
            {formNode}
          </DialogContent>
        </Dialog>
      ) : (
        formNode
      )}

      <CreateCellModal
        open={showCreateCell}
        onOpenChange={setShowCreateCell}
        onSuccess={handleCellCreated}
      />
    </>
  );
}
