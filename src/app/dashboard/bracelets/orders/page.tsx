"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  RefreshCw,
  Download,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import {
  braceletOrderService,
  BraceletOrder,
  OrderStatistics,
} from "@/lib/services/bracelet-order.service";

// Extend the interface to include display-specific fields
interface BraceletOrderDisplay extends BraceletOrder {
  customerName: string;
  itemCount: number;
  shippingMethod: string;
  estimatedDelivery?: string;
}

export default function BraceletOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BraceletOrderDisplay[]>([]);
  const [stats, setStats] = useState<OrderStatistics>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders from API
      const filters = {
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter,
        paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
        page,
        limit: 20,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const [ordersResponse, statsResponse] = await Promise.all([
        braceletOrderService.getOrders(filters),
        braceletOrderService.getStatistics(),
      ]);

      // Transform orders to include display fields
      const transformedOrders: BraceletOrderDisplay[] =
        ordersResponse.orders.map((order) => ({
          ...order,
          customerName: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
          itemCount: order.items.length,
          shippingMethod: order.shippingInfo?.method || "Standard",
        }));

      setOrders(transformedOrders);
      setStats(statsResponse);
      setTotalPages(ordersResponse.totalPages);
    } catch (error) {
      console.error("Error fetching orders:", error);

      // Fallback to mock data if API fails
      const mockOrders: BraceletOrderDisplay[] = [
        {
          _id: "1",
          orderId: "BR24090001",
          customerId: "CUST001",
          customerEmail: "john.doe@example.com",
          customerName: "John Doe",
          status: "processing",
          paymentStatus: "succeeded",
          totalAmount: 299.99,
          itemCount: 2,
          shippingMethod: "Standard",
          items: [],
          subtotal: 279.99,
          taxAmount: 20.0,
          shippingCost: 0,
          discountAmount: 0,
          billingAddress: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
            addressLine1: "123 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
          shippingAddress: {
            firstName: "John",
            lastName: "Doe",
            addressLine1: "123 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
          createdAt: "2024-09-22T08:30:00Z",
          updatedAt: "2024-09-22T10:15:00Z",
        },
        {
          orderId: "BR24090002",
          customerId: "CUST002",
          customerEmail: "jane.smith@example.com",
          customerName: "Jane Smith",
          status: "shipped",
          paymentStatus: "succeeded",
          totalAmount: 179.99,
          itemCount: 1,
          shippingMethod: "Express",
          items: [],
          subtotal: 159.99,
          taxAmount: 12.0,
          shippingCost: 8.0,
          discountAmount: 0,
          billingAddress: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "+1234567891",
            addressLine1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
            country: "US",
          },
          shippingAddress: {
            firstName: "Sample",
            lastName: "Customer",
            addressLine1: "123 Main St",
            postalCode: "90001",
            city: "Los Angeles",
            state: "CA",
            country: "US",
          },
          createdAt: "2024-09-21T14:20:00Z",
          updatedAt: "2024-09-22T09:45:00Z",
          estimatedDelivery: "2024-09-25T12:00:00Z",
        },
        {
          orderId: "BR24090003",
          customerId: "CUST003",
          customerEmail: "mike.johnson@example.com",
          customerName: "Mike Johnson",
          status: "pending",
          paymentStatus: "pending",
          totalAmount: 89.99,
          itemCount: 1,
          shippingMethod: "Standard",
          items: [],
          subtotal: 79.99,
          taxAmount: 10.0,
          shippingCost: 0,
          discountAmount: 0,
          billingAddress: {
            firstName: "Mike",
            lastName: "Johnson",
            email: "mike.johnson@example.com",
            phone: "+1234567892",
            addressLine1: "123 Main St",
            city: "Chicago",
            state: "IL",
            postalCode: "60601",
            country: "US",
          },
          shippingAddress: {
            firstName: "Sample",
            lastName: "Customer",
            addressLine1: "123 Main St",
            postalCode: "60601",
            city: "Chicago",
            state: "IL",
            country: "US",
          },
          createdAt: "2024-09-22T11:15:00Z",
          updatedAt: "2024-09-22T11:15:00Z",
        },
        {
          orderId: "BR24090004",
          customerId: "CUST004",
          customerEmail: "sarah.wilson@example.com",
          customerName: "Sarah Wilson",
          status: "delivered",
          paymentStatus: "succeeded",
          totalAmount: 1299.99,
          itemCount: 1,
          shippingMethod: "Overnight",
          items: [],
          subtotal: 1249.99,
          taxAmount: 25.0,
          shippingCost: 25.0,
          discountAmount: 0,
          billingAddress: {
            firstName: "Sarah",
            lastName: "Wilson",
            email: "sarah.wilson@example.com",
            phone: "+1234567893",
            addressLine1: "123 Main St",
            city: "Miami",
            state: "FL",
            postalCode: "33101",
            country: "US",
          },
          shippingAddress: {
            firstName: "Sample",
            lastName: "Customer",
            addressLine1: "123 Main St",
            postalCode: "33101",
            city: "Miami",
            state: "FL",
            country: "US",
          },
          createdAt: "2024-09-18T16:30:00Z",
          updatedAt: "2024-09-21T14:20:00Z",
          estimatedDelivery: "2024-09-20T12:00:00Z",
        },
        {
          orderId: "BR24090005",
          customerId: "CUST005",
          customerEmail: "david.brown@example.com",
          customerName: "David Brown",
          status: "cancelled",
          paymentStatus: "refunded",
          totalAmount: 24.99,
          itemCount: 1,
          shippingMethod: "Standard",
          items: [],
          subtotal: 22.99,
          taxAmount: 2.0,
          shippingCost: 0,
          discountAmount: 0,
          billingAddress: {
            firstName: "David",
            lastName: "Brown",
            email: "david.brown@example.com",
            phone: "+1234567894",
            addressLine1: "123 Main St",
            city: "Seattle",
            state: "WA",
            postalCode: "98101",
            country: "US",
          },
          shippingAddress: {
            firstName: "Sample",
            lastName: "Customer",
            addressLine1: "123 Main St",
            postalCode: "98101",
            city: "Seattle",
            state: "WA",
            country: "US",
          },
          createdAt: "2024-09-20T09:45:00Z",
          updatedAt: "2024-09-21T10:30:00Z",
        },
      ];

      setOrders(mockOrders);

      // Calculate stats from mock data
      const revenue = mockOrders
        .filter((o) => o.paymentStatus === "succeeded")
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = mockOrders.length;

      setStats({
        totalOrders,
        totalRevenue: revenue,
        averageOrderValue: totalOrders > 0 ? revenue / totalOrders : 0,
        pendingOrders: mockOrders.filter((o) => o.status === "pending").length,
        processingOrders: mockOrders.filter((o) => o.status === "processing")
          .length,
        shippedOrders: mockOrders.filter((o) => o.status === "shipped").length,
        deliveredOrders: mockOrders.filter((o) => o.status === "delivered")
          .length,
        cancelledOrders: mockOrders.filter((o) => o.status === "cancelled")
          .length,
        refundedOrders: mockOrders.filter((o) => o.status === "refunded")
          .length,
        todayOrders: 0,
        todayRevenue: 0,
      });

      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, paymentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      processing: { label: "Processing", variant: "default" as const },
      shipped: { label: "Shipped", variant: "default" as const },
      delivered: { label: "Delivered", variant: "default" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      succeeded: { label: "Paid", variant: "default" as const },
      failed: { label: "Failed", variant: "destructive" as const },
      refunded: { label: "Refunded", variant: "outline" as const },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await braceletOrderService.updateOrderStatus(orderId, {
        status: newStatus,
        notifyCustomer: true,
      });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleExportOrders = async () => {
    try {
      const filters = {
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter,
        paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
      };

      const blob = await braceletOrderService.exportOrders(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bracelet-orders-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Orders exported successfully",
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select orders to update",
        variant: "destructive",
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await braceletOrderService.bulkUpdateStatus(
        selectedOrders,
        newStatus
      );

      if (result.success > 0) {
        toast({
          title: "Success",
          description: `Updated ${result.success} orders successfully`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: "Partial Success",
          description: `${result.success} orders updated, ${result.failed} failed`,
          variant: "destructive",
        });
      }

      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error("Error updating orders:", error);
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.orderId));
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail &&
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    // TODO: Implement date filtering
    const matchesDate = true;

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bracelet Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track order fulfillment
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fetchOrders()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.averageOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment</label>
                  <Select
                    value={paymentFilter}
                    onValueChange={setPaymentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="succeeded">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">
                        Newest First
                      </SelectItem>
                      <SelectItem value="createdAt-asc">
                        Oldest First
                      </SelectItem>
                      <SelectItem value="totalAmount-desc">
                        Highest Value
                      </SelectItem>
                      <SelectItem value="totalAmount-asc">
                        Lowest Value
                      </SelectItem>
                      <SelectItem value="customerName-asc">
                        Customer A-Z
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {selectedOrders.length} order
                      {selectedOrders.length > 1 ? "s" : ""} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrders([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("confirmed")}
                      disabled={bulkActionLoading}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("processing")}
                      disabled={bulkActionLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("shipped")}
                      disabled={bulkActionLoading}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Ship
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <button
                        onClick={handleSelectAllOrders}
                        className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                        aria-label="Select all orders"
                      >
                        {selectedOrders.length === filteredOrders.length &&
                          filteredOrders.length > 0 && (
                            <CheckSquare className="h-3 w-3" />
                          )}
                        {selectedOrders.length > 0 &&
                          selectedOrders.length < filteredOrders.length && (
                            <Square className="h-3 w-3" />
                          )}
                      </button>
                    </TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const paymentBadge = getPaymentStatusBadge(
                      order.paymentStatus
                    );
                    const isSelected = selectedOrders.includes(order.orderId);

                    return (
                      <TableRow
                        key={order.orderId}
                        className={isSelected ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <button
                            onClick={() => handleSelectOrder(order.orderId)}
                            className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                            aria-label={`Select order ${order.orderId}`}
                          >
                            {isSelected && <CheckSquare className="h-3 w-3" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono">
                          {order.orderId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.customerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentBadge.variant}>
                            {paymentBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>{order.itemCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/bracelets/orders/${order.orderId}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {order.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.orderId,
                                      "confirmed"
                                    )
                                  }
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  Confirm Order
                                </DropdownMenuItem>
                              )}
                              {(order.status === "confirmed" ||
                                order.status === "processing") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.orderId,
                                      "shipped"
                                    )
                                  }
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark as Shipped
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pending</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-yellow-500 rounded"
                          style={{
                            width: `${
                              (stats.pendingOrders / stats.totalOrders) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.pendingOrders}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${
                              (stats.processingOrders / stats.totalOrders) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.processingOrders}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipped</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-purple-500 rounded"
                          style={{
                            width: `${
                              (stats.shippedOrders / stats.totalOrders) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.shippedOrders}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivered</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{
                            width: `${
                              (stats.deliveredOrders / stats.totalOrders) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.deliveredOrders}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-semibold">
                      ${stats.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Average Order Value
                    </span>
                    <span className="font-semibold">
                      ${stats.averageOrderValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Fulfillment Rate
                    </span>
                    <span className="font-semibold">
                      {stats.totalOrders > 0
                        ? Math.round(
                            ((stats.deliveredOrders + stats.shippedOrders) /
                              stats.totalOrders) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
