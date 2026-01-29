import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CellCard } from "@/components/cells/CellCard";
import { EmptyState } from "@/components/cells/EmptyState";
import { AddCellModal } from "@/components/cells/AddCellModal";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { DeleteCellModal } from "@/components/cells/DeleteCellModal";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { CellWithDetails, CellStatus, LayoutType } from "@/types/cell";
import { Plus, Search, ArrowUpDown, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, CheckCircle, Users as UsersIcon, UserMinus } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Member } from "@/types/member";

export default function Celulas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  const cellsQuery = useQuery<CellWithDetails[]>({
    queryKey: ["cells", churchId],
    enabled: !!churchId,
    queryFn: async ({ signal }) => {
      const { data: cellsData, error } = await supabase
        .from("cells")
        .select(`
          *,
          leader:members!cells_leader_id_fkey(
            id,
            full_name,
            phone,
            photo_url
          )
        `)
        .eq("church_id", churchId as string)
        .order("name")
        .abortSignal(signal as AbortSignal);
      if (error) throw error;
      const cellsWithCount = await Promise.all(
        (cellsData || []).map(async (cell) => {
          const { count } = await supabase
            .from("members")
            .select("id", { count: "exact", head: true })
            .eq("cell_id", cell.id)
            .abortSignal(signal as AbortSignal);
          return {
            ...cell,
            status: cell.status as CellStatus,
            member_count: count || 0,
          } as CellWithDetails;
        })
      );
      return cellsWithCount as CellWithDetails[];
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CellStatus>("all");
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem("graceHubCellsLayoutPreference");
    return (saved as LayoutType) || "medium";
  });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [cellToDelete, setCellToDelete] = useState<CellWithDetails | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cellToEdit, setCellToEdit] = useState<CellWithDetails | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [cellForMembers, setCellForMembers] = useState<CellWithDetails | null>(null);
  const [cellMembers, setCellMembers] = useState<Member[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const membersControllerRef = useRef<AbortController | null>(null);
  const eligibleControllerRef = useRef<AbortController | null>(null);
  

  const handleAddCell = () => {
    setCellToEdit(null);
    setShowAddModal(true);
  };

  const handleEdit = (cell: CellWithDetails) => {
    setCellToEdit(cell);
    setShowAddModal(true);
  };

  const handleDeleteClick = (cell: CellWithDetails) => {
    setCellToDelete(cell);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!cellToDelete) return;

    try {
      await supabase
        .from("members")
        .update({ cell_id: null })
        .eq("cell_id", cellToDelete.id);

      const { error } = await supabase
        .from("cells")
        .delete()
        .eq("id", cellToDelete.id);

      if (error) throw error;

      toast.success("Célula excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
    } catch (error) {
      console.error("Erro ao excluir célula:", error);
      toast.error("Erro ao excluir célula");
    } finally {
      setShowDeleteModal(false);
      setCellToDelete(null);
    }
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem("graceHubCellsLayoutPreference", layout);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
    setCellToEdit(null);
  };

  const filteredCells = (cellsQuery.data || []).filter((cell) => {
    if (filterStatus !== "all" && cell.status !== filterStatus) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cell.name.toLowerCase().includes(query) ||
        cell.leader?.full_name.toLowerCase().includes(query) ||
        cell.meeting_location?.toLowerCase().includes(query) ||
        cell.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const sortedCells = [...filteredCells].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  const handleViewMembers = async (cell: CellWithDetails) => {
    setCellForMembers(cell);
    setMembersOpen(true);
    setAddingMember(false);
    setMembersLoading(true);
    setCellMembers([]);
    if (membersControllerRef.current) membersControllerRef.current.abort();
    membersControllerRef.current = new AbortController();
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, email, phone, status, baptized, photo_url")
        .eq("cell_id", cell.id)
        .order("full_name")
        .abortSignal(membersControllerRef.current.signal);
      if (error) throw error;
      setCellMembers((data || []) as Member[]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Erro ao carregar membros da célula:", error);
      toast.error("Erro ao carregar membros da célula");
    } finally {
      setMembersLoading(false);
    }
  };

  const loadEligibleMembers = async () => {
    if (!churchId) return;
    if (eligibleControllerRef.current) eligibleControllerRef.current.abort();
    eligibleControllerRef.current = new AbortController();
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, email, phone, status, baptized, photo_url, cell_id")
        .eq("church_id", churchId as string)
        .eq("status", "ativo")
        .is("cell_id", null)
        .order("full_name")
        .abortSignal(eligibleControllerRef.current.signal);
      if (error) throw error;
      setEligibleMembers((data || []) as Member[]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Erro ao carregar membros elegíveis:", error);
    }
  };

  const handleAddMemberToCell = async (cell: CellWithDetails) => {
    setCellForMembers(cell);
    setMembersOpen(true);
    setAddingMember(true);
    await loadEligibleMembers();
  };

  const handleAssignMember = async (memberId: string) => {
    if (!cellForMembers) return;
    try {
      const { error } = await supabase
        .from("members")
        .update({ cell_id: cellForMembers.id })
        .eq("id", memberId);
      if (error) throw error;
      const added = eligibleMembers.find((m) => m.id === memberId);
      const nextMembers = added ? [...cellMembers, added] : cellMembers;
      setCellMembers(nextMembers);
      setEligibleMembers(eligibleMembers.filter((m) => m.id !== memberId));
      toast.success("Membro adicionado à célula");
      queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
    } catch (err) {
      console.error("Erro ao vincular membro:", err);
      toast.error("Erro ao vincular membro");
    }
  };

  const handleRemoveMemberFromCell = async (memberId: string) => {
    if (!cellForMembers) return;
    try {
      const { error } = await supabase
        .from("members")
        .update({ cell_id: null })
        .eq("id", memberId);
      if (error) throw error;
      const removed = cellMembers.find((m) => m.id === memberId);
      setCellMembers(cellMembers.filter((m) => m.id !== memberId));
      if (removed) setEligibleMembers([...eligibleMembers, removed]);
      toast.success("Membro removido da célula");
      queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      toast.error("Erro ao remover membro");
    }
  };

  const handleAddNewMemberModal = (cell: CellWithDetails) => {
    setCellForMembers(cell);
    setShowAddMemberModal(true);
  };

  const gridClasses = {
    compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
    medium: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    spaced: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
  };

  if (churchLoading || cellsQuery.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Células</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as células da sua igreja
          </p>
        </div>
        <Button onClick={handleAddCell}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Célula
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar células..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === "ativa" ? "default" : "outline"}
            onClick={() => setFilterStatus("ativa")}
            size="sm"
          >
            Ativas
          </Button>
          <Button
            variant={filterStatus === "inativa" ? "default" : "outline"}
            onClick={() => setFilterStatus("inativa")}
            size="sm"
          >
            Inativas
          </Button>
        </div>

        <LayoutSelector
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {sortedCells.length} {sortedCells.length === 1 ? 'célula' : 'células'}
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

      {sortedCells.length === 0 ? (
        <EmptyState
          hasSearch={searchQuery.length > 0 || filterStatus !== "all"}
          onAddClick={handleAddCell}
        />
      ) : (
        <div className={gridClasses[selectedLayout]}>
          {sortedCells.map((cell) => (
            <CellCard
              key={cell.id}
              cell={cell}
              layout={selectedLayout}
              actionsOrder={["delete", "edit", "view_members"]}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewMembers={handleViewMembers}
              onAddMember={handleAddMemberToCell}
            />
          ))}
        </div>
      )}

      <AddCellModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        cellToEdit={cellToEdit}
        onSuccess={handleModalSuccess}
      />

      <DeleteCellModal
        cell={cellToDelete}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <Sheet open={membersOpen} onOpenChange={(open) => {
        setMembersOpen(open);
        if (!open) {
          setCellForMembers(null);
          setCellMembers([]);
          setEligibleMembers([]);
          setAddingMember(false);
          setMembersLoading(false);
          setEligibleLoading(false);
          if (membersControllerRef.current) membersControllerRef.current.abort();
          if (eligibleControllerRef.current) eligibleControllerRef.current.abort();
        }
      }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {cellForMembers ? `Membros da ${cellForMembers.name}` : "Membros da Célula"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {cellForMembers && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>{cellMembers.length} membros</span>
              </div>
            )}

            {cellForMembers && (
              <div className="flex items-center gap-2">
                <Button variant={addingMember ? "default" : "outline"} size="sm" onClick={async () => { if (!addingMember) { setEligibleLoading(true); setEligibleMembers([]); await loadEligibleMembers(); setEligibleLoading(false); } setAddingMember((v) => !v); }}>
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar membro
                </Button>
                <Button variant="outline" size="sm" onClick={() => cellForMembers && handleAddNewMemberModal(cellForMembers)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Novo membro
                </Button>
              </div>
            )}

            {addingMember && (
              <div className="space-y-2">
                {eligibleLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : (
                  <Command>
                    <CommandInput placeholder="Buscar membros disponíveis" value={eligibleSearch} onValueChange={setEligibleSearch} />
                    <CommandList>
                      <CommandEmpty>Nenhum membro disponível</CommandEmpty>
                      <CommandGroup>
                        {eligibleMembers
                          .filter((m) => (m.full_name || "").toLowerCase().includes(eligibleSearch.toLowerCase()))
                          .map((m) => (
                            <CommandItem key={m.id} onSelect={() => handleAssignMember(m.id)}>
                              {m.full_name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </div>
            )}
            {membersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : cellMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum membro vinculado</div>
            ) : (
              cellMembers.map((m) => (
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
                          onClick={() => handleRemoveMemberFromCell(m.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remover da célula</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        member={null}
        onSuccess={async () => {
          setShowAddMemberModal(false);
          if (cellForMembers) await handleViewMembers(cellForMembers);
          queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
        }}
        prefillCellId={cellForMembers?.id}
      />
    </div>
  );
}
