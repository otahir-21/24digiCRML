"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { UserType } from "@/types/auth";
import {
  Users,
  ShoppingCart,
  Trophy,
  DollarSign,
  Activity,
  Gamepad2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StatCard } from "@/components/analytics/stat-card";
import { LineChart } from "@/components/charts/line-chart";
import { ChartCard } from "@/components/charts/chart-card";
import {
  analyticsService,
  OverviewStatistics,
} from "@/lib/services/analytics.service";

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [recentRevenue, setRecentRevenue] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch overview statistics
        const overviewData = await analyticsService.getOverviewStatistics();
        setOverview(overviewData);

        // Fetch recent revenue data for chart
        const revenueData = await analyticsService.getRevenueStatistics(
          analyticsService.generateDateRange(7) // Last 7 days
        );
        const formattedRevenueData = revenueData.revenueByDay.map((item) => ({
          date: new Date(item._id).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: item.revenue,
          orders: item.orders,
        }));
        setRecentRevenue(formattedRevenueData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatCards = () => {
    if (!overview) return [];

    return [
      {
        title: "Total Users",
        value: overview.users.total,
        icon: Users,
        description: `${overview.users.active} active users`,
        trend: {
          value:
            overview.users.active > 0
              ? (overview.users.active / overview.users.total) * 100
              : 0,
          direction: "up" as const,
        },
        allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
      },
      {
        title: "Total Orders",
        value: overview.orders.total,
        icon: ShoppingCart,
        description: `${overview.orders.pending} pending`,
        trend: {
          value: 8.2,
          direction: "up" as const,
        },
        allowedRoles: [
          UserType.ADMIN,
          UserType.STAFF_MANAGER,
          UserType.STAFF_EDITOR,
        ],
      },
      {
        title: "Active Features",
        value:
          overview.activities.challenges + overview.activities.competitions,
        icon: Trophy,
        description: `${overview.activities.rooms} rooms active`,
        allowedRoles: [UserType.ADMIN, UserType.STAFF_EDITOR],
      },
      {
        title: "Monthly Revenue",
        value: analyticsService.formatCurrency(overview.orders.monthlyRevenue),
        icon: DollarSign,
        description: `${analyticsService.formatCurrency(
          overview.orders.todayRevenue
        )} today`,
        trend: {
          value: 12.5,
          direction: "up" as const,
        },
        allowedRoles: [UserType.ADMIN],
      },
    ];
  };

  const filteredStats = getStatCards().filter((stat) => {
    if (!stat.allowedRoles) return true;
    return hasRole(stat.allowedRoles);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Admin"}!
          </h2>
          <p className="text-gray-600 mt-2">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">
              <Activity className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {hasRole([UserType.ADMIN, UserType.STAFF_MANAGER]) && (
          <ChartCard
            title="Revenue Trend"
            description="Last 7 days revenue and order volume"
            onRefresh={() => window.location.reload()}
          >
            {recentRevenue.length > 0 ? (
              <LineChart
                data={recentRevenue}
                dataKeys={["revenue"]}
                xAxisKey="date"
                height={250}
                colors={["#3b82f6"]}
                formatTooltip={(value) => [
                  analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(String(value))),
                  "Revenue",
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No revenue data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Your Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Your Access Level
            </CardTitle>
            <CardDescription>
              Actions you can perform based on your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.userType.replace("_", " ").toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="h-2 w-20 bg-blue-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{
                        width:
                          user?.userType === "admin"
                            ? "100%"
                            : user?.userType === "staff_manager"
                            ? "80%"
                            : user?.userType === "staff_editor"
                            ? "60%"
                            : "40%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access Level
                  </p>
                </div>
              </div>

              {user?.permissions && user.permissions.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Custom Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.slice(0, 3).map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {permission}
                      </span>
                    ))}
                    {user.permissions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {user?.userType === UserType.ADMIN && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Full Administrative Access
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    You have unrestricted access to all platform features and
                    data.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasRole([UserType.ADMIN, UserType.STAFF_MANAGER]) && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                asChild
              >
                <Link href="/dashboard/admin-users">
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Manage Users</span>
                </Link>
              </Button>
            )}

            {hasRole([UserType.ADMIN, UserType.STAFF_EDITOR]) && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                asChild
              >
                <Link href="/dashboard/products">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm font-medium">Products</span>
                </Link>
              </Button>
            )}

            {hasRole([UserType.ADMIN, UserType.STAFF_EDITOR]) && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                asChild
              >
                <Link href="/dashboard/challenges">
                  <Trophy className="h-6 w-6" />
                  <span className="text-sm font-medium">Challenges</span>
                </Link>
              </Button>
            )}

            {hasRole([UserType.ADMIN]) && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                asChild
              >
                <Link href="/dashboard/analytics">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm font-medium">Analytics</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
