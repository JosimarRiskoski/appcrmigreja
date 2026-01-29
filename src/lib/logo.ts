import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string | null>();
const TTL_MS = 5 * 60 * 1000;
const timestamps = new Map<string, number>();

export async function getChurchLogo(churchId: string): Promise<string | null> {
  if (!churchId) return null;
  const now = Date.now();
  const ts = timestamps.get(churchId) || 0;
  if (cache.has(churchId) && now - ts < TTL_MS) {
    return cache.get(churchId) ?? null;
  }

  try {
    const { data } = await supabase
      .from("churches")
      .select("logo_path, logo_url")
      .eq("id", churchId)
      .single();

    const record = (data || {}) as { logo_path?: string | null; logo_url?: string | null };
    let url: string | null = null;

    if (record.logo_path && typeof record.logo_path === "string") {
      const { data: pub } = supabase.storage.from("church-logos").getPublicUrl(record.logo_path);
      url = pub?.publicUrl ?? null;
    } else if (record.logo_url && typeof record.logo_url === "string") {
      url = record.logo_url;
    } else {
      const { data: items } = await supabase.storage.from("church-logos").list(churchId, { limit: 10 });
      const logos = (items || []).filter(i => i.name.startsWith("logo_") && !i.name.startsWith("banner"));
      const first = logos[0] || (items || [])[0];
      if (first) {
        const fullPath = `${churchId}/${first.name}`;
        const { data: pub } = supabase.storage.from("church-logos").getPublicUrl(fullPath);
        url = pub?.publicUrl ?? null;
      }
    }

    cache.set(churchId, url);
    timestamps.set(churchId, now);
    return url;
  } catch {
    cache.set(churchId, null);
    timestamps.set(churchId, now);
    return null;
  }
}

export function clearChurchLogoCache(churchId?: string) {
  if (churchId) {
    cache.delete(churchId);
    timestamps.delete(churchId);
  } else {
    cache.clear();
    timestamps.clear();
  }
}
