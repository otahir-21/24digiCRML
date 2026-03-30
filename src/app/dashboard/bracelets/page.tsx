'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  ShoppingCart,
  Warehouse,
  Truck,
  Plus,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BraceletStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingShipments: number;
  outOfStockItems: number;
}

export default function BraceletsPage() {
  const [stats, setStats] = useState<BraceletStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingShipments: 0,
    outOfStockItems: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBraceletStats();
  }, []);

  const fetchBraceletStats = async () => {
    try {
      // TODO: Replace with actual API calls to bracelet endpoints
      // For now, using mock data
      setStats({
        totalProducts: 125,
        totalOrders: 1847,
        totalRevenue: 45632.50,
        lowStockItems: 8,
        pendingShipments: 23,
        outOfStockItems: 3,
      });
    } catch (error) {
      console.error('Error fetching bracelet stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/dashboard/bracelets/products',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/dashboard/bracelets/orders',
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/dashboard/bracelets/orders?tab=analytics',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/dashboard/bracelets/inventory?filter=low-stock',
      alert: stats.lowStockItems > 0,
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockItems,
      icon: Warehouse,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/dashboard/bracelets/inventory?filter=out-of-stock',
      alert: stats.outOfStockItems > 0,
    },
    {
      title: 'Pending Shipments',
      value: stats.pendingShipments,
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/dashboard/bracelets/shipments?status=pending',
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bracelet Store Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your bracelet products, orders, inventory, and shipments
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/bracelets/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={index} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                    {card.alert && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Alert
                      </Badge>
                    )}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Management
              </CardTitle>
              <CardDescription>
                Manage your bracelet product catalog, variants, and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/bracelets/products">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    View All Products
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/products/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/products?filter=featured">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Featured Products
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/products?filter=low-stock">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Low Stock Alert
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Order Management
              </CardTitle>
              <CardDescription>
                Process and manage bracelet orders and customer requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/bracelets/orders">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    All Orders
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/orders?status=pending">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pending Orders
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/orders?status=processing">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Processing
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/orders?tab=analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Order Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Warehouse className="h-5 w-5 mr-2" />
                Inventory Management
              </CardTitle>
              <CardDescription>
                Track stock levels, adjustments, and inventory movements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/bracelets/inventory">
                  <Button variant="outline" className="w-full justify-start">
                    <Warehouse className="h-4 w-4 mr-2" />
                    Inventory Overview
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/inventory?filter=low-stock">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Low Stock Items
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/inventory/adjustments">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Stock Adjustments
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/inventory/movements">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Movement History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Shipment Management
              </CardTitle>
              <CardDescription>
                Manage shipments, tracking, and delivery performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/bracelets/shipments">
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="h-4 w-4 mr-2" />
                    All Shipments
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/shipments?status=pending">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pending Shipments
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/shipments?status=in-transit">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    In Transit
                  </Button>
                </Link>
                <Link href="/dashboard/bracelets/shipments/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Shipping Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}