import { useState, useEffect, useMemo } from "react";
import { Plus, Search, ArrowUpDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LayoutType, Event } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";
import { LayoutSelector } from "@/components/events/LayoutSelector";
import { DeleteEventModal } from "@/components/events/DeleteEventModal";
import { EmptyState } from "@/components/events/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddEventModal } from "@/components/events/AddEventModal";
import { format } from "date-fns";
import { useEvents, DbEvent } from "@/hooks/useEvents";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


const computeStatus = (d: Date): 'today' | 'upcoming' | 'week' | 'future' | 'past' => {
  const now = new Date();
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) return 'today';
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'past';
  if (diffDays <= 2) return 'upcoming';
  if (diffDays <= 7) return 'week';
  return 'future';
};

type FilterPeriod = 'all' | 'today' | 'week';

export default function Eventos() {
  const { toast } = useToast();
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(() => {
    return (localStorage.getItem('graceHubLayoutPreference') as LayoutType) || 'medium';
  });
  const queryClient = useQueryClient();
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  /* 
   * Integrating useEvents Hook
   * This replaces rawEventsQuery and attendanceQuery
   */
  const {
    events: eventsData,
    loading: eventsLoading,
    deleteEvent,
    attendanceCounts,
    refreshEvents
  } = useEvents();

  // State variables needed for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit & Details states
  // We use the shape from DbEvent but match what the UI expects or cast if needed.
  // The existing code expects a certain shape for eventToEdit, let's allow DbEvent or null.
  const [eventToEdit, setEventToEdit] = useState<DbEvent | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEventRaw, setSelectedEventRaw] = useState<DbEvent | null>(null);

  // Mapping compatibility for existing code patterns if needed, 
  // or refactoring downstream usage.
  // rawEventsQuery was: { data: [...] }
  const rawEventsQuery = {
    data: eventsData,
    isLoading: eventsLoading
  };

  // attendanceQuery was: { data: Record<string, number> }
  const attendanceQuery = {
    data: attendanceCounts
  };

  const handleEdit = (id: string) => {
    const raw = (rawEventsQuery.data || []).find(e => e.id === id) || null;
    setSelectedEventRaw(raw);
    setDetailsOpen(true);
  };

  const events: Event[] = useMemo(() => {
    const raw = rawEventsQuery.data || [];
    return raw.map(ev => {
      const d = new Date(ev.event_date);
      return {
        id: ev.id,
        title: ev.title,
        date: format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        time: format(d, "HH:mm"),
        location: ev.location || '',
        attendees: attendanceQuery.data[ev.id] || 0,
        status: computeStatus(d),
        description: ev.description || undefined,
      } as Event;
    });
  }, [rawEventsQuery.data, attendanceQuery.data]);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro de busca
      const matchesSearch = searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de período
      const matchesPeriod = filterPeriod === 'all' ||
        (filterPeriod === 'today' && event.status === 'today') ||
        (filterPeriod === 'week' && (event.status === 'week' || event.status === 'today' || event.status === 'upcoming'));

      return matchesSearch && matchesPeriod;
    });
  }, [events, searchQuery, filterPeriod]);

  const sortedEvents = useMemo(() => {
    const map = new Map((rawEventsQuery.data || []).map(e => [e.id, e.event_date]));
    return [...filteredEvents].sort((a, b) => {
      const aDate = map.get(a.id) ? new Date(map.get(a.id) as string).getTime() : 0;
      const bDate = map.get(b.id) ? new Date(map.get(b.id) as string).getTime() : 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [filteredEvents, rawEventsQuery.data, sortOrder]);

  const handleDeleteClick = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event) {
      setEventToDelete(event);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    // Use hook logic
    const success = await deleteEvent(eventToDelete.id);

    if (success) {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setShowAddModal(true);
  };

  const gridClasses = cn(
    "grid gap-4 transition-all duration-300",
    selectedLayout === 'compact' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
    selectedLayout === 'medium' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    selectedLayout === 'spaced' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
  );

  const hasFilters = searchQuery !== '' || filterPeriod !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Gerencie os eventos da igreja</p>
        </div>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary-hover"
          onClick={handleCreateEvent}
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Busca */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <Button
            variant={filterPeriod === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterPeriod('all')}
            className={cn(
              filterPeriod === 'all' && "bg-primary text-primary-foreground hover:bg-primary-hover"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filterPeriod === 'today' ? 'default' : 'outline'}
            onClick={() => setFilterPeriod('today')}
            className={cn(
              filterPeriod === 'today' && "bg-primary text-primary-foreground hover:bg-primary-hover"
            )}
          >
            Hoje
          </Button>
          <Button
            variant={filterPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setFilterPeriod('week')}
            className={cn(
              filterPeriod === 'week' && "bg-primary text-primary-foreground hover:bg-primary-hover"
            )}
          >
            Esta Semana
          </Button>


          {/* Seletor de Layout */}
          <LayoutSelector
            selectedLayout={selectedLayout}
            onLayoutChange={setSelectedLayout}
          />
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{sortedEvents.length}</span> eventos
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

      {/* Grid de Eventos ou Empty State */}
      {rawEventsQuery.isLoading || churchLoading ? null : filteredEvents.length > 0 ? (
        <div className={gridClasses}>
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={{ ...event, attendees: attendanceQuery.data?.[event.id] || 0 }}
              layout={selectedLayout}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={hasFilters}
          onCreateEvent={handleCreateEvent}
        />
      )}

      <DeleteEventModal
        isOpen={showDeleteModal}
        event={eventToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <AddEventModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        event={eventToEdit}
        onSuccess={() => {
          refreshEvents();
          setShowAddModal(false);
          setEventToEdit(null);
        }}
      />

      <EventDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        event={selectedEventRaw}
        onSaved={() => {
          refreshEvents();
          setDetailsOpen(false);
          setSelectedEventRaw(null);
        }}
      />
    </div>
  );
}

const FEATURED_MARK = "[FEATURED]";
const withFeatured = (desc: string | null, featured: boolean) => { const base = desc || ""; const cleaned = base.replace(FEATURED_MARK, "").trim(); return featured ? `${FEATURED_MARK} ${cleaned}`.trim() : (cleaned || null); };
const parseFeatured = (desc: string | null) => !!(desc || "").includes(FEATURED_MARK);

const eventDetailsSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  date: z.date({ required_error: "Selecione a data de início" }),
  time: z.string().min(5, "Informe o horário de início"),
  endDate: z.date({ required_error: "Selecione a data de fim" }),
  endTime: z.string().min(5, "Informe o horário de fim"),
  location: z.string().optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
}).refine((data) => {
  const s = new Date(data.date); const [sh, sm] = data.time.split(":").map(Number); s.setHours(sh, sm, 0, 0);
  const e = new Date(data.endDate); const [eh, em] = data.endTime.split(":").map(Number); e.setHours(eh, em, 0, 0);
  return e.getTime() >= s.getTime();
}, { message: "Fim do evento deve ser após o início", path: ["endTime"] });

type EventDetailsForm = z.infer<typeof eventDetailsSchema>;

function EventDetailsSheet({ open, onOpenChange, event, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; event: { id: string; title: string; event_date: string; end_date: string | null; location: string | null; description: string | null } | null; onSaved: () => void; }) {
  const form = useForm<EventDetailsForm>({ resolver: zodResolver(eventDetailsSchema), mode: 'onChange', defaultValues: { title: "", date: undefined, time: "", endDate: undefined, endTime: "", location: "", description: "", featured: false } });

  const combineDateTime = (date: Date, time: string) => { const [h, m] = time.split(":").map(Number); const dt = new Date(date); dt.setHours(h, m, 0, 0); return dt; };

  const [dateOpen, setDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  useEffect(() => {
    if (open && event) {
      const d = new Date(event.event_date);
      const e = event.end_date ? new Date(event.end_date) : d;
      form.reset({ title: event.title, date: d, time: format(d, "HH:mm"), endDate: e, endTime: format(e, "HH:mm"), location: event.location || "", description: (event.description || "").replace(FEATURED_MARK, "").trim(), featured: parseFeatured(event.description) });
    }
  }, [open, event, form]);

  const onSubmit = async (data: EventDetailsForm) => {
    if (!event) return;
    const startIso = combineDateTime(data.date, data.time).toISOString();
    const endIso = combineDateTime(data.endDate, data.endTime).toISOString();
    const { error } = await supabase
      .from('events')
      .update({ title: data.title, event_date: startIso, end_date: endIso, location: data.location || null, description: withFeatured(data.description || null, !!data.featured) })
      .eq('id', event.id);
    if (error) {
      console.error(error);
      return;
    }
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalhes do Evento</SheetTitle>
        </SheetHeader>
        {!event ? null : (
          <div className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destacar no site</FormLabel>
                    <FormControl>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                        Destacar
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Início</FormLabel>
                      <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "dd/MM/yyyy") : <div>Selecione a data</div>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fim</FormLabel>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "dd/MM/yyyy") : <div>Selecione a data</div>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de fim</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <SheetFooter>
                  <Button type="button" variant="cancel" onClick={() => onOpenChange(false)}>Fechar</Button>
                  <Button type="submit" disabled={!form.formState.isValid}>Salvar edição</Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
