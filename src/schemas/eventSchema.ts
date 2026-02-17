
import * as z from "zod";

export const eventSchema = z.object({
    title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
    date: z.date({ required_error: "Selecione a data de início" }),
    time: z.string().min(5, "Informe o horário de início no formato HH:mm"),
    endDate: z.date({ required_error: "Selecione a data de fim" }),
    endTime: z.string().min(5, "Informe o horário de fim no formato HH:mm"),
    location: z.string().optional(),
    description: z.string().optional(),
    featured: z.boolean().optional(),
}).refine((data) => {
    const s = new Date(data.date);
    const [sh, sm] = data.time.split(":").map(Number);
    s.setHours(sh, sm, 0, 0);

    const e = new Date(data.endDate);
    const [eh, em] = data.endTime.split(":").map(Number);
    e.setHours(eh, em, 0, 0);

    return e.getTime() >= s.getTime();
}, { message: "Fim do evento deve ser após o início", path: ["endTime"] });

export type EventFormData = z.infer<typeof eventSchema>;
