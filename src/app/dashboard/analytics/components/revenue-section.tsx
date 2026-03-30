"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartCard } from "@/components/charts/chart-card"
import { LineChart } from "@/components/charts/line-chart"
import { AreaChart } from "@/components/charts/area-chart"
import { DonutChart } from "@/components/charts/pie-chart"
import { ChartLoader, TableLoader } from "@/components/charts/chart-loader"
import { analyticsService, RevenueStatistics } from "@/lib/services/analytics.service"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"

interface RevenueSectionProps {
  data: RevenueStatistics | null;
  isLoading: boolean;
  onExport: () => void;
  onRefresh: () => void;
}

export function RevenueSection({ data, isLoading, onExport, onRefresh }: RevenueSectionProps) {
  const formatRevenueData = () => {
    if (!data || !data.revenueByDay.length) return [];

    return data.revenueByDay.map(item => ({
      date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: item.revenue,
      orders: item.orders,
      avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0
    }));
  };

  const formatCategoryData = () => {
    if (!data || !data.revenueByCategory.length) return [];

    return data.revenueByCategory.map(item => ({
      name: item._id || 'Uncategorized',
      value: item.revenue,
      quantity: item.quantity,
      percentage: data.totalRevenue > 0 ? (item.revenue / data.totalRevenue) * 100 : 0
    }));
  };

  const getGrowthTrend = () => {
    const revenueData = formatRevenueData();
    if (revenueData.length < 2) return null;

    const recent = revenueData.slice(-7); // Last 7 days
    const previous = revenueData.slice(-14, -7); // Previous 7 days

    const recentTotal = recent.reduce((sum, day) => sum + day.revenue, 0);
    const previousTotal = previous.reduce((sum, day) => sum + day.revenue, 0);

    if (previousTotal === 0) return null;

    const growthPercentage = ((recentTotal - previousTotal) / previousTotal) * 100;
    return {
      percentage: Math.abs(growthPercentage),
      direction: growthPercentage >= 0 ? 'up' : 'down'
    };
  };

  const growthTrend = getGrowthTrend();

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {data ? analyticsService.formatCurrency(data.totalRevenue) : '--'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            {growthTrend && (
              <div className="flex items-center mt-2">
                {growthTrend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  growthTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {growthTrend.percentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-1">vs last week</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {data ? data.totalOrders.toLocaleString() : '--'}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold">
                {data ? analyticsService.formatCurrency(data.averageOrderValue) : '--'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Best Day</p>
              <p className="text-lg font-bold">
                {data && data.revenueByDay.length > 0 ? (
                  <>
                    {analyticsService.formatCurrency(
                      Math.max(...data.revenueByDay.map(d => d.revenue))
                    )}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {new Date(
                        data.revenueByDay.find(d =>
                          d.revenue === Math.max(...data.revenueByDay.map(x => x.revenue))
                        )?._id || ''
                      ).toLocaleDateString()}
                    </span>
                  </>
                ) : '--'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ChartCard
          title="Revenue & Orders Trend"
          description="Daily revenue and order volume over time"
          onExport={onExport}
          onRefresh={onRefresh}
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : formatRevenueData().length > 0 ? (
            <AreaChart
              data={formatRevenueData()}
              dataKeys={['revenue']}
              xAxisKey="date"
              height={350}
              colors={['#3b82f6']}
              stacked={false}
              formatTooltip={(value) => [
                analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value)),
                'Revenue'
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No revenue data for this period
            </div>
          )}
        </ChartCard>

        {/* Revenue by Category */}
        <ChartCard
          title="Revenue by Category"
          description="Revenue distribution across product categories"
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : formatCategoryData().length > 0 ? (
            <DonutChart
              data={formatCategoryData()}
              dataKey="value"
              nameKey="name"
              height={350}
              formatTooltip={(value, name) => [
                analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value as string)),
                String(name)
              ]}
              renderLabel={(entry) => `${((entry.percent ?? 0) as number * 100).toFixed(1)}%`}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No category data available
            </div>
          )}
        </ChartCard>

        {/* Order Value Distribution */}
        <ChartCard
          title="Daily Average Order Value"
          description="Average order value trend over time"
        >
          {isLoading ? (
            <ChartLoader height={350} />
          ) : formatRevenueData().length > 0 ? (
            <LineChart
              data={formatRevenueData()}
              dataKeys={['avgOrderValue']}
              xAxisKey="date"
              height={350}
              colors={['#f59e0b']}
              formatTooltip={(value) => [
                analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value)),
                'Avg Order Value'
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No order value data available
            </div>
          )}
        </ChartCard>

        {/* Top Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Categories</CardTitle>
            <CardDescription>
              Revenue breakdown by product category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableLoader rows={5} columns={3} />
            ) : formatCategoryData().length > 0 ? (
              <div className="space-y-4">
                {formatCategoryData().slice(0, 5).map((category) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.quantity} items sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{analyticsService.formatCurrency(category.value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}