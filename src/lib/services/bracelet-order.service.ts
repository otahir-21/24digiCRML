import apiClient from '../api-client';

export interface BraceletOrderItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
  customizations?: Array<{
    optionId: string;
    optionName: string;
    value: string;
    additionalPrice: number;
  }>;
  status?: string;
  trackingNumber?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  deliveryInstructions?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  last4Digits?: string;
  cardBrand?: string;
  paymentDate?: Date;
  refundId?: string;
  refundAmount?: number;
  refundDate?: Date;
}

export interface ShippingInfo {
  method: string;
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cost: number;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  status?: string;
  signedBy?: string;
}

export interface OrderDiscount {
  type: string;
  code: string;
  description: string;
  amount: number;
  discountType: string;
}

export interface OrderTimeline {
  event: string;
  description: string;
  timestamp: Date;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface BraceletOrder {
  _id?: string;
  orderId: string;
  customerId: string;
  customerEmail?: string;
  items: BraceletOrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  paymentInfo?: PaymentInfo;
  shippingInfo?: ShippingInfo;
  discounts?: OrderDiscount[];
  notes?: string;
  adminNotes?: string;
  giftMessage?: string;
  orderTimeline?: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface UpdateOrderStatusDto {
  status: string;
  notes?: string;
  notifyCustomer?: boolean;
}

export interface CreateShipmentDto {
  carrier: string;
  trackingNumber: string;
  method: string;
  cost: number;
  estimatedDelivery?: Date;
  trackingUrl?: string;
  labelUrl?: string;
}

export interface ProcessRefundDto {
  amount: number;
  reason: string;
  notifyCustomer?: boolean;
}

class BraceletOrderService {
  private baseUrl = '/v1/bracelet-store/orders';

  // Get all orders with filters
  async getOrders(filters?: OrderFilters): Promise<{
    orders: BraceletOrder[];
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

  // Get single order by ID
  async getOrderById(orderId: string): Promise<BraceletOrder> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}`);
    return response.data;
  }

  // Create new order
  async createOrder(orderData: Partial<BraceletOrder>): Promise<BraceletOrder> {
    const response = await apiClient.post(this.baseUrl, orderData);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: string, updateData: UpdateOrderStatusDto): Promise<BraceletOrder> {
    const response = await apiClient.patch(`${this.baseUrl}/${orderId}/status`, updateData);
    return response.data;
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/cancel`, { reason });
    return response.data;
  }

  // Confirm order
  async confirmOrder(orderId: string): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/confirm`);
    return response.data;
  }

  // Mark order as processing
  async processOrder(orderId: string): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/process`);
    return response.data;
  }

  // Create shipment for order
  async createShipment(orderId: string, shipmentData: CreateShipmentDto): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/ship`, shipmentData);
    return response.data;
  }

  // Mark order as delivered
  async markAsDelivered(orderId: string, signedBy?: string): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/deliver`, { signedBy });
    return response.data;
  }

  // Process refund
  async processRefund(orderId: string, refundData: ProcessRefundDto): Promise<BraceletOrder> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/refund`, refundData);
    return response.data;
  }

  // Add admin notes
  async addAdminNotes(orderId: string, notes: string): Promise<BraceletOrder> {
    const response = await apiClient.patch(`${this.baseUrl}/${orderId}/notes`, { adminNotes: notes });
    return response.data;
  }

  // Get order statistics
  async getStatistics(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<OrderStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`${this.baseUrl}/statistics?${params.toString()}`);
    return response.data;
  }

  // Get order timeline
  async getOrderTimeline(orderId: string): Promise<OrderTimeline[]> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}/timeline`);
    return response.data;
  }

  // Export orders to CSV
  async exportOrders(filters?: OrderFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Resend order confirmation email
  async resendOrderConfirmation(orderId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/${orderId}/resend-confirmation`);
    return response.data;
  }

  // Get shipping label
  async getShippingLabel(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}/shipping-label`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get invoice
  async getInvoice(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Update tracking information
  async updateTracking(orderId: string, trackingData: {
    trackingNumber: string;
    carrier: string;
    trackingUrl?: string;
  }): Promise<BraceletOrder> {
    const response = await apiClient.patch(`${this.baseUrl}/${orderId}/tracking`, trackingData);
    return response.data;
  }

  // Get shipment tracking
  async getShipmentTracking(orderId: string): Promise<{
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    status: string;
    events: Array<{
      timestamp: Date;
      location: string;
      status: string;
      description: string;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}/tracking`);
    return response.data;
  }

  // Bulk update order status
  async bulkUpdateStatus(orderIds: string[], status: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ orderId: string; error: string }>;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-update-status`, {
      orderIds,
      status,
    });
    return response.data;
  }
}

export const braceletOrderService = new BraceletOrderService();