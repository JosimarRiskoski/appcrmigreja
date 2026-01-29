import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  Cake,
  Calendar,
  Droplet,
  Home,
  Heart,
  Activity,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import { MemberGrowthChart } from "@/components/dashboard/MemberGrowthChart";
import { MinistryDistributionChart } from "@/components/dashboard/MinistryDistributionChart";
import { MemberStatusChart } from "@/components/dashboard/MemberStatusChart";
import { BirthdaysWidget } from "@/components/dashboard/BirthdaysWidget";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";
import { RecentActivitiesWidget } from "@/components/dashboard/RecentActivitiesWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useChurchId } from "@/hooks/useChurchId";

const Dashboard = () => {
  const { data: churchId, isLoading: churchLoading } = useChurchId();
  type MemberLite = {
    id: string;
    status: string;
    baptized: boolean;
    cell_id: string | null;
    birth_date: string | null;
    full_name: string;
    photo_url: string | null;
    phone: string | null;
    member_since: string | null;
    created_at: string;
  };
  const membersQuery = useQuery<MemberLite[]>({
    queryKey: ["dashboardMembers", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("members")
        .select("id, status, baptized, cell_id, birth_date, full_name, photo_url, phone, member_since, created_at")
        .eq("church_id", churchId as string);
      return data || [];
    },
  });
  const ministriesStatsQuery = useQuery({
    queryKey: ["dashboardMinistriesStats", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: totalMinistries } = await supabase
        .from("ministries")
        .select("id", { count: "exact" })
        .eq("church_id", churchId as string);
      const { count: newMinistries } = await supabase
        .from("ministries")
        .select("id", { count: "exact" })
        .eq("church_id", churchId as string)
        .gte("created_at", thirtyDaysAgo.toISOString());
      return { totalMinistries: totalMinistries || 0, newMinistries: newMinistries || 0 };
    },
  });
  const cellsCountQuery = useQuery({
    queryKey: ["dashboardCellsCount", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { count } = await supabase
        .from("cells")
        .select("id", { count: "exact" })
        .eq("church_id", churchId as string)
        .eq("status", "ativa");
      return count || 0;
    },
  });
  const eventsStatsQuery = useQuery({
    queryKey: ["dashboardEventsStats", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { count, data } = await supabase
        .from("events")
        .select("event_date", { count: "exact" })
        .eq("church_id", churchId as string)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(1);
      return { upcomingEvents: count || 0, nextEventDate: data?.[0]?.event_date || null };
    },
  });
  const prayerStatsQuery = useQuery({
    queryKey: ["dashboardPrayerStats", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: openPrayers } = await supabase
        .from("prayer_requests")
        .select("id", { count: "exact" })
        .eq("church_id", churchId as string)
        .eq("status", "aberto");
      const { count: newPrayersThisWeek } = await supabase
        .from("prayer_requests")
        .select("id", { count: "exact" })
        .eq("church_id", churchId as string)
        .gte("created_at", sevenDaysAgo.toISOString());
      return { openPrayers: openPrayers || 0, newPrayersThisWeek: newPrayersThisWeek || 0 };
    },
  });
  const upcomingEventsQuery = useQuery({
    queryKey: ["dashboardUpcomingEvents", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .eq("church_id", churchId as string)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);
      return data || [];
    },
  });
  const trialStatusQuery = useQuery({
    queryKey: ["dashboardTrialStatus", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data: church } = await supabase
        .from("churches")
        .select("trial_end_date, current_plan")
        .eq("id", churchId as string)
        .single();
      if (church?.current_plan === "trial" && church.trial_end_date) {
        const endDate = new Date(church.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 ? daysLeft : 0;
      }
      return null as number | null;
    },
  });

  const stats = useMemo(() => {
    const members = membersQuery.data || [];
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "ativo").length;
    const baptizedMembers = members.filter((m) => m.baptized).length;
    const membersInCells = members.filter((m) => m.cell_id).length;
    const birthdaysThisMonth = members
      .filter((m) => m.birth_date)
      .filter((m) => new Date(m.birth_date as string).getMonth() + 1 === new Date().getMonth() + 1);
    const birthdaysToday = birthdaysThisMonth.filter((m) => new Date(m.birth_date as string).getDate() === new Date().getDate());
    return {
      totalMembers,
      activeMembers,
      baptizedMembers,
      baptizedPercentage: totalMembers > 0 ? Math.round((baptizedMembers / totalMembers) * 100) : 0,
      totalMinistries: ministriesStatsQuery.data?.totalMinistries || 0,
      newMinistries: ministriesStatsQuery.data?.newMinistries || 0,
      birthdaysCount: birthdaysThisMonth.length,
      birthdaysToday: birthdaysToday.length,
      upcomingEvents: eventsStatsQuery.data?.upcomingEvents || 0,
      nextEventDate: eventsStatsQuery.data?.nextEventDate || null,
      totalCells: cellsCountQuery.data || 0,
      membersInCells,
      openPrayers: prayerStatsQuery.data?.openPrayers || 0,
      newPrayersThisWeek: prayerStatsQuery.data?.newPrayersThisWeek || 0,
      activityRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    };
  }, [membersQuery.data, ministriesStatsQuery.data, eventsStatsQuery.data, cellsCountQuery.data, prayerStatsQuery.data]);

  const growthData = useMemo(() => {
    const members = membersQuery.data || [];
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const month = date.toLocaleString("pt-BR", { month: "short" });
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const membersUpToMonth = members.filter((m) => {
        const memberDate = new Date(m.member_since || m.created_at);
        return memberDate <= monthEnd;
      });
      const activeInMonth = membersUpToMonth.filter((m) => m.status === "ativo");
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        total: membersUpToMonth.length,
        active: activeInMonth.length,
      };
    });
    return monthlyData;
  }, [membersQuery.data]);

  type MinistryLite = {
    id: string;
    name: string;
    color: string | null;
    ministry_members: { member_id: string }[] | null;
  };
  const ministryDataQuery = useQuery<MinistryLite[]>({
    queryKey: ["dashboardMinistryDistribution", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ministries")
        .select(`id, name, color, ministry_members ( member_id )`)
        .eq("church_id", churchId as string);
      return data || [];
    },
  });
  const ministryData = useMemo(() => {
    const ministries = ministryDataQuery.data || [];
    return ministries
      .map((m) => ({ name: m.name, count: (m.ministry_members || []).length, color: m.color || "" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [ministryDataQuery.data]);

  const statusData = useMemo(() => {
    const members = membersQuery.data || [];
    const statusCount: Record<string, number> = {};
    members.forEach((m) => {
      statusCount[m.status] = (statusCount[m.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({ name: status, value: count, color: "" }));
  }, [membersQuery.data]);

  const birthdays = useMemo(() => {
    const members = (membersQuery.data || []).filter((m) => m.birth_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calculateDaysUntil = (birthDate: string): number => {
      const birth = new Date(birthDate);
      const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      const diffTime = thisYearBirthday.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const upcomingBirthdays = members
      .map((m) => ({ ...m, daysUntil: calculateDaysUntil(m.birth_date as string) }))
      .filter((m) => m.daysUntil >= 0 && m.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    return upcomingBirthdays as Array<{ id: string; full_name: string; birth_date: string; photo_url: string | null; phone?: string | null; daysUntil: number }>;
  }, [membersQuery.data]);

  const upcomingEvents = upcomingEventsQuery.data || [];

  const trialDaysLeft = trialStatusQuery.data ?? null;

  const formatNextEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo ao sistema de gestão da sua igreja
          </p>
        </div>
        <Button
          onClick={() => {
            if (!churchId) return;
            membersQuery.refetch();
            ministriesStatsQuery.refetch();
            cellsCountQuery.refetch();
            eventsStatsQuery.refetch();
            prayerStatsQuery.refetch();
            upcomingEventsQuery.refetch();
            trialStatusQuery.refetch();
          }}
          variant="outline"
          size="sm"
          disabled={churchLoading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${churchLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      

      {churchLoading || membersQuery.isLoading || ministriesStatsQuery.isLoading || cellsCountQuery.isLoading || eventsStatsQuery.isLoading || prayerStatsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Membros Totais"
            value={stats.totalMembers}
            subtitle={`${stats.activeMembers} ativos`}
            icon={Users}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
            trend={{
              value: `${stats.activityRate}%`,
              isPositive: stats.activityRate >= 50,
            }}
          />
          <StatCard
            title="Ministérios"
            value={stats.totalMinistries}
            subtitle={stats.newMinistries > 0 ? `+${stats.newMinistries} novos` : undefined}
            icon={Building2}
            iconColor="text-accent"
            iconBgColor="bg-accent/10"
          />
          <StatCard
            title="Aniversariantes"
            value={stats.birthdaysCount}
            subtitle={stats.birthdaysToday > 0 ? `${stats.birthdaysToday} hoje 🎉` : "Próximos 30 dias"}
            icon={Cake}
            iconColor={stats.birthdaysToday > 0 ? "text-red-600 dark:text-red-500" : "text-secondary"}
            iconBgColor={stats.birthdaysToday > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-secondary/10"}
            trend={stats.birthdaysToday > 0 ? {
              value: "Hoje! 🎂",
              isPositive: true,
            } : undefined}
          />
          <StatCard
            title="Próximos Eventos"
            value={stats.upcomingEvents}
            subtitle={
              stats.nextEventDate
                ? `Próximo: ${formatNextEventDate(stats.nextEventDate)}`
                : undefined
            }
            icon={Calendar}
            iconColor="text-chart-3"
            iconBgColor="bg-secondary/10"
          />
          <StatCard
            title="Membros Batizados"
            value={stats.baptizedMembers}
            subtitle={`${stats.baptizedPercentage}% do total`}
            icon={Droplet}
            iconColor="text-chart-1"
            iconBgColor="bg-primary/10"
          />
          <StatCard
            title="Células Ativas"
            value={stats.totalCells}
            subtitle={`${stats.membersInCells} membros`}
            icon={Home}
            iconColor="text-chart-2"
            iconBgColor="bg-green-500/10"
          />
          <StatCard
            title="Pedidos de Oração"
            value={stats.openPrayers}
            subtitle={stats.newPrayersThisWeek > 0 ? `+${stats.newPrayersThisWeek} esta semana` : undefined}
            icon={Heart}
            iconColor="text-destructive"
            iconBgColor="bg-destructive/10"
          />
          <StatCard
            title="Taxa de Atividade"
            value={`${stats.activityRate}%`}
            subtitle="membros ativos"
            icon={Activity}
            iconColor="text-chart-4"
            iconBgColor="bg-accent/10"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {churchLoading || membersQuery.isLoading || ministryDataQuery.isLoading ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[300px]" />
                </CardContent>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-[300px]" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-[300px]" />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <MemberGrowthChart data={growthData} />
              <div className="grid gap-6 md:grid-cols-2">
                <MinistryDistributionChart data={ministryData} />
                <MemberStatusChart data={statusData} />
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          {churchLoading || membersQuery.isLoading || upcomingEventsQuery.isLoading ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[200px]" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[200px]" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <BirthdaysWidget birthdays={birthdays} />
              <UpcomingEventsWidget events={upcomingEvents} />
              <RecentActivitiesWidget />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
