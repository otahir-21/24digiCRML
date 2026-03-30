import apiClient from '../api-client';

// Registration Reward Types
export interface RegistrationRewardConfig {
  enabled: boolean;
  pointsAmount: number;
  expiryDays: number;
  description?: string;
  updatedBy?: string;
  lastUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateRegistrationRewardDto {
  enabled?: boolean;
  pointsAmount?: number;
  expiryDays?: number;
  description?: string;
}

// Registration Reward Service
export const registrationRewardService = {
  // Get current configuration
  getConfiguration: async (): Promise<RegistrationRewardConfig> => {
    const response = await apiClient.get('/v1/admin/registration-reward');
    return response.data;
  },

  // Update configuration
  updateConfiguration: async (data: UpdateRegistrationRewardDto): Promise<RegistrationRewardConfig> => {
    const response = await apiClient.put('/v1/admin/registration-reward', data);
    return response.data;
  },
};

// System Information (derived from environment)
export interface SystemInfo {
  environment: string;
  apiUrl: string;
  version: string;
}

export const getSystemInfo = (): SystemInfo => {
  return {
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    version: '1.0.0', // Can be pulled from package.json if needed
  };
};
