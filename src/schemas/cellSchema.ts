import * as z from "zod";

export const cellSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    meeting_day: z.string().optional(),
    meeting_time: z.string().optional(),
    meeting_location: z.string().optional(),
});

export type CellFormData = z.infer<typeof cellSchema>;
