import { RestaurantStats } from '../RestaurantStats';

export default function RestaurantStatsExample() {
  // todo: remove mock functionality
  const mockStats = {
    totalCustomers: {
      value: "2,543",
      change: "+12% from last month",
      trend: "up" as const,
    },
    totalRevenue: {
      value: "$8,234",
      change: "+8% from last month", 
      trend: "up" as const,
    },
    activeDeals: {
      value: "12",
      change: "+3 from last week",
      trend: "up" as const,
    },
    avgOrderTime: {
      value: "18 min",
      change: "-2 min from last month",
      trend: "up" as const,
    },
  };

  return (
    <div className="p-6">
      <RestaurantStats stats={mockStats} />
    </div>
  );
}