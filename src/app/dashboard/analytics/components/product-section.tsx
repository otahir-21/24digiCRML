"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartCard } from "@/components/charts/chart-card"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/pie-chart"
import { ChartLoader, TableLoader } from "@/components/charts/chart-loader"
import { ProductStatistics, analyticsService } from "@/lib/services/analytics.service"
import { Package, ShoppingBag, Star, TrendingUp, Award, Target } from "lucide-react"

interface ProductSectionProps {
  data: ProductStatistics | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProductSection({ data, isLoading, onRefresh }: ProductSectionProps) {
  const formatTopProductsData = () => {
    if (!data || !data.topSellingProducts.length) return [];

    return data.topSellingProducts.slice(0, 10).map(item => ({
      name: item.name?.length > 20 ? item.name.substring(0, 20) + '...' : item.name || 'Unknown Product',
      fullName: item.name || 'Unknown Product',
      sales: item.totalSold,
      revenue: item.revenue,
      avgPrice: item.totalSold > 0 ? item.revenue / item.totalSold : 0
    }));
  };

  const formatCategoryData = () => {
    if (!data || !data.productsByCategory.length) return [];

    return data.productsByCategory.map(item => ({
      name: item._id || 'Uncategorized',
      value: item.count,
      percentage: data.totalProducts > 0 ? (item.count / data.totalProducts) * 100 : 0
    }));
  };

  const getActiveProductRate = () => {
    if (!data) return 0;
    return data.totalProducts > 0 ? (data.activeProducts / data.totalProducts) * 100 : 0;
  };

  const getBestSellingProduct = () => {
    if (!data || !data.topSellingProducts.length) return null;
    return data.topSellingProducts[0];
  };

  const getMostRevenueProduct = () => {
    if (!data || !data.topSellingProducts.length) return null;
    return data.topSellingProducts.reduce((max, product) =>
      product.revenue > max.revenue ? product : max
    );
  };

  const bestSeller = getBestSellingProduct();
  const topRevenue = getMostRevenueProduct();

  return (
    <div className="space-y-6">
      {/* Product Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">
                  {data ? data.totalProducts.toLocaleString() : '--'}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant={getActiveProductRate() > 80 ? "default" : "secondary"}>
                {getActiveProductRate().toFixed(1)}% active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">
                  {data ? data.activeProducts.toLocaleString() : '--'}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {data ? data.productsByCategory.length : '--'}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Products</p>
                <p className="text-2xl font-bold">
                  {data ? data.inactiveProducts.toLocaleString() : '--'}
                </p>
              </div>
              <Package className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <ChartCard
          title="Top Selling Products"
          description="Products ranked by quantity sold"
          onRefresh={onRefresh}
        >
          {isLoading ? (
            <ChartLoader height={400} />
          ) : formatTopProductsData().length > 0 ? (
            <BarChart
              data={formatTopProductsData()}
              dataKeys={['sales']}
              xAxisKey="name"
              height={400}
              colors={['#f59e0b']}
              layout="horizontal"
              formatTooltip={(value) => [
                value.toLocaleString(),
                'Units Sold'
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No product sales data available
            </div>
          )}
        </ChartCard>

        {/* Products by Category */}
        <ChartCard
          title="Products by Category"
          description="Distribution of products across categories"
        >
          {isLoading ? (
            <ChartLoader height={400} />
          ) : formatCategoryData().length > 0 ? (
            <DonutChart
              data={formatCategoryData()}
              dataKey="value"
              nameKey="name"
              height={400}
              formatTooltip={(value) => [
                value.toLocaleString(),
                'Products'
              ]}
              renderLabel={(entry) => `${(entry.percentage as number).toFixed(1)}%`}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No category data available
            </div>
          )}
        </ChartCard>

        {/* Revenue by Product */}
        <ChartCard
          title="Top Revenue Generating Products"
          description="Products ranked by total revenue"
        >
          {isLoading ? (
            <ChartLoader height={400} />
          ) : formatTopProductsData().length > 0 ? (
            <BarChart
              data={formatTopProductsData()}
              dataKeys={['revenue']}
              xAxisKey="name"
              height={400}
              colors={['#10b981']}
              layout="horizontal"
              formatTooltip={(value) => [
                analyticsService.formatCurrency(typeof value === 'number' ? value : parseFloat(value)),
                'Revenue'
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No revenue data available
            </div>
          )}
        </ChartCard>

        {/* Product Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
            <CardDescription>
              Key product performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableLoader rows={4} columns={2} />
            ) : data ? (
              <div className="space-y-4">
                {bestSeller && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Best Seller</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {bestSeller.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-600">
                        {bestSeller.totalSold.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">units sold</p>
                    </div>
                  </div>
                )}

                {topRevenue && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Top Revenue</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {topRevenue.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {analyticsService.formatCurrency(topRevenue.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">total revenue</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Active Rate</p>
                      <p className="text-sm text-muted-foreground">
                        Products currently active
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {getActiveProductRate().toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.activeProducts} of {data.totalProducts}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Avg Sales per Product</p>
                      <p className="text-sm text-muted-foreground">
                        In top performers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      {data.topSellingProducts.length > 0 ?
                        (data.topSellingProducts.reduce((sum, product) => sum + product.totalSold, 0) / data.topSellingProducts.length).toFixed(0) :
                        '0'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No performance data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>
            Detailed breakdown of best-selling products with revenue data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoader rows={10} columns={5} />
          ) : formatTopProductsData().length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                <div>Product Name</div>
                <div className="text-center">Units Sold</div>
                <div className="text-center">Revenue</div>
                <div className="text-center">Avg Price</div>
                <div className="text-center">Performance</div>
              </div>
              {formatTopProductsData().map((product, index) => (
                <div key={product.fullName} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium" title={product.fullName}>
                        {product.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{product.sales.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">
                      {analyticsService.formatCurrency(product.revenue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      {analyticsService.formatCurrency(product.avgPrice)}
                    </p>
                  </div>
                  <div className="text-center">
                    <Badge
                      variant={index < 3 ? "default" : index < 7 ? "secondary" : "outline"}
                    >
                      {index < 3 ? "Excellent" : index < 7 ? "Good" : "Average"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No product data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}