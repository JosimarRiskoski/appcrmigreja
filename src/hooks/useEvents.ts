
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useChurchId } from "@/hooks/useChurchId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventFormData } from "@/schemas/eventSchema";
import { format, startOfDay, endOfDay } from "date-fns";

const FEATURED_MARK = "[FEATURED]";
const withFeatured = (desc: string | null, featured: boolean) => {
    const base = desc || "";
    const cleaned = base.replace(FEATURED_MARK, "").trim();
    return featured ? `${FEATURED_MARK} ${cleaned}`.trim() : (cleaned || null);
};

export interface DbEvent {
    id: string;
    title: string;
    event_date: string;
    end_date: string | null;
    location: string | null;
    description: string | null;
}

interface UseEventsReturn {
    events: DbEvent[];
    loading: boolean;
    createEvent: (data: EventFormData) => Promise<boolean>;
    updateEvent: (id: string, data: EventFormData) => Promise<boolean>;
    deleteEvent: (id: string) => Promise<boolean>;
    refreshEvents: () => Promise<void>;
    checkConflicts: (date: Date, eventId?: string) => Promise<{ conflict: boolean; count: number; sameDayEvents: DbEvent[] }>;
    attendanceCounts: Record<string, number>;
}

export function useEvents(): UseEventsReturn {
    const { data: churchId } = useChurchId();
    const queryClient = useQueryClient();
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch Events
    const { data: events = [], isLoading: queryLoading, refetch } = useQuery<DbEvent[]>({
        queryKey: ["events", churchId],
        enabled: !!churchId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('id, title, event_date, end_date, location, description')
                .eq('church_id', churchId as string)
                .order('event_date', { ascending: true });

            if (error) throw error;
            return (data || []) as DbEvent[];
        },
    });

    // Fetch Attendance
    const { data: attendanceCounts = {} } = useQuery<Record<string, number>>({
        queryKey: ["eventAttendanceCounts", churchId, events.map(e => e.id)],
        enabled: !!churchId && events.length > 0,
        queryFn: async () => {
            const ids = events.map(e => e.id);
            const { data: att } = await supabase
                .from('event_attendance')
                .select('event_id')
                .in('event_id', ids);

            const map: Record<string, number> = {};
            (att || []).forEach(a => {
                map[a.event_id] = (map[a.event_id] || 0) + 1;
            });
            return map;
        },
    });

    const refreshEvents = async () => {
        await queryClient.invalidateQueries({ queryKey: ["events", churchId] });
        await refetch();
    };

    const combineDateTime = (date: Date, time: string) => {
        const [h, m] = time.split(":").map(Number);
        const dt = new Date(date);
        dt.setHours(h, m, 0, 0);
        return dt;
    };

    const checkConflicts = async (date: Date, eventId?: string) => {
        if (!churchId) return { conflict: false, count: 0, sameDayEvents: [] };

        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        let query = supabase
            .from("events")
            .select("*")
            .eq("church_id", churchId)
            .gte("event_date", dayStart)
            .lt("event_date", dayEnd);

        if (eventId) {
            query = query.neq("id", eventId);
        }

        const { data } = await query;
        const count = (data || []).length;
        return {
            conflict: count > 0,
            count,
            sameDayEvents: (data || []) as DbEvent[]
        };
    };

    const createEvent = async (data: EventFormData) => {
        if (!churchId) {
            toast.error("Erro: ID da igreja não encontrado.");
            return false;
        }
        setActionLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const start = combineDateTime(data.date, data.time);
            const end = combineDateTime(data.endDate, data.endTime);

            // Check for exact duplicate (same title and time)
            const { data: existingExact } = await supabase
                .from("events")
                .select("id")
                .eq("church_id", churchId)
                .eq("title", data.title)
                .eq("event_date", start.toISOString())
                .limit(1);

            if (existingExact && existingExact.length > 0) {
                toast.error("Já existe um evento com o mesmo título e horário");
                return false;
            }

            const eventData = {
                church_id: churchId,
                title: data.title,
                event_date: start.toISOString(),
                end_date: end.toISOString(),
                location: data.location ? data.location : null,
                description: withFeatured(data.description ? data.description : null, !!data.featured),
                created_by: user.id,
            };

            const { error } = await supabase
                .from("events")
                .insert(eventData);

            if (error) throw error;

            toast.success("Evento criado com sucesso!");
            await refreshEvents();
            return true;
        } catch (error) {
            console.error("Erro ao criar evento:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao criar evento");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateEvent = async (id: string, data: EventFormData) => {
        if (!churchId) return false;
        setActionLoading(true);
        try {
            const start = combineDateTime(data.date, data.time);
            const end = combineDateTime(data.endDate, data.endTime);

            const eventData = {
                title: data.title,
                event_date: start.toISOString(),
                end_date: end.toISOString(),
                location: data.location ? data.location : null,
                description: withFeatured(data.description ? data.description : null, !!data.featured),
            };

            const { error } = await supabase
                .from("events")
                .update(eventData)
                .eq("id", id);

            if (error) throw error;

            toast.success("Evento atualizado com sucesso!");
            await refreshEvents();
            return true;
        } catch (error) {
            console.error("Erro ao atualizar evento:", error);
            toast.error("Erro ao atualizar evento");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const deleteEvent = async (id: string) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Evento excluído com sucesso");
            await refreshEvents();
            return true;
        } catch (error) {
            console.error("Erro ao excluir evento:", error);
            toast.error("Erro ao excluir evento");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        events,
        loading: queryLoading || actionLoading,
        createEvent,
        updateEvent,
        deleteEvent,
        refreshEvents,
        checkConflicts,
        attendanceCounts
    };
}
