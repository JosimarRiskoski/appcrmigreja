import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const body = await req.json();
    const target_email = String(body?.target_email || "").trim();
    const church_id = String(body?.church_id || "").trim();
    const grant_admin = body?.grant_admin !== false;
    const grant_all_pages = body?.grant_all_pages !== false;

    if (!target_email || !church_id) return new Response("Bad Request", { status: 400 });

    const { data: church } = await admin
      .from("churches")
      .select("id")
      .eq("id", church_id)
      .maybeSingle();
    if (!church?.id) {
      return new Response(JSON.stringify({ error: "church_not_found" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let userId: string | null = null;

    const { data: created } = await admin.auth.admin.createUser({
      email: target_email,
      password: "123456",
      email_confirm: true,
    });
    userId = created?.user?.id || null;

    if (!userId) {
      const { data: list } = await admin.auth.admin.listUsers({ email: target_email });
      userId = list?.users?.[0]?.id || null;
    }
    if (!userId) return new Response(JSON.stringify({ error: "Unable to resolve user id" }), { status: 500, headers: { "Content-Type": "application/json" } });

    if (grant_admin) {
      const { error: upErr } = await admin
        .from("profiles")
        .upsert({ id: userId, church_id, role: "admin" }, { onConflict: "id" });
      if (upErr) {
        return new Response(JSON.stringify({ error: String(upErr.message || upErr) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (grant_all_pages) {
      const { data: pages } = await admin.from("pages").select("id");
      const ids = ((pages || []) as Array<{ id: string }>).map((p) => p.id);
      const payload = ids.map((page_id) => ({ user_id: userId!, page_id, allowed: true }));
      if (payload.length) {
        const { error: upPagesErr } = await admin.from("user_pages").upsert(payload, { onConflict: "user_id,page_id" });
        if (upPagesErr) {
          return new Response(JSON.stringify({ error: String(upPagesErr.message || upPagesErr) }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }

    return new Response(JSON.stringify({ user_id: userId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
