
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CellWithDetails, CellStatus } from "@/types/cell";
import { toast } from "sonner";
import { useChurchId } from "@/hooks/useChurchId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CellFormData } from "@/schemas/cellSchema";
import { Member } from "@/types/member";

interface UseCellsReturn {
    cells: CellWithDetails[];
    loading: boolean;
    createCell: (data: CellFormData) => Promise<boolean>;
    updateCell: (id: string, data: Partial<CellFormData>) => Promise<boolean>;
    deleteCell: (id: string) => Promise<boolean>;
    addMemberToCell: (cellId: string, memberId: string) => Promise<boolean>;
    removeMemberFromCell: (memberId: string) => Promise<boolean>;
    getCellMembers: (cellId: string) => Promise<Member[]>;
    refreshCells: () => Promise<void>;
}

export function useCells(): UseCellsReturn {
    const { data: churchId } = useChurchId();
    const queryClient = useQueryClient();
    const [actionLoading, setActionLoading] = useState(false);

    const { data: cells = [], isLoading: queryLoading, refetch } = useQuery<CellWithDetails[]>({
        queryKey: ["cells", churchId],
        enabled: !!churchId,
        queryFn: async () => {
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
                .order("name");

            if (error) throw error;

            // Fetch member counts efficiently
            const cellsWithCount = await Promise.all(
                (cellsData || []).map(async (cell) => {
                    const { count } = await supabase
                        .from("members")
                        .select("id", { count: "exact", head: true })
                        .eq("cell_id", cell.id);

                    return {
                        ...cell,
                        status: cell.status as CellStatus,
                        member_count: count || 0,
                    } as CellWithDetails;
                })
            );

            return cellsWithCount;
        },
    });

    const refreshCells = async () => {
        await queryClient.invalidateQueries({ queryKey: ["cells", churchId] });
        await refetch();
    };

    const createCell = async (data: CellFormData) => {
        if (!churchId) {
            toast.error("Erro: Identificação da igreja não encontrada.");
            return false;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase.from("cells").insert({
                church_id: churchId,
                name: data.name,
                description: data.description || null,
                meeting_day: data.meeting_day || null,
                meeting_time: data.meeting_time || null,
                meeting_location: data.meeting_location || null,
                status: 'ativa',
            });

            if (error) throw error;

            toast.success("Célula criada com sucesso!");
            await refreshCells();
            return true;
        } catch (error) {
            console.error("Erro ao criar célula:", error);
            toast.error("Erro ao criar célula");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateCell = async (id: string, data: Partial<CellFormData>) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("cells")
                .update(data)
                .eq("id", id);

            if (error) throw error;

            toast.success("Célula atualizada com sucesso!");
            await refreshCells();
            return true;
        } catch (error) {
            console.error("Erro ao atualizar célula:", error);
            toast.error("Erro ao atualizar célula");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const deleteCell = async (id: string) => {
        setActionLoading(true);
        try {
            // Unassign members first
            await supabase
                .from("members")
                .update({ cell_id: null })
                .eq("cell_id", id);

            const { error } = await supabase
                .from("cells")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Célula excluída com sucesso!");
            await refreshCells();
            return true;
        } catch (error) {
            console.error("Erro ao remover célula:", error);
            toast.error("Erro ao remover célula");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const addMemberToCell = async (cellId: string, memberId: string) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("members")
                .update({ cell_id: cellId })
                .eq("id", memberId);

            if (error) throw error;

            toast.success("Membro adicionado à célula");
            await refreshCells();
            // Note: Components relying on cell member lists will need to refetch that specific list
            // This function returns true to signal success
            return true;
        } catch (error) {
            console.error("Erro ao vincular membro:", error);
            toast.error("Erro ao vincular membro");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const removeMemberFromCell = async (memberId: string) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("members")
                .update({ cell_id: null })
                .eq("id", memberId);

            if (error) throw error;

            toast.success("Membro removido da célula");
            await refreshCells();
            return true;
        } catch (error) {
            console.error("Erro ao remover membro:", error);
            toast.error("Erro ao remover membro");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const getCellMembers = async (cellId: string): Promise<Member[]> => {
        // Helper to fetch members just for a specific cell, often used in modals
        try {
            const { data, error } = await supabase
                .from("members")
                .select("id, full_name, email, phone, status, baptized, photo_url, cell_id")
                .eq("cell_id", cellId)
                .order("full_name");

            if (error) throw error;
            return (data || []) as Member[];
        } catch (error) {
            console.error("Erro ao buscar membros da célula:", error);
            return [];
        }
    };

    return {
        cells,
        loading: queryLoading || actionLoading,
        createCell,
        updateCell,
        deleteCell,
        addMemberToCell,
        removeMemberFromCell,
        getCellMembers,
        refreshCells
    };
}
