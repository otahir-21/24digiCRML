"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { UserType } from "@/types/auth";
import {
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Trophy,
  Target,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import our components
import { StatCard } from "@/components/analytics/stat-card";
import {
  DateRangePicker,
  DateRange,
} from "@/components/analytics/date-range-picker";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart, DonutChart } from "@/components/charts/pie-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { ChartLoader, TableLoader } from "@/components/charts/chart-loader";

// Import services
import {
  analyticsService,
  OverviewStatistics,
  RevenueStatistics,
  UserStatistics,
  ProductStatistics,
} from "@/lib/services/analytics.service";
import {
  braceletOrderService,
  OrderStatistics as BraceletOrderStats,
} from "@/lib/services/bracelet-order.service";
import {
  braceletInventoryService,
  InventoryReport,
} from "@/lib/services/bracelet-inventory.service";
import {
  braceletShipmentService,
  DeliveryPerformanceReport,
} from "@/lib/services/bracelet-shipment.service";

export default function AnalyticsPage() {
  const { hasRole } = useAuthStore();
  const { toast } = useToast();

  // State
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    label: "Last 30 days",
  });

  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueStatistics | null>(
    null
  );
  const [userData, setUserData] = useState<UserStatistics | null>(null);
  const [productData, setProductData] = useState<ProductStatistics | null>(
    null
  );
  const [braceletOrderStats, setBraceletOrderStats] =
    useState<BraceletOrderStats | null>(null);
  const [inventoryReport, setInventoryReport] =
    useState<InventoryReport | null>(null);
  const [shipmentReport, setShipmentReport] =
    useState<DeliveryPerformanceReport | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  const fetchAnalyticsData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setIsRefreshing(true);

      const [
        overviewRes,
        revenueRes,
        userRes,
        productRes,
        braceletOrderRes,
        inventoryRes,
        shipmentRes,
      ] = await Promise.allSettled([
        analyticsService.getOverviewStatistics(),
        analyticsService.getRevenueStatistics(dateRange),
        analyticsService.getUserStatistics(dateRange),
        analyticsService.getProductStatistics(),
        braceletOrderService.getStatistics({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
        braceletInventoryService.getInventoryReport(),
        braceletShipmentService.getDeliveryPerformanceReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      ]);

      if (overviewRes.status === "fulfilled") {
        console.log("📈 Overview Data:", overviewRes.value);
        setOverview(overviewRes.value);
      }
      if (revenueRes.status === "fulfilled") {
        console.log("💰 Revenue Data:", revenueRes.value);
        setRevenueData(revenueRes.value);
      }
      if (userRes.status === "fulfilled") {
        console.log("👥 User Data:", userRes.value);
        setUserData(userRes.value);
      }
      if (productRes.status === "fulfilled") {
        console.log("📦 Product Data:", productRes.value);
        setProductData(productRes.value);
      }
      if (braceletOrderRes.status === "fulfilled") {
        console.log("🛍️ Bracelet Order Data:", braceletOrderRes.value);
        setBraceletOrderStats(braceletOrderRes.value);
      }
      if (inventoryRes.status === "fulfilled") {
        console.log("📦 Inventory Data:", inventoryRes.value);
        setInventoryReport(inventoryRes.value);
      }
      if (shipmentRes.status === "fulfilled") {
        console.log("🚚 Shipment Data:", shipmentRes.value);
        setShipmentReport(shipmentRes.value);
      }

      // Check for any errors with detailed logging
      const errorDetails = [
        { name: "Overview", result: overviewRes },
        { name: "Revenue", result: revenueRes },
        { name: "User", result: userRes },
        { name: "Product", result: productRes },
        { name: "Bracelet Orders", result: braceletOrderRes },
        { name: "Inventory", result: inventoryRes },
        { name: "Shipments", result: shipmentRes },
      ].filter((item) => item.result.status === "rejected");

      if (errorDetails.length > 0) {
        console.group("📊 Analytics API Errors");
        errorDetails.forEach(({ name, result }) => {
          const error = (result as PromiseRejectedResult).reason;
          console.error(`❌ ${name} Analytics Error:`, {
            message: error?.message,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            responseData: error?.response?.data,
            fullError: error,
          });
        });
        console.groupEnd();

        toast({
          title: "Warning",
          description: `Failed to load: ${errorDetails
            .map((e) => e.name)
            .join(", ")} data`,
          variant: "destructive",
        });
      } else {
        console.log("✅ All analytics data loaded successfully");
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Handle export
  const handleExport = async (type: "revenue" | "users" | "products") => {
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case "revenue":
          blob = await analyticsService.exportOrdersCSV({ ...dateRange });
          filename = `revenue-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
          break;
        default:
          throw new Error("Export type not implemented");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (!hasRole([UserType.ADMIN, UserType.STAFF_MANAGER])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            onClick={() => fetchAnalyticsData(false)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={
            revenueData
              ? analyticsService.formatCurrency(revenueData.totalRevenue)
              : 0
          }
          description="in selected period"
          icon={DollarSign}
          trend={{
            value: 12.5,
            direction: "up",
          }}
          isLoading={isLoading}
        />
        <StatCard
          title="Bracelet Orders"
          value={braceletOrderStats?.totalOrders || 0}
          description={`${braceletOrderStats?.pendingOrders || 0} pending`}
          icon={ShoppingCart}
          trend={{
            value: 8.3,
            direction: "up",
          }}
          isLoading={isLoading}
        />
        <StatCard
          title="Inventory Value"
          value={
            inventoryReport?.summary?.totalValue
              ? analyticsService.formatCurrency(
                  inventoryReport.summary.totalValue
                )
              : 0
          }
          description={`${
            inventoryReport?.summary?.totalProducts || 0
          } products`}
          icon={Target}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Users"
          value={userData?.totalUsers || 0}
          description={`${userData?.activeUsers || 0} active users`}
          icon={Users}
          trend={{
            value: userData
              ? (userData.activeUsers / userData.totalUsers) * 100
              : 0,
            direction: "up",
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="bracelet-orders" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto grid-cols-7">
          <TabsTrigger value="bracelet-orders">Bracelet Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Bracelet Orders Analytics */}
        <TabsContent value="bracelet-orders" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders"
              value={braceletOrderStats?.totalOrders || 0}
              description="All time"
              icon={ShoppingCart}
              isLoading={isLoading}
            />
            <StatCard
              title="Delivered Orders"
              value={braceletOrderStats?.deliveredOrders || 0}
              description="Successfully completed"
              icon={DollarSign}
              isLoading={isLoading}
            />
            <StatCard
              title="Average Order Value"
              value={
                braceletOrderStats
                  ? analyticsService.formatCurrency(
                      braceletOrderStats.averageOrderValue
                    )
                  : 0
              }
              description="Per order"
              icon={TrendingUp}
              isLoading={isLoading}
            />
            <StatCard
              title="Today's Revenue"
              value={
                braceletOrderStats
                  ? analyticsService.formatCurrency(
                      braceletOrderStats.todayRevenue
                    )
                  : 0
              }
              description="Today's sales"
              icon={Target}
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>
                Breakdown of orders by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartLoader height={300} />
              ) : braceletOrderStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Delivered</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{
                            width: `${
                              (braceletOrderStats.deliveredOrders /
                                braceletOrderStats.totalOrders) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {braceletOrderStats.deliveredOrders} (
                        {Math.round(
                          (braceletOrderStats.deliveredOrders /
                            braceletOrderStats.totalOrders) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipped</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${
                              (braceletOrderStats.shippedOrders /
                                braceletOrderStats.totalOrders) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {braceletOrderStats.shippedOrders} (
                        {Math.round(
                          (braceletOrderStats.shippedOrders /
                            braceletOrderStats.totalOrders) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-yellow-500 rounded"
                          style={{
                            width: `${
                              (braceletOrderStats.processingOrders /
                                braceletOrderStats.totalOrders) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {braceletOrderStats.processingOrders} (
                        {Math.round(
                          (braceletOrderStats.processingOrders /
                            braceletOrderStats.totalOrders) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-gray-500 rounded"
                          style={{
                            width: `${
                              (braceletOrderStats.pendingOrders /
                                braceletOrderStats.totalOrders) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {braceletOrderStats.pendingOrders} (
                        {Math.round(
                          (braceletOrderStats.pendingOrders /
                            braceletOrderStats.totalOrders) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Analytics */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={inventoryReport?.summary?.totalProducts || 0}
              description="In inventory"
              icon={Target}
              isLoading={isLoading}
            />
            <StatCard
              title="Inventory Value"
              value={
                inventoryReport?.summary?.totalValue
                  ? analyticsService.formatCurrency(
                      inventoryReport.summary.totalValue
                    )
                  : 0
              }
              description="Total worth"
              icon={DollarSign}
              isLoading={isLoading}
            />
            <StatCard
              title="Low Stock Items"
              value={inventoryReport?.summary?.lowStockItems || 0}
              description="Need attention"
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Out of Stock"
              value={inventoryReport?.summary?.outOfStockItems || 0}
              description="Require restock"
              icon={Trophy}
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Level Distribution</CardTitle>
              <CardDescription>
                Breakdown of products by stock status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartLoader height={300} />
              ) : inventoryReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Optimal Stock</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{
                            width: `${
                              ((inventoryReport?.stockLevels?.optimal || 0) /
                                (inventoryReport?.summary?.totalProducts ||
                                  1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {inventoryReport?.stockLevels?.optimal || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Understock</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-yellow-500 rounded"
                          style={{
                            width: `${
                              ((inventoryReport?.stockLevels?.understock || 0) /
                                (inventoryReport?.summary?.totalProducts ||
                                  1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {inventoryReport?.stockLevels?.understock || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Out of Stock</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-red-500 rounded"
                          style={{
                            width: `${
                              ((inventoryReport?.stockLevels?.outOfStock || 0) /
                                (inventoryReport?.summary?.totalProducts ||
                                  1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {inventoryReport?.stockLevels?.outOfStock || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overstock</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-40 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${
                              ((inventoryReport?.stockLevels?.overstock || 0) /
                                (inventoryReport?.summary?.totalProducts ||
                                  1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">
                        {inventoryReport?.stockLevels?.overstock || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No inventory data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Analytics */}
        <TabsContent value="shipments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Shipments"
              value={shipmentReport?.summary?.totalShipments || 0}
              description="All time"
              icon={Trophy}
              isLoading={isLoading}
            />
            <StatCard
              title="On-Time Delivery"
              value={`${shipmentReport?.summary?.onTimeDeliveryRate || 0}%`}
              description="Performance rate"
              icon={Target}
              isLoading={isLoading}
            />
            <StatCard
              title="Avg Delivery Time"
              value={`${
                shipmentReport?.summary?.averageDeliveryTime || 0
              } days`}
              description="Average duration"
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Shipping Cost"
              value={
                shipmentReport
                  ? analyticsService.formatCurrency(
                      shipmentReport?.summary?.totalShippingCost
                    )
                  : 0
              }
              description="Total spent"
              icon={DollarSign}
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Performance metrics by shipping carrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartLoader height={300} />
              ) : shipmentReport &&
                shipmentReport?.carrierPerformance?.length > 0 ? (
                <div className="space-y-6">
                  {shipmentReport?.carrierPerformance?.map((carrier) => (
                    <div key={carrier.carrier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-lg">
                          {carrier.carrier}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {carrier.totalShipments} shipments
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {carrier.onTimeRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            On-Time Rate
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {carrier.averageDeliveryTime}d
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Delivery
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {carrier.exceptionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Exception Rate
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {analyticsService.formatCurrency(
                              carrier.averageCost
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Cost
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No shipment data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <ChartCard
              title="Revenue Trend"
              description="Daily revenue over the selected period"
              onExport={() => handleExport("revenue")}
              onRefresh={() => fetchAnalyticsData(false)}
              isLoading={isRefreshing}
            >
              {isLoading ? (
                <ChartLoader height={300} />
              ) : revenueData && revenueData.revenueByDay.length > 0 ? (
                <LineChart
                  data={revenueData.revenueByDay.map((item) => ({
                    date: new Date(item._id).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    revenue: item.revenue,
                    orders: item.orders,
                  }))}
                  dataKeys={["revenue"]}
                  xAxisKey="date"
                  height={300}
                  colors={["#3b82f6"]}
                  formatTooltip={(value, name) => [
                    name === "revenue"
                      ? analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value))
                      : String(value),
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
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
                <ChartLoader height={300} />
              ) : revenueData && revenueData.revenueByCategory.length > 0 ? (
                <DonutChart
                  data={revenueData.revenueByCategory.map((item) => ({
                    name: item._id || "Unknown",
                    value: item.revenue,
                    quantity: item.quantity,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  height={300}
                  formatTooltip={(value, name) => [
                    analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value)),
                    name,
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No category data available
                </div>
              )}
            </ChartCard>
          </div>

          {/* Revenue Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>
                Detailed breakdown of revenue metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableLoader rows={5} columns={3} />
              ) : revenueData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold">
                      {analyticsService.formatCurrency(
                        revenueData.totalRevenue
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold">
                      {revenueData.totalOrders.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Average Order Value
                    </p>
                    <p className="text-2xl font-bold">
                      {analyticsService.formatCurrency(
                        revenueData.averageOrderValue
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No revenue data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Analytics */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Users Trend */}
            <ChartCard
              title="New User Registrations"
              description="Daily new user signups"
            >
              {isLoading ? (
                <ChartLoader height={300} />
              ) : userData && userData.newUsersByDay.length > 0 ? (
                <AreaChart
                  data={userData.newUsersByDay.map((item) => ({
                    date: new Date(item._id).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    users: item.count,
                  }))}
                  dataKeys={["users"]}
                  xAxisKey="date"
                  height={300}
                  colors={["#10b981"]}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No user registration data
                </div>
              )}
            </ChartCard>

            {/* Users by Type */}
            <ChartCard
              title="Users by Type"
              description="Distribution of user types"
            >
              {isLoading ? (
                <ChartLoader height={300} />
              ) : userData && userData.usersByType.length > 0 ? (
                <PieChart
                  data={userData.usersByType.map((item) => ({
                    name:
                      item._id?.replace("_", " ").toUpperCase() || "Unknown",
                    value: item.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No user type data available
                </div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* Product Analytics */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <ChartCard
              title="Top Selling Products"
              description="Best performing products by quantity sold"
            >
              {isLoading ? (
                <ChartLoader height={300} />
              ) : productData && productData.topSellingProducts.length > 0 ? (
                <BarChart
                  data={productData.topSellingProducts
                    .slice(0, 10)
                    .map((item) => ({
                      name:
                        item.name?.substring(0, 15) +
                        (item.name && item.name.length > 15 ? "..." : ""),
                      sales: item.totalSold,
                      revenue: item.revenue,
                    }))}
                  dataKeys={["sales"]}
                  xAxisKey="name"
                  height={300}
                  colors={["#f59e0b"]}
                  layout="horizontal"
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No product sales data
                </div>
              )}
            </ChartCard>

            {/* Products by Category */}
            <ChartCard
              title="Products by Category"
              description="Product distribution across categories"
            >
              {isLoading ? (
                <ChartLoader height={300} />
              ) : productData && productData.productsByCategory.length > 0 ? (
                <DonutChart
                  data={productData.productsByCategory.map((item) => ({
                    name: item._id || "Uncategorized",
                    value: item.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No category data available
                </div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* Activities Analytics */}
        <TabsContent value="activities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Active Challenges"
              value={overview?.activities.challenges || 0}
              description="Currently running"
              icon={Trophy}
              isLoading={isLoading}
            />
            <StatCard
              title="Competitions"
              value={overview?.activities.competitions || 0}
              description="In progress"
              icon={Target}
              isLoading={isLoading}
            />
            <StatCard
              title="Private Rooms"
              value={overview?.activities.rooms || 0}
              description="Currently active"
              icon={Users}
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Summary of platform activities and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Detailed activity analytics will be available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
