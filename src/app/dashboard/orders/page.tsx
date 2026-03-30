"use client"

import { useState, useEffect, useCallback } from "react"
import { orderService } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  RefreshCw, 
  Clock, 
  DollarSign, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  ChefHat,
  Printer,
  FileText,
  FileSpreadsheet
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { formatPrice, getCurrencySymbol } from "@/utils/currency"

import { Order, OrderFilters, ApiError, OrderStatistics } from "@/types/api"

// Extended order interface to handle legacy field names
interface LegacyOrder extends Omit<Order, 'orderNumber' | 'totalAmount' | 'items' | 'deliveryStatus'> {
  orderId: string
  orderTotal: number
  orderDate: string
  paymentDate?: string
  orderStatus: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  deliveryStatus?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
  products: Array<{
    productId: string
    productName: string
    quantity: number
    amount: number
    components?: Array<{
      id: string
      title: string
      weight: number
      price: number
    }>
    addOns?: Array<{
      addOnId: string
      name: string
      quantity: number
      price: number
    }>
  }>
  customerNotes?: string
  estimatedPreparationTime?: number
  confirmedAt?: string
  preparingAt?: string
  readyAt?: string
  completedAt?: string
  cancelledAt?: string
  deliveryNotes?: string
}

// Extended statistics interface to handle legacy field names
interface LegacyOrderStatistics extends Omit<OrderStatistics, 'ordersByStatus' | 'topProducts'> {
  ordersByStatus: {
    pending: number
    confirmed: number
    preparing: number
    ready: number
    completed: number
    cancelled: number
  }
  paymentStatus: {
    pending: number
    paid: number
    failed: number
    refunded: number
  }
  topProducts: Array<{
    productId: string
    name: string
    count: number
    revenue: number
  }>
}

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "default", icon: AlertCircle },
  { value: "confirmed", label: "Confirmed", color: "blue", icon: CheckCircle },
  { value: "preparing", label: "Preparing", color: "yellow", icon: ChefHat },
  { value: "ready", label: "Ready", color: "green", icon: Package },
  { value: "completed", label: "Completed", color: "green", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", color: "red", icon: XCircle },
]

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "assigned", label: "Assigned", color: "blue" },
  { value: "picked_up", label: "Picked Up", color: "yellow" },
  { value: "in_transit", label: "In Transit", color: "orange" },
  { value: "delivered", label: "Delivered", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "paid", label: "Paid", color: "green" },
  { value: "failed", label: "Failed", color: "red" },
  { value: "refunded", label: "Refunded", color: "blue" },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<LegacyOrder[]>([])
  const [statistics, setStatistics] = useState<LegacyOrderStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LegacyOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all")
  const [filterDateRange, setFilterDateRange] = useState<{ start?: string; end?: string }>({})
  const { toast } = useToast()

  const fetchDataCallback = useCallback(async () => {
    try {
      setLoading(true)
      const filters: OrderFilters = {}
      
      if (filterStatus !== "all") filters.status = filterStatus
      if (filterPaymentStatus !== "all") filters.paymentStatus = filterPaymentStatus
      if (filterDateRange.start) filters.startDate = filterDateRange.start
      if (filterDateRange.end) filters.endDate = filterDateRange.end
      
      const response = Object.keys(filters).length > 0 
        ? await orderService.findFiltered(filters)
        : await orderService.findAll()
      
      const ordersData = response.orders || response || []
      setOrders(ordersData)
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPaymentStatus, filterDateRange, toast])

  const fetchStatisticsCallback = useCallback(async () => {
    try {
      const stats = await orderService.getStatistics(
        filterDateRange.start,
        filterDateRange.end
      )
      setStatistics(stats)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error("Failed to fetch statistics:", apiError)
    }
  }, [filterDateRange.start, filterDateRange.end])

  useEffect(() => {
    fetchDataCallback()
    fetchStatisticsCallback()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDataCallback()
      fetchStatisticsCallback()
    }, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [fetchDataCallback, fetchStatisticsCallback])


  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderService.updateStatus(orderId, status)
      toast({
        title: "Success",
        description: `Order status updated to ${status}`,
      })
      fetchDataCallback()
      if (selectedOrder?.orderId === orderId) {
        const updated = await orderService.findOne(orderId)
        setSelectedOrder(updated)
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      await orderService.updateDeliveryStatus(orderId, status)
      toast({
        title: "Success",
        description: `Delivery status updated to ${status}`,
      })
      fetchDataCallback()
      if (selectedOrder?.orderId === orderId) {
        const updated = await orderService.findOne(orderId)
        setSelectedOrder(updated)
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update delivery status",
        variant: "destructive",
      })
    }
  }

  const openDetailDialog = async (order: LegacyOrder) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }

  const handleExportCSV = async () => {
    try {
      const filters: OrderFilters = {}
      
      if (filterStatus !== "all") filters.status = filterStatus
      if (filterPaymentStatus !== "all") filters.paymentStatus = filterPaymentStatus
      if (filterDateRange.start) filters.startDate = filterDateRange.start
      if (filterDateRange.end) filters.endDate = filterDateRange.end
      
      const blob = await orderService.exportToCSV(filters)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Orders exported to CSV successfully",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to export orders",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = async () => {
    try {
      const filters: OrderFilters = {}
      
      if (filterStatus !== "all") filters.status = filterStatus
      if (filterPaymentStatus !== "all") filters.paymentStatus = filterPaymentStatus
      if (filterDateRange.start) filters.startDate = filterDateRange.start
      if (filterDateRange.end) filters.endDate = filterDateRange.end
      
      const summary = await orderService.getOrdersSummary(filters)
      
      // Create a printable HTML document
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Orders Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .statistics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
              .stat-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
              .stat-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
              .stat-card .value { font-size: 24px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
              .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Orders Report</h1>
              <p>Generated: ${new Date().toLocaleString()}</p>
              ${filterDateRange.start ? `<p>Period: ${filterDateRange.start} to ${filterDateRange.end || 'Present'}</p>` : ''}
            </div>
            
            <div class="statistics">
              <div class="stat-card">
                <h3>Total Orders</h3>
                <div class="value">${summary.statistics.totalOrders}</div>
              </div>
              <div class="stat-card">
                <h3>Total Revenue</h3>
                <div class="value">${getCurrencySymbol()} ${summary.statistics.totalRevenue.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <h3>Average Order Value</h3>
                <div class="value">${getCurrencySymbol()} ${summary.statistics.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>
            
            <h2>Orders List</h2>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${summary.orders.map((order: LegacyOrder) => `
                  <tr>
                    <td>${order.orderId.substring(0, 8)}</td>
                    <td>${format(new Date(order.orderDate), "MMM dd, HH:mm")}</td>
                    <td>${order.customerName || order.profileId.substring(0, 8)}</td>
                    <td>${order.products.reduce((sum, p) => sum + p.quantity, 0)}</td>
                    <td>${getCurrencySymbol()} ${order.orderTotal.toFixed(2)}</td>
                    <td>${order.orderStatus}</td>
                    <td>${order.paymentStatus}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Your Restaurant. All rights reserved.</p>
            </div>
          </body>
        </html>
      `
      
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
      
      toast({
        title: "Success",
        description: "Orders report opened for printing",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to generate report",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, type: "order" | "delivery" | "payment") => {
    let options: Array<{ value: string; label: string; color: string; icon?: React.ComponentType<{ className?: string }> }> = []
    
    if (type === "order") options = ORDER_STATUS_OPTIONS
    else if (type === "delivery") options = DELIVERY_STATUS_OPTIONS
    else options = PAYMENT_STATUS_OPTIONS
    
    const option = options.find(o => o.value === status)
    if (!option) return <Badge>{status}</Badge>
    
    const variantMap: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      default: "secondary",
      blue: "default",
      yellow: "outline",
      orange: "outline",
      green: "default",
      red: "destructive",
    }
    
    return (
      <Badge variant={(variantMap[option.color] as "default" | "destructive" | "outline" | "secondary") || "default"}>
        {option.icon && <option.icon className="w-3 h-3 mr-1" />}
        {option.label}
      </Badge>
    )
  }

  const columns = [
    {
      key: "orderId",
      header: "Order ID",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return (
          <span className="font-mono text-xs">{order.orderId.substring(0, 8)}</span>
        )
      },
    },
    {
      key: "orderDate",
      header: "Date",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return format(new Date(order.orderDate), "MMM dd, HH:mm")
      },
      sortable: true,
    },
    {
      key: "customer",
      header: "Customer",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return order.customerName || order.profileId.substring(0, 8)
      },
    },
    {
      key: "products",
      header: "Items",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return (
          <span>{order.products.reduce((sum, p) => sum + p.quantity, 0)} items</span>
        )
      },
    },
    {
      key: "orderTotal",
      header: "Total",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return formatPrice(order.orderTotal)
      },
      sortable: true,
    },
    {
      key: "orderStatus",
      header: "Order Status",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return getStatusBadge(order.orderStatus, "order")
      },
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return getStatusBadge(order.paymentStatus, "payment")
      },
    },
    {
      key: "deliveryStatus",
      header: "Delivery",
      render: (item: Record<string, unknown>) => {
        const order = item as unknown as LegacyOrder
        return order.deliveryStatus 
          ? getStatusBadge(order.deliveryStatus, "delivery")
          : <span className="text-gray-400">-</span>
      },
    },
  ]

  const actions = (item: Record<string, unknown>) => {
    const order = item as unknown as LegacyOrder
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDetailDialog(order)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalOrders}</div>
              <div className="text-xs text-muted-foreground">
                {statistics.pendingOrders} pending
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(statistics.totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">
                Avg: {formatPrice(statistics.averageOrderValue)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.pendingOrders}
              </div>
              <div className="text-xs text-muted-foreground">
                {statistics.weeklyOrders} this week
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.todayOrders}</div>
              <div className="text-xs text-muted-foreground">
                {statistics.completedOrders} completed total
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders Management</CardTitle>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={filterDateRange.start || ""}
              onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
              className="w-40"
            />
            
            <Input
              type="date"
              value={filterDateRange.end || ""}
              onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
              className="w-40"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDataCallback}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : (
            <DataTable
              data={orders as unknown as Record<string, unknown>[]}
              columns={columns}
              actions={actions}
              searchPlaceholder="Search orders..."
            />
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.orderId.substring(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Created: {selectedOrder && format(new Date(selectedOrder.orderDate), "PPpp")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <p className="text-sm">{selectedOrder.customerName || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedOrder.customerPhone || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedOrder.customerEmail || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <p className="text-sm capitalize">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <Label>Order Total</Label>
                    <p className="text-lg font-bold">{formatPrice(selectedOrder.orderTotal)}</p>
                  </div>
                  <div>
                    <Label>Payment Status</Label>
                    <p>{getStatusBadge(selectedOrder.paymentStatus, "payment")}</p>
                  </div>
                </div>
                
                {selectedOrder.customerNotes && (
                  <div>
                    <Label>Customer Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.customerNotes}</p>
                  </div>
                )}
                
                {selectedOrder.deliveryNotes && (
                  <div>
                    <Label>Delivery Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.deliveryNotes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">
                            Quantity: {product.quantity} × {formatPrice(product.amount)}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(product.quantity * product.amount)}</p>
                      </div>
                      
                      {product.components && product.components.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2">
                          <p className="text-xs font-medium mb-1">Components:</p>
                          {product.components.map((comp, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              • {comp.title}: {comp.weight}g - {formatPrice(comp.price)}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {product.addOns && product.addOns.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2">
                          <p className="text-xs font-medium mb-1">Add-ons:</p>
                          {product.addOns.map((addon, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              • {addon.name}: {addon.quantity} × {formatPrice(addon.price)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.orderTotal)}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <div>
                  <Label>Order Status</Label>
                  <Select
                    value={selectedOrder.orderStatus}
                    onValueChange={(value) => handleUpdateOrderStatus(selectedOrder.orderId, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Delivery Status</Label>
                  <Select
                    value={selectedOrder.deliveryStatus || "pending"}
                    onValueChange={(value) => handleUpdateDeliveryStatus(selectedOrder.orderId, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedOrder.estimatedPreparationTime && (
                  <div>
                    <Label>Estimated Preparation Time</Label>
                    <p className="text-sm">{selectedOrder.estimatedPreparationTime} minutes</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(selectedOrder.orderDate), "PPpp")}
                      </p>
                    </div>
                  </div>
                  
                  {selectedOrder.confirmedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Order Confirmed</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedOrder.confirmedAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.preparingAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Preparation Started</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedOrder.preparingAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.readyAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Order Ready</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedOrder.readyAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.completedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Order Completed</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedOrder.completedAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.cancelledAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Order Cancelled</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedOrder.cancelledAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}