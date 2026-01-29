import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ministry, LayoutType } from "@/types/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, UserPlus, Users as UsersIcon, Mail, Phone, Edit, UserMinus, CheckCircle, ArrowUpDown } from "lucide-react";
import { MinistryCard } from "@/components/ministries/MinistryCard";
import { DeleteMinistryModal } from "@/components/ministries/DeleteMinistryModal";
import { EmptyState } from "@/components/ministries/EmptyState";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { AddMinistryModal } from "@/components/ministries/AddMinistryModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Member } from "@/types/member";
import { useChurchId } from "@/hooks/useChurchId";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const LAYOUT_STORAGE_KEY = 'graceHubMinistriesLayoutPreference';

export default function Ministerios() {
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const ministriesQuery = useQuery<Ministry[]>({
    queryKey: ["ministries", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:members!ministries_leader_id_fkey(
            id,
            full_name,
            photo_url
          ),
          ministry_members(
            member_id,
            ministry_id,
            joined_at
          )
        `)
        .eq('church_id', churchId as string)
        .order('name');
      if (error) throw error;
      return (data || []) as Ministry[];
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved as LayoutType) || 'medium';
  });
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ministryToEdit, setMinistryToEdit] = useState<Ministry | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ministryMembers, setMinistryMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  };

  const handleDeleteClick = (ministry: Ministry) => {
    setMinistryToDelete(ministry);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!ministryToDelete) return;

    try {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', ministryToDelete.id);

      if (error) throw error;

      toast.success(`${ministryToDelete.name} foi removido`);
      queryClient.invalidateQueries({ queryKey: ["ministries", churchId] });
      setShowDeleteModal(false);
      setMinistryToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir ministério:', error);
      toast.error('Erro ao excluir ministério');
    }
  };

  const handleEdit = (ministry: Ministry) => {
    setMinistryToEdit(ministry);
    setShowAddModal(true);
  };

  const handleAddMinistry = () => {
    setMinistryToEdit(null);
    setShowAddModal(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["ministries", churchId] });
    setShowAddModal(false);
    setMinistryToEdit(null);
  };

  const handleView = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setDetailsOpen(true);
    setAddingMember(false);
    void loadMinistryMembers(ministry);
  };

  const loadMinistryMembers = async (ministry: Ministry) => {
    setMembersLoading(true);
    setMinistryMembers([]);
    try {
      const { data, error } = await supabase
        .from('ministry_members')
        .select(`member:members(id, full_name, email, phone, status, photo_url, baptized)`) 
        .eq('ministry_id', ministry.id)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as { member: Member | null }[];
      const members = rows.map((mm) => mm.member).filter((m): m is Member => !!m);
      setMinistryMembers(members);
    } catch (error) {
      console.error('Erro ao carregar membros do ministério:', error);
      toast.error('Erro ao carregar membros do ministério');
    } finally {
      setMembersLoading(false);
    }
  };

  const loadEligibleMembers = async () => {
    if (!churchId) return;
    setEligibleLoading(true);
    try {
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, full_name, email, phone, status, photo_url')
        .eq('church_id', churchId as string)
        .eq('status', 'ativo')
        .order('full_name');
      if (membersError) throw membersError;

      const { data: linked, error: linkedError } = await supabase
        .from('ministry_members')
        .select('member_id');
      if (linkedError) throw linkedError;

      const linkedRows = (linked || []) as { member_id: string }[];
      const linkedIds = new Set(linkedRows.map((l) => l.member_id));
      const all = (allMembers || []) as Member[];
      const eligible = all.filter((m) => !linkedIds.has(m.id));
      setEligibleMembers(eligible);
    } catch (error) {
      console.error('Erro ao carregar membros elegíveis:', error);
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleStartAddMember = async () => {
    if (addingMember) {
      setAddingMember(false);
      setEligibleMembers([]);
      setEligibleSearch("");
      return;
    }
    await loadEligibleMembers();
    setAddingMember(true);
  };

  const handleAssignMember = async (memberId: string) => {
    if (!selectedMinistry) return;
    try {
      const { error } = await supabase
        .from('ministry_members')
        .insert({ ministry_id: selectedMinistry.id, member_id: memberId });
      if (error) throw error;
      const added = eligibleMembers.find((m) => m.id === memberId);
      setMinistryMembers(added ? [added, ...ministryMembers] : ministryMembers);
      setEligibleMembers(eligibleMembers.filter((m) => m.id !== memberId));
      toast.success('Membro adicionado ao ministério');
      queryClient.invalidateQueries({ queryKey: ['ministries', churchId] });
    } catch (err) {
      console.error('Erro ao vincular membro:', err);
      toast.error('Erro ao vincular membro');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedMinistry) return;
    try {
      const { error } = await supabase
        .from('ministry_members')
        .delete()
        .eq('ministry_id', selectedMinistry.id)
        .eq('member_id', memberId);
      if (error) throw error;
      const removed = ministryMembers.find((m) => m.id === memberId);
      setMinistryMembers(ministryMembers.filter((m) => m.id !== memberId));
      if (removed) setEligibleMembers([removed, ...eligibleMembers]);
      toast.success('Membro removido do ministério');
      queryClient.invalidateQueries({ queryKey: ['ministries', churchId] });
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      toast.error('Erro ao remover membro');
    }
  };

  const filteredMinistries = (ministriesQuery.data || []).filter(ministry => {
    const matchesSearch = !searchQuery || 
      ministry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ministry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ministry.leader?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const sortedMinistries = [...filteredMinistries].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  const gridClasses = {
    compact: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    medium: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    spaced: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
  };

  if (churchLoading || ministriesQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ministérios</h1>
            <p className="text-muted-foreground">Gerencie os ministérios da sua igreja</p>
          </div>
          <Button onClick={handleAddMinistry}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ministério
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministérios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <LayoutSelector
            selectedLayout={selectedLayout}
            onLayoutChange={handleLayoutChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {sortedMinistries.length} {sortedMinistries.length === 1 ? 'ministério' : 'ministérios'}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
              <SelectTrigger className="h-8 w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais novos</SelectItem>
                <SelectItem value="oldest">Mais velhos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredMinistries.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery}
          onAddMinistry={handleAddMinistry}
        />
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedMinistries.map((ministry) => (
            <MinistryCard
              key={ministry.id}
              ministry={ministry}
              layout={selectedLayout}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <DeleteMinistryModal
        ministry={ministryToDelete}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddMinistryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        ministry={ministryToEdit}
        onSuccess={handleModalSuccess}
      />

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          {selectedMinistry && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>Detalhes do Ministério</SheetTitle>
              </SheetHeader>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedMinistry.color }} />
                <h3 className="font-semibold text-lg truncate">{selectedMinistry.name}</h3>
              </div>
              {selectedMinistry.description && (
                <p className="text-sm text-muted-foreground">{selectedMinistry.description}</p>
              )}

              <div className="flex items-center gap-2">
                <Button variant={addingMember ? 'default' : 'outline'} size="sm" onClick={handleStartAddMember}>
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar membro
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setMinistryToEdit(selectedMinistry); setShowAddModal(true); }}>
                  <Edit className="mr-2 h-4 w-4" /> Editar ministério
                </Button>
              </div>

              {addingMember && (
                <div className="space-y-2">
                  <Command>
                    <CommandInput placeholder="Buscar membros disponíveis" value={eligibleSearch} onValueChange={setEligibleSearch} />
                    <CommandList>
                      <CommandEmpty>Nenhum resultado</CommandEmpty>
                      <CommandGroup heading="Membros disponíveis">
                        {eligibleLoading ? (
                          <div className="space-y-2 p-2">
                            <Skeleton className="h-8" />
                            <Skeleton className="h-8" />
                          </div>
                        ) : (
                          (eligibleMembers.filter((m) => m.full_name.toLowerCase().includes(eligibleSearch.toLowerCase()))).map((m) => (
                            <CommandItem key={m.id} onSelect={() => handleAssignMember(m.id)}>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={m.photo_url || undefined} />
                                  <AvatarFallback>{m.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{m.full_name}</div>
                                  {m.email ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span>{m.email}</span>
                                    </div>
                                  ) : m.phone ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{m.phone}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <span className="ml-auto flex items-center gap-1 text-xs text-primary"><UserPlus className="h-3 w-3" /> adicionar</span>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  <span>{ministryMembers.length} {ministryMembers.length === 1 ? 'membro' : 'membros'}</span>
                </div>
                {membersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {ministryMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-2 rounded border">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.photo_url || undefined} />
                          <AvatarFallback>{m.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{m.full_name}</span>
                            <Badge variant="secondary" className="text-xs capitalize">{m.status}</Badge>
                            {m.baptized && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" /> Batizado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {m.email && (
                              <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{m.email}</span>
                            )}
                            {m.phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>
                            )}
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveMember(m.id)}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover do ministério</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                    {ministryMembers.length === 0 && (
                      <div className="text-sm text-muted-foreground">Nenhum membro neste ministério</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
