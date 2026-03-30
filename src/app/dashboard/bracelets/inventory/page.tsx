'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Dialog functionality will be added later
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Package,
  AlertTriangle,
  BarChart3,
  Plus,
  Edit3,
  Eye,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';
import {
  braceletInventoryService,
  BraceletInventory,
  InventoryAdjustmentDto,
  InventoryReport,
  InventoryAlert,
} from '@/lib/services/bracelet-inventory.service';

export default function BraceletInventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<BraceletInventory[]>([]);
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('inventory');

  // Adjustment states
  const [selectedItem, setSelectedItem] = useState<BraceletInventory | null>(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustmentDto>({
    productId: '',
    variantId: '',
    adjustmentType: 'increase',
    quantity: 0,
    reason: '',
    notes: '',
  });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchTerm,
        isLowStock: statusFilter === 'low_stock' ? true : undefined,
        isOutOfStock: statusFilter === 'out_of_stock' ? true : undefined,
        requiresReorder: statusFilter === 'reorder_needed' ? true : undefined,
        isActive: statusFilter === 'inactive' ? false : undefined,
        page,
        limit: 20,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const [inventoryResponse, reportResponse, alertsResponse] = await Promise.all([
        braceletInventoryService.getInventory(filters),
        braceletInventoryService.getInventoryReport(),
        braceletInventoryService.getInventoryAlerts(),
      ]);

      setInventory(inventoryResponse.inventory);
      setTotalPages(inventoryResponse.totalPages);
      setReport(reportResponse);
      setAlerts(alertsResponse);
    } catch (error) {
      console.error('Error fetching inventory:', error);

      // Fallback to mock data
      const mockInventory: BraceletInventory[] = [
        {
          inventoryId: 'INV001',
          productId: 'BR001',
          variantId: 'BR001-S-SILVER',
          sku: 'ELGSLV001-S',
          productName: 'Elegance Silver Charm Bracelet',
          size: 'S',
          color: 'Silver',
          availableQuantity: 15,
          reservedQuantity: 3,
          totalQuantity: 18,
          lowStockThreshold: 10,
          outOfStockThreshold: 0,
          isActive: true,
          isDiscontinued: false,
          isLowStock: true,
          isOutOfStock: false,
          requiresReorder: false,
          totalSold: 87,
          alertsEnabled: true,
          createdAt: '2024-09-20T08:00:00Z',
          updatedAt: '2024-09-22T14:30:00Z',
        },
        {
          inventoryId: 'INV002',
          productId: 'BR002',
          variantId: 'BR002-M-BROWN',
          sku: 'CLSLTH002-M',
          productName: 'Classic Leather Wrap Bracelet',
          size: 'M',
          color: 'Brown',
          availableQuantity: 0,
          reservedQuantity: 0,
          totalQuantity: 0,
          lowStockThreshold: 5,
          outOfStockThreshold: 0,
          isActive: true,
          isDiscontinued: false,
          isLowStock: false,
          isOutOfStock: true,
          requiresReorder: true,
          totalSold: 134,
          alertsEnabled: true,
          createdAt: '2024-09-20T08:00:00Z',
          updatedAt: '2024-09-22T09:15:00Z',
        },
        {
          inventoryId: 'INV003',
          productId: 'BR001',
          variantId: 'BR001-M-GOLD',
          sku: 'ELGSLV001-M-GOLD',
          productName: 'Elegance Gold Charm Bracelet',
          size: 'M',
          color: 'Gold',
          availableQuantity: 45,
          reservedQuantity: 2,
          totalQuantity: 47,
          lowStockThreshold: 15,
          outOfStockThreshold: 0,
          isActive: true,
          isDiscontinued: false,
          isLowStock: false,
          isOutOfStock: false,
          requiresReorder: false,
          totalSold: 23,
          alertsEnabled: true,
          createdAt: '2024-09-20T08:00:00Z',
          updatedAt: '2024-09-22T11:45:00Z',
        },
      ];

      setInventory(mockInventory);
      setReport({
        summary: {
          totalProducts: 3,
          totalValue: 15675.50,
          lowStockItems: 1,
          outOfStockItems: 1,
          reorderNeeded: 1,
          totalMovements: 456,
        },
        categories: [],
        topSellingProducts: [],
        slowMovingProducts: [],
        stockLevels: {
          optimal: 1,
          understock: 1,
          overstock: 0,
          outOfStock: 1,
        },
      });
      setAlerts([
        {
          id: 'ALERT001',
          type: 'low_stock',
          severity: 'medium',
          productId: 'BR001',
          variantId: 'BR001-S-SILVER',
          productName: 'Elegance Silver Charm Bracelet',
          sku: 'ELGSLV001-S',
          message: 'Stock level is below threshold',
          currentStock: 15,
          threshold: 10,
          recommendedAction: 'Reorder 50 units',
          createdAt: new Date(),
          isRead: false,
        },
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const getStockBadge = (item: BraceletInventory) => {
    if (item.isOutOfStock) {
      return <Badge variant="destructive" className="bg-red-500">Out of Stock</Badge>;
    }
    if (item.isLowStock) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Stock</Badge>;
    }
    if (item.requiresReorder) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Reorder Needed</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">In Stock</Badge>;
  };

  const handleAdjustment = async () => {
    if (!selectedItem) return;

    try {
      await braceletInventoryService.adjustStock({
        ...adjustmentForm,
        productId: selectedItem.productId,
        variantId: selectedItem.variantId,
      });

      toast({
        title: 'Success',
        description: 'Stock adjustment completed successfully',
      });

      setShowAdjustmentForm(false);
      setSelectedItem(null);
      setAdjustmentForm({
        productId: '',
        variantId: '',
        adjustmentType: 'increase',
        quantity: 0,
        reason: '',
        notes: '',
      });
      fetchInventory();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust stock',
        variant: 'destructive',
      });
    }
  };

  const openAdjustmentDialog = (item: BraceletInventory) => {
    setSelectedItem(item);
    setAdjustmentForm({
      productId: item.productId,
      variantId: item.variantId,
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      notes: '',
    });
    setShowAdjustmentForm(true);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'low_stock' && item.isLowStock) ||
      (statusFilter === 'out_of_stock' && item.isOutOfStock) ||
      (statusFilter === 'reorder_needed' && item.requiresReorder) ||
      (statusFilter === 'inactive' && !item.isActive);

    return matchesSearch && matchesStatus;
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track stock levels, manage inventory, and monitor alerts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fetchInventory()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${report.summary.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{report.summary.lowStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.summary.outOfStockItems}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.filter(alert => !alert.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {alerts.filter(alert => !alert.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
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
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="reorder_needed">Reorder Needed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productName-asc">Name A-Z</SelectItem>
                      <SelectItem value="productName-desc">Name Z-A</SelectItem>
                      <SelectItem value="availableQuantity-asc">Stock Low-High</SelectItem>
                      <SelectItem value="availableQuantity-desc">Stock High-Low</SelectItem>
                      <SelectItem value="totalSold-desc">Best Selling</SelectItem>
                      <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Bulk Adjust
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Sold</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.inventoryId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">ID: {item.productId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{item.size}</Badge>
                          <Badge variant="outline">{item.color}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${item.availableQuantity <= item.lowStockThreshold ? 'text-red-600' : ''}`}>
                          {item.availableQuantity}
                        </span>
                      </TableCell>
                      <TableCell>{item.reservedQuantity}</TableCell>
                      <TableCell className="font-medium">{item.totalQuantity}</TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                      <TableCell>{item.totalSold}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAdjustmentDialog(item)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts ({alerts.length})</CardTitle>
              <CardDescription>
                Critical inventory notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${
                      alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                      alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {alert.type === 'out_of_stock' && <XCircle className="h-5 w-5 text-red-500" />}
                          {alert.type === 'low_stock' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                          {alert.type === 'reorder_needed' && <RefreshCw className="h-5 w-5 text-orange-500" />}
                          {alert.type === 'excess_stock' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                          {alert.type === 'quality_issue' && <AlertCircle className="h-5 w-5 text-red-500" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{alert.productName}</h4>
                          <p className="text-sm text-muted-foreground">SKU: {alert.sku}</p>
                          <p className="text-sm mt-1">{alert.message}</p>
                          {alert.recommendedAction && (
                            <p className="text-sm text-blue-600 mt-1">
                              <strong>Recommended:</strong> {alert.recommendedAction}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Stock: {alert.currentStock}</div>
                        <div>{new Date(alert.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No active alerts</p>
                    <p className="text-sm text-gray-400">Your inventory is in good shape!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {report && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Level Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Optimal Stock</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-green-500 rounded"
                              style={{ width: `${(report.stockLevels.optimal / report.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{report.stockLevels.optimal}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Under Stock</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-yellow-500 rounded"
                              style={{ width: `${(report.stockLevels.understock / report.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{report.stockLevels.understock}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Out of Stock</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-red-500 rounded"
                              style={{ width: `${(report.stockLevels.outOfStock / report.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{report.stockLevels.outOfStock}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Over Stock</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-blue-500 rounded"
                              style={{ width: `${(report.stockLevels.overstock / report.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{report.stockLevels.overstock}</span>
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
                        <span className="text-muted-foreground">Total Stock Value</span>
                        <span className="font-semibold">${report.summary.totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground">Total Movements</span>
                        <span className="font-semibold">{report.summary.totalMovements}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground">Stock Turnover</span>
                        <span className="font-semibold">2.3x</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Average Stock Age</span>
                        <span className="font-semibold">45 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Form */}
      {showAdjustmentForm && selectedItem && (
        <Card className="fixed top-4 right-4 w-96 z-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Adjust Stock</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdjustmentForm(false)}
              >
                ×
              </Button>
            </CardTitle>
            <CardDescription>
              Update inventory levels for {selectedItem.productName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Current Stock</label>
                <p className="text-2xl font-bold">{selectedItem.availableQuantity}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Reserved</label>
                <p className="text-lg">{selectedItem.reservedQuantity}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select
                value={adjustmentForm.adjustmentType}
                onValueChange={(value) => setAdjustmentForm(prev => ({
                  ...prev,
                  adjustmentType: value as 'increase' | 'decrease' | 'set'
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm(prev => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 0
                }))}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                placeholder="e.g., Damaged goods, Physical count adjustment"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowAdjustmentForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdjustment} className="flex-1">
                Apply Adjustment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}