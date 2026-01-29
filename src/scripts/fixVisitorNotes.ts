import { supabase } from "@/integrations/supabase/client";
import { cleanNotes } from "@/lib/cleanNotes";

export async function fixVisitorNotes() {
  const { data: visitors, error } = await supabase
    .from("visitors")
    .select("id, notes");

  if (error) {
    console.error("Erro lendo visitantes:", error);
    return false;
  }

  for (const v of visitors || []) {
    const cleaned = cleanNotes(v.notes || "");
    if (cleaned !== (v.notes || "")) {
      await supabase
        .from("visitors")
        .update({ notes: cleaned })
        .eq("id", v.id);
    }
  }

  return true;
}

export async function fixMemberVisitorNotes() {
  const { data: members, error } = await supabase
    .from("members")
    .select("id, notes, status")
    .eq("status", "visitante");

  if (error) {
    console.error("Erro lendo membros (visitantes fallback):", error);
    return false;
  }

  for (const m of members || []) {
    const cleaned = cleanNotes(m.notes || "");
    if (cleaned !== (m.notes || "")) {
      await supabase
        .from("members")
        .update({ notes: cleaned })
        .eq("id", m.id);
    }
  }

  return true;
}