import apiClient from '../api-client';

export enum DataType {
  HEART_RATE = 'heart-rate',
  STEPS = 'steps',
  BLOOD_PRESSURE = 'blood-pressure',
  BLOOD_OXYGEN = 'blood-oxygen',
}

export enum ViewMode {
  RAW = 'raw',
  AGGREGATED = 'aggregated',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface AdminReadsQuery {
  dataType: DataType;
  profileId?: string;
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  viewMode?: ViewMode;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Stats {
  min?: number;
  max?: number;
  avg?: number;
  count: number;
  totalSteps?: number;
  totalDistance?: number;
  totalCalories?: number;
  avgSystolic?: number;
  avgDiastolic?: number;
  minSystolic?: number;
  maxSystolic?: number;
  minDiastolic?: number;
  maxDiastolic?: number;
}

export interface AdminReadsResponse<T> {
  data: T[];
  pagination: Pagination;
  stats: Stats;
}

// Heart Rate interfaces
export interface HeartRateRecord {
  _id: string;
  profileId: string;
  deviceId: string;
  timestamp: string;
  value: number;
  type: 'resting' | 'active' | 'exercise' | 'recovery' | 'sleep';
  zone?: number;
  metadata?: {
    quality?: number;
    sensorStatus?: string;
    activity?: string;
    temperature?: number;
    hrvMs?: number;
    source?: string;
  };
}

export interface HeartRateAggregated {
  _id: {
    date: string;
    profileId: string;
    deviceId: string;
  };
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  count: number;
  restingCount: number;
  activeCount: number;
  exerciseCount: number;
}

// Steps interfaces
export interface StepsRecord {
  _id: string;
  profileId: string;
  deviceId: string;
  timestamp: string;
  steps: number;
  distance: number;
  calories: number;
  minuteOfDay: number;
  cadence?: number;
  speed?: number;
  elevation?: number;
  activityType: 'walking' | 'running' | 'cycling' | 'idle' | 'unknown';
  metadata?: {
    intensity?: string;
    terrain?: string;
    indoor?: boolean;
    temperature?: number;
    humidity?: number;
    source?: string;
    accuracy?: number;
  };
}

export interface StepsAggregated {
  _id: {
    date: string;
    profileId: string;
    deviceId: string;
  };
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  avgCadence: number;
  count: number;
  walkingMinutes: number;
  runningMinutes: number;
}

// Blood Pressure interfaces
export interface BloodPressureRecord {
  _id: string;
  profileId: string;
  deviceId: string;
  timestamp: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  measurementContext?: {
    position?: string;
    armUsed?: string;
    notes?: string;
  };
}

export interface BloodPressureAggregated {
  _id: {
    date: string;
    profileId: string;
    deviceId: string;
  };
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  count: number;
  normalCount: number;
  elevatedCount: number;
  stage1Count: number;
  stage2Count: number;
  crisisCount: number;
}

// Blood Oxygen interfaces
export interface BloodOxygenRecord {
  _id: string;
  profileId: string;
  deviceId: string;
  timestamp: string;
  spo2: number;
  heartRate?: number;
  respiratoryRate?: number;
  perfusionIndex?: number;
  level: 'normal' | 'low' | 'critical' | 'high';
  measurementContext?: {
    activity?: string;
    altitude?: number;
    notes?: string;
  };
}

export interface BloodOxygenAggregated {
  _id: {
    date: string;
    profileId: string;
    deviceId: string;
  };
  avgSpo2: number;
  minSpo2: number;
  maxSpo2: number;
  avgHeartRate: number;
  avgRespiratoryRate: number;
  avgPerfusionIndex: number;
  count: number;
  normalCount: number;
  lowCount: number;
  criticalCount: number;
}

// API functions
export const bracelaReadsAPI = {
  /**
   * Fetch admin reads data
   */
  async getReads<T>(query: AdminReadsQuery): Promise<AdminReadsResponse<T>> {
    const params = new URLSearchParams();

    params.append('dataType', query.dataType);
    if (query.profileId) params.append('profileId', query.profileId);
    if (query.deviceId) params.append('deviceId', query.deviceId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.viewMode) params.append('viewMode', query.viewMode);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    const response = await apiClient.get(`/v1/bracela/admin/reads?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch heart rate reads
   */
  async getHeartRateReads(query: Omit<AdminReadsQuery, 'dataType'>): Promise<AdminReadsResponse<HeartRateRecord | HeartRateAggregated>> {
    return this.getReads({ ...query, dataType: DataType.HEART_RATE });
  },

  /**
   * Fetch steps reads
   */
  async getStepsReads(query: Omit<AdminReadsQuery, 'dataType'>): Promise<AdminReadsResponse<StepsRecord | StepsAggregated>> {
    return this.getReads({ ...query, dataType: DataType.STEPS });
  },

  /**
   * Fetch blood pressure reads
   */
  async getBloodPressureReads(query: Omit<AdminReadsQuery, 'dataType'>): Promise<AdminReadsResponse<BloodPressureRecord | BloodPressureAggregated>> {
    return this.getReads({ ...query, dataType: DataType.BLOOD_PRESSURE });
  },

  /**
   * Fetch blood oxygen reads
   */
  async getBloodOxygenReads(query: Omit<AdminReadsQuery, 'dataType'>): Promise<AdminReadsResponse<BloodOxygenRecord | BloodOxygenAggregated>> {
    return this.getReads({ ...query, dataType: DataType.BLOOD_OXYGEN });
  },
};

export default bracelaReadsAPI;
