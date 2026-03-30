import apiClient from '../api-client';

export interface TrackingEvent {
  eventId: string;
  status: string;
  description: string;
  timestamp: Date;
  location?: string;
  facilityName?: string;
  facilityCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  signedBy?: string;
  notes?: string;
  isException?: boolean;
  exceptionReason?: string;
}

export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: string;
}

export interface ShipmentAddress {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  isResidential?: boolean;
  deliveryInstructions?: string;
}

export interface CarrierInfo {
  carrierId: string;
  name: string;
  serviceType: string;
  serviceName: string;
  estimatedDays: number;
  guaranteedDelivery?: boolean;
  weekendDelivery?: boolean;
  signatureRequired?: boolean;
  insuranceIncluded?: boolean;
  trackingIncluded?: boolean;
}

export interface BraceletShipment {
  _id?: string;
  shipmentId: string;
  orderId: string;
  customerId: string;

  // Shipment Details
  trackingNumber?: string;
  carrierTrackingUrl?: string;

  // Carrier Information
  carrier: CarrierInfo;

  // Addresses
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;

  // Package Information
  packageDimensions: PackageDimensions;
  declaredValue?: number;

  // Shipping Options
  requiresSignature: boolean;
  requiresAdultSignature: boolean;
  isInsured: boolean;
  insuranceValue?: number;

  // Status and Timing
  status: 'created' | 'label_created' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';
  shippedDate?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Costs
  baseCost: number;
  additionalFees?: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  totalCost: number;
  currency: string;

  // Tracking
  trackingEvents?: TrackingEvent[];
  lastTracked?: Date;
  currentLocation?: string;

  // Label Information
  labelUrl?: string;
  labelFormat?: string;

  // Pickup Information
  pickupScheduled?: boolean;
  pickupDate?: Date;
  pickupTimeWindow?: string;
  pickupInstructions?: string;
  pickupConfirmationNumber?: string;

  // Quality Metrics
  onTimeDelivery?: boolean;
  deliveryDelayDays?: number;
  customerSatisfaction?: number;

  // Internal Tracking
  internalNotes?: string;
  returnReason?: string;
  refundIssued?: boolean;
  refundAmount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  orderId: string;
  customerId: string;
  carrierId: string;
  serviceType: string;
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  packageDimensions: PackageDimensions;
  declaredValue?: number;
  requiresSignature?: boolean;
  requiresAdultSignature?: boolean;
  isInsured?: boolean;
  insuranceValue?: number;
  pickupDate?: string;
  specialInstructions?: string;
}

export interface UpdateTrackingDto {
  trackingNumber?: string;
  status?: string;
  events?: TrackingEvent[];
  currentLocation?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryNotes?: string;
}

export interface ShipmentCostCalculationDto {
  fromAddress: {
    postalCode: string;
    country: string;
    state?: string;
  };
  toAddress: {
    postalCode: string;
    country: string;
    state?: string;
  };
  packageDimensions: PackageDimensions;
  declaredValue?: number;
  serviceTypes?: string[];
}

export interface ShipmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  carrier?: string;
  orderId?: string;
  trackingNumber?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeliveryPerformanceReport {
  summary: {
    totalShipments: number;
    deliveredShipments: number;
    pendingShipments: number;
    exceptionShipments: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
    totalShippingCost: number;
  };
  carrierPerformance: Array<{
    carrier: string;
    totalShipments: number;
    onTimeRate: number;
    averageDeliveryTime: number;
    exceptionRate: number;
    averageCost: number;
  }>;
  trends: {
    daily: Array<{
      date: string;
      shipments: number;
      delivered: number;
      onTimeRate: number;
    }>;
    monthly: Array<{
      month: string;
      shipments: number;
      delivered: number;
      onTimeRate: number;
    }>;
  };
}

export interface AvailableCarrier {
  carrierId: string;
  name: string;
  logo?: string;
  services: Array<{
    serviceId: string;
    name: string;
    description: string;
    estimatedDays: number;
    features: string[];
    baseRate?: number;
  }>;
  trackingSupported: boolean;
  pickupSupported: boolean;
  internationalSupported: boolean;
  maxWeight: number;
  maxDimensions: PackageDimensions;
}

class BraceletShipmentService {
  private baseUrl = '/v1/bracelet-shipments';

