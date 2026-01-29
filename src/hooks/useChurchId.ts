import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Options = { userId?: string; enabled?: boolean };

export function useChurchId(options?: Options) {
  return useQuery<string | null>({
    queryKey: ["church_id", options?.userId ?? "current"],
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = options?.userId ?? session?.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", uid)
        .maybeSingle();
      if (error) {
        console.error("Error fetching church_id:", error);
        return null;
      }
      return data?.church_id ?? null;
    },
  });
}
