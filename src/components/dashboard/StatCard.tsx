import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
}: StatCardProps) {
  const hasPositiveTrend = trend?.isPositive && trend?.value.includes("Hoje");
  
  return (
    <Card className={cn(
      "hover:shadow-md transition-all hover:-translate-y-1",
      hasPositiveTrend && "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-destructive"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-lg p-3", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
