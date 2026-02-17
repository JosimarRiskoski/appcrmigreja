
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member, Cell } from "@/types/member";
import { toast } from "sonner";
import { useChurchId } from "@/hooks/useChurchId";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UseMembersReturn {
    members: Member[];
    loading: boolean;
    createMember: (memberData: Omit<Member, "id" | "created_at" | "cell">) => Promise<Member | null>;
    updateMember: (id: string, memberData: Partial<Member>) => Promise<Member | null>;
    deleteMember: (id: string) => Promise<boolean>;
    uploadAvatar: (memberId: string, file: File) => Promise<string | null>;
    refreshMembers: () => Promise<void>;
}

export function useMembers(cellIdFilter?: string): UseMembersReturn {
    const { data: churchId } = useChurchId();
    const queryClient = useQueryClient();
    const [actionLoading, setActionLoading] = useState(false);

    const { data: members = [], isLoading: queryLoading, refetch } = useQuery<Member[]>({
        queryKey: ["members", churchId, cellIdFilter],
        enabled: !!churchId,
        queryFn: async () => {
            let query = supabase
                .from("members")
                .select(`
          *,
          cell:cells(id, name, leader_id, meeting_day, meeting_time, meeting_location)
        `)
                .eq("church_id", churchId as string)
                .order("full_name");

            if (cellIdFilter) {
                query = query.eq("cell_id", cellIdFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as unknown as Member[]) || [];
        },
    });

    const refreshMembers = async () => {
        await queryClient.invalidateQueries({ queryKey: ["members", churchId] });
        await refetch();
    };

    const createMember = async (memberData: Omit<Member, "id" | "created_at" | "cell">) => {
        if (!churchId) {
            toast.error("Erro: Identificação da igreja não encontrada.");
            return null;
        }

        setActionLoading(true);
        try {
            const dataToSave = { ...memberData, church_id: churchId };

            const { data, error } = await supabase
                .from("members")
                .insert(dataToSave)
                .select()
                .single();

            if (error) {
                if (error.message?.toLowerCase().includes("column")) {
                    const { zip_code, ...fallbackData } = dataToSave;
                    console.warn("Retrying creation without zip_code column", error);

                    const { data: retryData, error: retryError } = await supabase
                        .from("members")
                        .insert(fallbackData)
                        .select()
                        .single();

                    if (retryError) throw retryError;

                    toast.warning("Banco desatualizado (sem CEP). Membro criado parcialmente.");
                    await refreshMembers();
                    return retryData as Member;
                }
                throw error;
            }

            toast.success("Membro criado com sucesso!");
            await refreshMembers();
            return data as Member;
        } catch (error) {
            console.error("Erro ao criar membro:", error);
            toast.error("Erro ao criar membro");
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    const updateMember = async (id: string, memberData: Partial<Member>) => {
        setActionLoading(true);
        try {
            const { data, error } = await supabase
                .from("members")
                .update(memberData)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                if (error.message?.toLowerCase().includes("column")) {
                    const { zip_code, ...fallbackData } = memberData;
                    console.warn("Retrying update without zip_code column", error);

                    const { data: retryData, error: retryError } = await supabase
                        .from("members")
                        .update(fallbackData)
                        .eq("id", id)
                        .select()
                        .single();

                    if (retryError) throw retryError;

                    toast.warning("Banco desatualizado (sem CEP). Membro atualizado parcialmente.");
                    await refreshMembers();
                    return retryData as Member;
                }
                throw error;
            }

            toast.success("Membro atualizado com sucesso!");
            await refreshMembers();
            return data as Member;
        } catch (error) {
            console.error("Erro ao atualizar membro:", error);
            toast.error("Erro ao atualizar membro");
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    const deleteMember = async (id: string) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("members")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Membro removido com sucesso!");
            await refreshMembers();
            return true;
        } catch (error) {
            console.error("Erro ao remover membro:", error);
            toast.error("Erro ao remover membro");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const uploadAvatar = async (memberId: string, file: File): Promise<string | null> => {
        try {
            const filePath = `members/${memberId}/avatar_${crypto.randomUUID()}_${file.name}`;

            let bucket = 'church-logos';
            let { error: upErr } = await supabase.storage.from(bucket).upload(filePath, file, {
                upsert: true,
                contentType: file.type || 'application/octet-stream',
            });

            if (upErr && upErr.message.toLowerCase().includes('not found')) {
                bucket = 'media';
                const res = await supabase.storage.from(bucket).upload(filePath, file, {
                    upsert: true,
                    contentType: file.type || 'application/octet-stream',
                });
                upErr = res.error;
            }

            if (upErr) throw upErr;

            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return pub?.publicUrl ?? null;
        } catch (error) {
            console.error("Erro no upload de avatar:", error);
            return null;
        }
    };

    return {
        members,
        loading: queryLoading || actionLoading,
        createMember,
        updateMember,
        deleteMember,
        uploadAvatar,
        refreshMembers
    };
}
