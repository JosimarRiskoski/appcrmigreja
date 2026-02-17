
import * as z from "zod";

export const memberSchema = z.object({
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

export type MemberFormData = z.infer<typeof memberSchema>;
