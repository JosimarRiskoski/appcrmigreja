import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member, LayoutType } from "@/types/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Search, X, Mail, Phone, Calendar, CalendarCheck, Users, CheckCircle, MapPin, FileText, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MemberCard } from "@/components/members/MemberCard";
import { DeleteMemberModal } from "@/components/members/DeleteMemberModal";
import { EmptyState } from "@/components/members/EmptyState";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LAYOUT_STORAGE_KEY = 'graceHubMembersLayoutPreference';

export default function Membros() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cellIdFilter = searchParams.get('cell_id');
  
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const membersQuery = useQuery<Member[]>({
    queryKey: ["members", churchId, cellIdFilter],
    enabled: !!churchId,
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select(`
          *,
          cell:cells!members_cell_id_fkey(
            id,
            name,
            leader_id,
            meeting_day,
            meeting_time,
            meeting_location
          )
        `)
        .eq('church_id', churchId as string)
        .neq('status', 'visitante');

      if (cellIdFilter) {
        query = query.eq('cell_id', cellIdFilter);
      }

      const { data, error } = await query.order('full_name');
      if (error) throw error;
      return (data || []) as Member[];
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved as LayoutType) || 'medium';
  });
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [cellName, setCellName] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const cellNameQuery = useQuery<{ name: string } | null>({
    queryKey: ["cellName", cellIdFilter],
    enabled: !!cellIdFilter,
    queryFn: async () => {
      const { data } = await supabase
        .from('cells')
        .select('name')
        .eq('id', cellIdFilter as string)
        .single();
      return data ?? null;
    },
  });
  useEffect(() => {
    if (cellNameQuery.data?.name) {
      setCellName(cellNameQuery.data.name);
    } else {
      setCellName("");
    }
  }, [cellNameQuery.data?.name]);

  

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      toast.success(`${memberToDelete.full_name} foi removido`);
      queryClient.invalidateQueries({ queryKey: ["members", churchId] });
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      toast.error('Erro ao excluir membro');
    }
  };

  const handleEdit = (member: Member) => {
    setMemberToEdit(member);
    setShowAddModal(true);
  };

  const handleView = (member: Member) => {
    setSelectedMember(member);
    setOpenDetails(true);
  };

  const handleAddMember = () => {
    setMemberToEdit(null);
    setShowAddModal(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["members", churchId] });
    setShowAddModal(false);
    setMemberToEdit(null);
  };

  const filteredMembers = (membersQuery.data || []).filter(member => {
    const matchesSearch = !searchQuery || 
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortOrder === 'name') {
      return a.full_name.localeCompare(b.full_name);
    }
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  const gridClasses = {
    compact: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    medium: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    spaced: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
  };

  const statusFilters = [
    { value: 'all', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'inativo', label: 'Inativos' }
  ];

  if (churchLoading || membersQuery.isLoading) {
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
            <h1 className="text-3xl font-bold">Membros</h1>
            <p className="text-muted-foreground">Gerencie os membros da sua igreja</p>
          </div>
          <Button onClick={handleAddMember}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </div>

        {cellIdFilter && cellName && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-2">
              Filtrando por célula: {cellName}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => navigate('/membros')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={filterStatus === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filter.value as typeof filterStatus)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <LayoutSelector
            selectedLayout={selectedLayout}
            onLayoutChange={handleLayoutChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {sortedMembers.length} {sortedMembers.length === 1 ? 'membro' : 'membros'}
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

      {filteredMembers.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery}
          onAddMember={handleAddMember}
        />
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              layout={selectedLayout}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <DeleteMemberModal
        member={memberToDelete}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddMemberModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        member={memberToEdit}
        onSuccess={handleModalSuccess}
      />

      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Membro</SheetTitle>
          </SheetHeader>
          {selectedMember && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.photo_url || undefined} />
                  <AvatarFallback>
                    {selectedMember.full_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">{selectedMember.full_name}</div>
                  <div className="flex gap-2 items-center">
                    <Badge className={(selectedMember.status === 'ativo' ? 'bg-green-600' : 'bg-muted')}>{selectedMember.status}</Badge>
                    {selectedMember.baptized && <Badge variant="outline" className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Batizado</Badge>}
                  </div>
                </div>
              </div>
              {selectedMember.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{selectedMember.email}</span>
                </div>
              )}
              {selectedMember.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedMember.phone}</span>
                </div>
              )}
              {selectedMember.birth_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(selectedMember.birth_date), "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
              )}
              {selectedMember.member_since && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck className="h-4 w-4" />
                  <span>
                    Membro desde {format(new Date(selectedMember.member_since), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {selectedMember.cell && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedMember.cell.name}</span>
                  </div>
                  {selectedMember.cell.meeting_location && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedMember.cell.meeting_location}</span>
                    </div>
                  )}
                  {(selectedMember.cell.meeting_day || selectedMember.cell.meeting_time) && (
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {selectedMember.cell.meeting_day || ''}
                        {selectedMember.cell.meeting_day && selectedMember.cell.meeting_time ? ' · ' : ''}
                        {selectedMember.cell.meeting_time || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {(selectedMember.address || selectedMember.city || selectedMember.zip_code) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div className="min-w-0">
                    {selectedMember.address && (
                      <div className="whitespace-pre-wrap break-words">
                        {selectedMember.address}
                      </div>
                    )}
                    {(selectedMember.city || selectedMember.zip_code) && (
                      <div>
                        {selectedMember.city ? `${selectedMember.city}` : ''}
                        {selectedMember.city && selectedMember.zip_code ? ' · ' : ''}
                        {selectedMember.zip_code ? `CEP ${selectedMember.zip_code}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedMember.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span className="whitespace-pre-line">
                    {selectedMember.notes}
                  </span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