  // Get all shipments with filters
  async getShipments(filters?: ShipmentFilters): Promise<{
    shipments: BraceletShipment[];
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

  // Get single shipment by ID
  async getShipment(shipmentId: string): Promise<BraceletShipment> {
    const response = await apiClient.get(`${this.baseUrl}/${shipmentId}`);
    return response.data;
  }

  // Create new shipment
  async createShipment(shipmentData: CreateShipmentDto): Promise<BraceletShipment> {
    const response = await apiClient.post(this.baseUrl, shipmentData);
    return response.data;
  }

  // Generate shipping label
  async generateShippingLabel(shipmentId: string, carrierOptions?: Record<string, unknown>): Promise<{
    labelUrl: string;
    trackingNumber: string;
    estimatedDelivery: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/generate-label`, {
      shipmentId,
      carrierOptions,
    });
    return response.data;
  }

  // Calculate shipping cost
  async calculateShippingCost(costData: ShipmentCostCalculationDto): Promise<Array<{
    carrier: string;
    service: string;
    cost: number;
    estimatedDays: number;
    features: string[];
  }>> {
    const response = await apiClient.post(`${this.baseUrl}/calculate-cost`, costData);
    return response.data;
  }

  // Track shipment by tracking number
  async trackShipment(trackingNumber: string): Promise<{
    shipment: BraceletShipment;
    events: TrackingEvent[];
    estimatedDelivery: string;
    currentStatus: string;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/tracking/${trackingNumber}`);
    return response.data;
  }

  // Get shipments for specific order
  async getShipmentsByOrder(orderId: string): Promise<BraceletShipment[]> {
    const response = await apiClient.get(`${this.baseUrl}/order/${orderId}`);
    return response.data;
  }

  // Update tracking information
  async updateTracking(shipmentId: string, trackingData: UpdateTrackingDto): Promise<BraceletShipment> {
    const response = await apiClient.put(`${this.baseUrl}/${shipmentId}/tracking`, trackingData);
    return response.data;
  }

  // Update shipment status
  async updateShipmentStatus(shipmentId: string, status: string, notes?: string): Promise<BraceletShipment> {
    const response = await apiClient.put(`${this.baseUrl}/${shipmentId}/status`, { status, notes });
    return response.data;
  }

  // Schedule carrier pickup
  async schedulePickup(shipmentId: string, pickupDetails: {
    pickupDate: string;
    timeWindow?: string;
    specialInstructions?: string;
  }): Promise<{
    confirmationNumber: string;
    pickupDate: string;
    timeWindow: string;
  }> {
    const response = await apiClient.put(`${this.baseUrl}/${shipmentId}/schedule-pickup`, pickupDetails);
    return response.data;
  }

  // Refresh tracking data from carrier
  async refreshTrackingData(shipmentId: string): Promise<{
    updated: boolean;
    newEvents: number;
    currentStatus: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/${shipmentId}/refresh-tracking`);
    return response.data;
  }

  // Bulk update tracking for multiple shipments
  async bulkUpdateTracking(shipmentIds: string[], forceRefresh?: boolean): Promise<{
    updated: number;
    failed: number;
    errors: Array<{ shipmentId: string; error: string }>;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-update-tracking`, {
      shipmentIds,
      forceRefresh,
    });
    return response.data;
  }

  // Get delivery performance report
  async getDeliveryPerformanceReport(filters?: {
    startDate?: string;
    endDate?: string;
    carrier?: string;
  }): Promise<DeliveryPerformanceReport> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.carrier) params.append('carrier', filters.carrier);

    const response = await apiClient.get(`${this.baseUrl}/performance-report?${params.toString()}`);
    return response.data;
  }

  // Get available carriers
  async getAvailableCarriers(): Promise<AvailableCarrier[]> {
    const response = await apiClient.get(`${this.baseUrl}/carriers`);
    return response.data;
  }

  // Get shipping cost analytics
  async getShippingCostAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<{
    totalCost: number;
    averageCost: number;
    costByCarrier: Array<{
      carrier: string;
      totalCost: number;
      shipments: number;
      averageCost: number;
    }>;
    trends: Array<{
      period: string;
      cost: number;
      shipments: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const response = await apiClient.get(`${this.baseUrl}/analytics/shipping-costs?${params.toString()}`);
    return response.data;
  }
}

export const braceletShipmentService = new BraceletShipmentService();