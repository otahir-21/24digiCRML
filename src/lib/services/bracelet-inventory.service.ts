import apiClient from '../api-client';

export interface InventoryMovement {
  movementId: string;
  type: "stock_in" | "stock_out" | "adjustment" | "reserved" | "unreserved" | "damaged" | "returned";
  quantity: number;
  runningBalance: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  performedBy?: string;
  notes?: string;
  timestamp: Date;
  unitCost?: number;
}

export interface InventoryLocation {
  locationId: string;
  name: string;
  address?: string;
  quantity: number;
  reservedQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  isActive: boolean;
}

export interface SupplierInfo {
  supplierId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  notes?: string;
}

export interface CostInfo {
  averageCost?: number;
  lastPurchaseCost?: number;
  standardCost?: number;
  lastPurchaseDate?: Date;
  totalCostValue?: number;
}

export interface ReorderInfo {
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  autoReorderEnabled: boolean;
  lastReorderDate?: Date;
  nextReorderDate?: Date;
  isOnOrder: boolean;
  quantityOnOrder?: number;
}

export interface BraceletInventory {
  _id?: string;
  inventoryId: string;
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  size: string;
  color: string;

  // Stock Levels
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  damagedQuantity?: number;
  inTransitQuantity?: number;

  // Thresholds
  lowStockThreshold: number;
  outOfStockThreshold: number;
  maxStockLevel?: number;

  // Status
  isActive: boolean;
  isDiscontinued: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  requiresReorder: boolean;

  // Additional Info
  locations?: InventoryLocation[];
  supplier?: SupplierInfo;
  costInfo?: CostInfo;
  reorderInfo?: ReorderInfo;
  movementHistory?: InventoryMovement[];

  // Analytics
  totalSold: number;
  lastSoldDate?: Date;
  averageMonthlySales?: number;
  salesVelocity?: number;

  // Quality
  qualityRating?: number;
  defectRate?: number;
  lastQualityCheckDate?: Date;
  qualityNotes?: string;

  // Alerts
  alertsEnabled: boolean;
  alertRecipients?: string[];
  lastAlertSent?: Date;

  // Batch tracking
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: Date;
  manufactureDate?: Date;

  // Admin
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAdjustmentDto {
  productId: string;
  variantId: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
  unitCost?: number;
}

export interface BulkInventoryAdjustmentDto {
  adjustments: InventoryAdjustmentDto[];
  reason: string;
  notes?: string;
}

export interface PhysicalCountDto {
  productId: string;
  variantId: string;
  physicalCount: number;
  countedBy: string;
  notes?: string;
}

export interface InventoryFilters {
  search?: string;
  productId?: string;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  requiresReorder?: boolean;
  isActive?: boolean;
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'reorder_needed' | 'excess_stock' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  message: string;
  currentStock: number;
  threshold?: number;
  recommendedAction?: string;
  createdAt: Date;
  isRead: boolean;
}

export interface InventoryReport {
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    reorderNeeded: number;
    totalMovements: number;
  };
  categories: Array<{
    category: string;
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    totalSold: number;
    revenue: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    daysWithoutSale: number;
    currentStock: number;
  }>;
  stockLevels: {
    optimal: number;
    understock: number;
    overstock: number;
    outOfStock: number;
  };
}

export interface MovementFilters {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  referenceId?: string;
}

class BraceletInventoryService {
  private baseUrl = '/v1/bracelet-inventory';

  // Get inventory with filters
  async getInventory(filters?: InventoryFilters): Promise<{
    inventory: BraceletInventory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  // Get single inventory item
  async getInventoryItem(productId: string, variantId: string): Promise<BraceletInventory> {
    const response = await apiClient.get(`${this.baseUrl}/stock/${productId}/${variantId}`);
    return response.data;
  }

  // Adjust stock
  async adjustStock(adjustment: InventoryAdjustmentDto): Promise<BraceletInventory> {
    const response = await apiClient.post(`${this.baseUrl}/adjust`, adjustment);
    return response.data;
  }

  // Bulk adjust stock
  async bulkAdjustStock(bulkAdjustment: BulkInventoryAdjustmentDto): Promise<{
    success: number;
    failed: number;
    errors: Array<{ productId: string; variantId: string; error: string }>;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-adjust`, bulkAdjustment);
    return response.data;
  }

  // Perform physical count
  async performPhysicalCount(count: PhysicalCountDto): Promise<{
    variance: number;
    adjustmentMade: boolean;
    newStock: number;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/physical-count`, count);
    return response.data;
  }

  // Get low stock items
  async getLowStockItems(threshold?: number): Promise<BraceletInventory[]> {
    const params = threshold ? `?threshold=${threshold}` : '';
    const response = await apiClient.get(`${this.baseUrl}/low-stock${params}`);
    return response.data;
  }

  // Get out of stock items
  async getOutOfStockItems(): Promise<BraceletInventory[]> {
    const response = await apiClient.get(`${this.baseUrl}/out-of-stock`);
    return response.data;
  }

  // Get inventory alerts
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const response = await apiClient.get(`${this.baseUrl}/alerts`);
    return response.data;
  }

  // Get inventory report
  async getInventoryReport(filters?: { category?: string; brand?: string }): Promise<InventoryReport> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);

    const response = await apiClient.get(`${this.baseUrl}/report?${params.toString()}`);
    return response.data;
  }

  // Get inventory movements
  async getInventoryMovements(filters?: MovementFilters): Promise<{
    movements: InventoryMovement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}/movements?${params.toString()}`);
    return response.data;
  }

  // Update stock thresholds
  async updateStockThresholds(
    productId: string,
    variantId: string,
    thresholds: {
      lowStockThreshold?: number;
      outOfStockThreshold?: number;
      maxStockLevel?: number;
    }
  ): Promise<BraceletInventory> {
    const response = await apiClient.put(`${this.baseUrl}/thresholds/${productId}/${variantId}`, thresholds);
    return response.data;
  }

  // Reserve stock for order
  async reserveStock(productId: string, variantId: string, quantity: number, orderId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/reserve`, {
      productId,
      variantId,
      quantity,
      orderId,
    });
  }

  // Release reserved inventory
  async releaseReservedInventory(orderId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/release/${orderId}`);
  }

  // Process order confirmation
  async processOrderConfirmation(orderId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/confirm-order/${orderId}`);
  }

  // Sync product variant stock
  async syncProductVariantStock(productId: string, variantId: string, stock: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/sync/${productId}/${variantId}`, { stock });
  }
}

export const braceletInventoryService = new BraceletInventoryService();