import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChurchId } from "@/hooks/useChurchId";

type Role = { id: string; name?: string | null; code?: string | null };
type Page = { key?: string | null; label?: string | null; path?: string | null; category?: string | null };
type Permission = { code: string | null };
type UserRole = "admin" | "lider" | "membro" | null;
type ProfileRow = { id: string; role_id: string | null; church_id: string | null; role: UserRole };

export function usePermissions() {
  const { data: churchId } = useChurchId();
  const [role, setRole] = useState<Role | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role_id, church_id, role")
          .eq("id", user.id)
          .maybeSingle();
        const profileRow = (profile || null) as ProfileRow | null;
        const role_id = profileRow?.role_id ?? null;
        const currentChurchId = profileRow?.church_id ?? churchId;
        setProfileExists(!!profileRow?.id);
        setUserRole(profileRow?.role || null);

        let roleRow: Role | null = null;
        if (role_id) {
          const { data: r } = await supabase
            .from("roles")
            .select("id, name, code")
            .eq("id", role_id)
            .maybeSingle();
          roleRow = (r as Role | null) || null;
          setRole(roleRow);
        } else {
          setRole(null);
        }

        let codes: string[] = [];
        if (role_id) {
          const { data: rolePerms } = await supabase
            .from("role_permissions")
            .select("permission:permissions(code)")
            .eq("role_id", role_id)
            .eq("church_id", currentChurchId as string);
          const rolePermRows = (rolePerms || []) as Array<{ permission: Permission | null }>;
          codes = rolePermRows
            .map((rp) => rp.permission?.code)
            .filter((c): c is string => !!c);
        }
        setPermissions(codes);

        const admin = (profileRow?.role === "admin") || ((roleRow?.code || roleRow?.name || "").toLowerCase() === "admin") || codes.includes("admin_all");
        if (admin) {
          const { data: allPages } = await supabase
            .from("pages")
            .select("*")
            .order("category")
            .order("path");
          setPages(((allPages || []) as Page[]).filter((p) => !!p.path || !!p.key));
        } else if (role_id) {
          const { data: rolePages } = await supabase
            .from("role_pages")
            .select("page:pages(*)")
            .eq("role_id", role_id)
            .eq("church_id", currentChurchId as string);
          const rolePagesRows = (rolePages || []) as Array<{ page: Page | null }>;
          const resolvedPages = rolePagesRows
            .map((rp) => rp.page)
            .filter((p): p is Page => !!p && (!!p.path || !!p.key));
          setPages(resolvedPages);
        } else {
          setPages([]);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [churchId]);

  const isAdmin = useMemo(() => {
    const code = role?.code?.toLowerCase();
    const name = role?.name?.toLowerCase();
    return userRole === "admin" || code === "admin" || name === "admin" || permissions.includes("admin_all");
  }, [role, permissions, userRole]);

  return { role, pages, permissions, isAdmin, loading };
}

export function can(perm: string, isAdmin: boolean, permissions: string[]) {
  if (isAdmin) return true;
  return permissions.includes(perm);
}
