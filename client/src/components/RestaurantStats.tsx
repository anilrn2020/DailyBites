import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Clock } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

function StatsCard({ title, value, change, trend, icon }: StatsCardProps) {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600", 
    neutral: "text-muted-foreground"
  }[trend];

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        <p className={`text-xs ${trendColor} flex items-center gap-1`}>
          <TrendingUp className="h-3 w-3" />
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

interface RestaurantStatsProps {
  stats: {
    totalCustomers: { value: string; change: string; trend: "up" | "down" | "neutral" };
    totalRevenue: { value: string; change: string; trend: "up" | "down" | "neutral" };
    activeDeals: { value: string; change: string; trend: "up" | "down" | "neutral" };
    avgOrderTime: { value: string; change: string; trend: "up" | "down" | "neutral" };
  };
}

export function RestaurantStats({ stats }: RestaurantStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Customers"
        value={stats.totalCustomers.value}
        change={stats.totalCustomers.change}
        trend={stats.totalCustomers.trend}
        icon={<Users className="h-4 w-4" />}
      />
      <StatsCard
        title="Revenue"
        value={stats.totalRevenue.value}
        change={stats.totalRevenue.change}
        trend={stats.totalRevenue.trend}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatsCard
        title="Active Deals"
        value={stats.activeDeals.value}
        change={stats.activeDeals.change}
        trend={stats.activeDeals.trend}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatsCard
        title="Avg Order Time"
        value={stats.avgOrderTime.value}
        change={stats.avgOrderTime.change}
        trend={stats.avgOrderTime.trend}
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}