import apiClient from '../api-client';

export interface OverviewStatistics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  orders: {
    total: number;
    pending: number;
    todayRevenue: number;
    monthlyRevenue: number;
  };
  products: {
    total: number;
  };
  activities: {
    challenges: number;
    competitions: number;
    rooms: number;
  };
  timestamp: string;
}

export interface RevenueStatistics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
  revenueByCategory: Array<{
    _id: string;
    revenue: number;
    quantity: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersByDay: Array<{
    _id: string;
    count: number;
  }>;
  usersByType: Array<{
    _id: string;
    count: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsByCategory: Array<{
    _id: string;
    count: number;
  }>;
  topSellingProducts: Array<{
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  ordersByDay: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
  ordersByStatus: Array<{
    _id: string;
    count: number;
  }>;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

class AnalyticsService {
  private baseUrl = '/v1/dashboard';

  constructor() {
    console.log('🔧 Analytics Service initialized with base URL:', this.baseUrl);
    console.log('🌐 API URL from env:', process.env.NEXT_PUBLIC_API_URL);
  }

  async getOverviewStatistics(): Promise<OverviewStatistics> {
    console.log('🔄 Fetching overview statistics...');
    const response = await apiClient.get(`${this.baseUrl}/statistics/overview`);
    console.log('📊 Overview statistics response:', response.data);
    return response.data;
  }

  async getRevenueStatistics(filters?: DateRangeFilter): Promise<RevenueStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    console.log('🔄 Fetching revenue statistics with filters:', filters);
    const response = await apiClient.get(`${this.baseUrl}/statistics/revenue?${params.toString()}`);
    console.log('💰 Revenue statistics response:', response.data);
    return response.data;
  }

  async getUserStatistics(filters?: DateRangeFilter): Promise<UserStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    console.log('🔄 Fetching user statistics with filters:', filters);
    const response = await apiClient.get(`${this.baseUrl}/statistics/users?${params.toString()}`);
    console.log('👥 User statistics response:', response.data);
    return response.data;
  }

  async getProductStatistics(): Promise<ProductStatistics> {
    console.log('🔄 Fetching product statistics...');
    const response = await apiClient.get(`${this.baseUrl}/statistics/products`);
    console.log('📦 Product statistics response:', response.data);
    return response.data;
  }

  async getOrderStatistics(filters?: DateRangeFilter): Promise<OrderStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`${this.baseUrl}/orders/statistics?${params.toString()}`);
    return response.data;
  }

  async getChallengeStatistics() {
    const response = await apiClient.get(`${this.baseUrl}/challenges/statistics`);
    return response.data;
  }

  async getCompetitionStatistics() {
    const response = await apiClient.get(`${this.baseUrl}/competitions/statistics`);
    return response.data;
  }

  async getRoomStatistics() {
    const response = await apiClient.get(`${this.baseUrl}/rooms/statistics`);
    return response.data;
  }

  async getCustomerStatistics() {
    const response = await apiClient.get(`${this.baseUrl}/customers/statistics`);
    return response.data;
  }

  // Export functionality
  async exportRevenueData(filters?: DateRangeFilter): Promise<string> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`${this.baseUrl}/export/revenue?${params.toString()}`);
    return response.data;
  }

  async exportOrdersCSV(filters?: Record<string, unknown>): Promise<Blob> {
    const response = await apiClient.post(`${this.baseUrl}/orders/export/csv`, filters, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportCustomersCSV(filters?: Record<string, unknown>): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/customers/export/csv`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Utility methods for formatting data
  formatChartData(data: Record<string, unknown>[], xKey: string, yKey: string) {
    return data.map(item => ({
      name: item[xKey],
      value: item[yKey],
      ...item
    }));
  }

  calculateTrend(currentValue: number, previousValue: number): {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  } {
    if (previousValue === 0) {
      return { percentage: currentValue > 0 ? 100 : 0, direction: 'neutral' };
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';

    return {
      percentage: Math.abs(percentage),
      direction
    };
  }

  formatCurrency(amount: number, currency = 'AED'): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  generateDateRange(days: number): DateRangeFilter {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
}

export const analyticsService = new AnalyticsService();