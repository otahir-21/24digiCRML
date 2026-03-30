"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartLoader, TableLoader } from "@/components/charts/chart-loader";
import { UserStatistics } from "@/lib/services/analytics.service";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface UserSectionProps {
  data: UserStatistics | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function UserSection({ data, isLoading, onRefresh }: UserSectionProps) {
  const formatUserGrowthData = () => {
    if (!data || !data.newUsersByDay.length) return [];

    // Sort by date and create cumulative data
    const sortedData = [...data.newUsersByDay].sort((a, b) =>
      a._id.localeCompare(b._id)
    );
    let cumulative = 0;

    return sortedData.map((item) => {
      cumulative += item.count;
      return {
        date: new Date(item._id).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        newUsers: item.count,
        totalUsers: cumulative,
      };
    });
  };

  const formatUserTypeData = () => {
    if (!data || !data.usersByType.length) return [];

    const typeLabels: Record<string, string> = {
      customer: "Customers",
      driver: "Drivers",
      admin: "Admins",
      staff_manager: "Staff Managers",
      staff_editor: "Staff Editors",
      staff_viewer: "Staff Viewers",
    };

    return data.usersByType.map((item) => ({
      name:
        typeLabels[item._id] ||
        item._id?.replace("_", " ").toUpperCase() ||
        "Unknown",
      value: item.count,
      percentage:
        data.totalUsers > 0 ? (item.count / data.totalUsers) * 100 : 0,
    }));
  };

  const getActivityRate = () => {
    if (!data) return 0;
    return data.totalUsers > 0 ? (data.activeUsers / data.totalUsers) * 100 : 0;
  };

  const getGrowthTrend = () => {
    const growthData = formatUserGrowthData();
    if (growthData.length < 2) return null;

    const recent = growthData
      .slice(-7)
      .reduce((sum, day) => sum + day.newUsers, 0);
    const previous = growthData
      .slice(-14, -7)
      .reduce((sum, day) => sum + day.newUsers, 0);

    if (previous === 0) return null;

    const growthPercentage = ((recent - previous) / previous) * 100;
    return {
      percentage: Math.abs(growthPercentage),
      direction: growthPercentage >= 0 ? "up" : "down",
    };
  };

  const growthTrend = getGrowthTrend();

  return (
    <div className="space-y-6">
      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">
                  {data ? data.totalUsers.toLocaleString() : "--"}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            {growthTrend && (
              <div className="flex items-center mt-2">
                {growthTrend.direction === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    growthTrend.direction === "up"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {growthTrend.percentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  vs last week
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold">
                  {data ? data.activeUsers.toLocaleString() : "--"}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                {getActivityRate().toFixed(1)}% activity rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold">
                  {data ? data.inactiveUsers.toLocaleString() : "--"}
                </p>
              </div>
              <UserX className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New This Period
                </p>
                <p className="text-2xl font-bold">
                  {data && data.newUsersByDay.length > 0
                    ? data.newUsersByDay
                        .reduce((sum, day) => sum + day.count, 0)
                        .toLocaleString()
                    : "--"}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <ChartCard
          title="User Growth Trend"
          description="Daily new user registrations and cumulative growth"
          onRefresh={onRefresh}
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : formatUserGrowthData().length > 0 ? (
            <AreaChart
              data={formatUserGrowthData()}
              dataKeys={["newUsers"]}
              xAxisKey="date"
              height={350}
              colors={["#10b981"]}
              formatTooltip={(value, name) => [
                value.toLocaleString(),
                name === "newUsers" ? "New Users" : "Total Users",
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No user growth data available
            </div>
          )}
        </ChartCard>

        {/* Users by Type */}
        <ChartCard
          title="User Distribution"
          description="Breakdown of users by type"
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : formatUserTypeData().length > 0 ? (
            <DonutChart
              data={formatUserTypeData()}
              dataKey="value"
              nameKey="name"
              height={350}
              formatTooltip={(value, name) => [value.toLocaleString(), name]}
              renderLabel={(entry) => `${(entry.percentage as number).toFixed(1)}%`}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No user type data available
            </div>
          )}
        </ChartCard>

        {/* User Activity Comparison */}
        <ChartCard
          title="User Activity Status"
          description="Active vs Inactive users comparison"
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : data ? (
            <BarChart
              data={[
                {
                  status: "Active",
                  count: data.activeUsers,
                  percentage: getActivityRate(),
                },
                {
                  status: "Inactive",
                  count: data.inactiveUsers,
                  percentage: 100 - getActivityRate(),
                },
              ]}
              dataKeys={["count"]}
              xAxisKey="status"
              height={350}
              colors={["#10b981", "#ef4444"]}
              formatTooltip={(value) => [value.toLocaleString(), "Users"]}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No activity data available
            </div>
          )}
        </ChartCard>

        {/* User Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement Metrics</CardTitle>
            <CardDescription>
              Key metrics about user engagement and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableLoader rows={4} columns={2} />
            ) : data ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <div>
                      <p className="font-medium">Activity Rate</p>
                      <p className="text-sm text-muted-foreground">
                        Users active in last 7 days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {getActivityRate().toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div>
                      <p className="font-medium">Growth Rate</p>
                      <p className="text-sm text-muted-foreground">
                        {growthTrend ? "Week over week" : "Not enough data"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {growthTrend ? (
                      <p
                        className={`text-lg font-bold ${
                          growthTrend.direction === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {growthTrend.direction === "up" ? "+" : "-"}
                        {growthTrend.percentage.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-lg font-bold text-gray-500">--</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-600" />
                    <div>
                      <p className="font-medium">User Types</p>
                      <p className="text-sm text-muted-foreground">
                        Different user categories
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      {formatUserTypeData().length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-600" />
                    <div>
                      <p className="font-medium">Average Daily Signups</p>
                      <p className="text-sm text-muted-foreground">
                        In selected period
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {data.newUsersByDay.length > 0
                        ? (
                            data.newUsersByDay.reduce(
                              (sum, day) => sum + day.count,
                              0
                            ) / data.newUsersByDay.length
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No engagement data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Type Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed User Breakdown</CardTitle>
          <CardDescription>
            Comprehensive breakdown of users by type and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoader rows={6} columns={4} />
          ) : formatUserTypeData().length > 0 ? (
            <div className="space-y-2">
              {formatUserTypeData().map((userType, index) => (
                <div
                  key={userType.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: [
                          "#3b82f6",
                          "#ef4444",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
                          "#ec4899",
                        ][index % 6],
                      }}
                    />
                    <div>
                      <p className="font-medium">{userType.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {userType.percentage.toFixed(1)}% of total users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {userType.value.toLocaleString()}
                    </p>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${userType.percentage}%`,
                          backgroundColor: [
                            "#3b82f6",
                            "#ef4444",
                            "#10b981",
                            "#f59e0b",
                            "#8b5cf6",
                            "#ec4899",
                          ][index % 6],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No user type data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
