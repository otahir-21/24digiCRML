export enum UserType {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  ADMIN = 'admin',
  STAFF_MANAGER = 'staff_manager',
  STAFF_EDITOR = 'staff_editor',
  STAFF_VIEWER = 'staff_viewer',
}

export interface User {
  profileId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userType: UserType;
  permissions?: string[];
}

export interface AuthResponse {
  status: string;
  message: string;
  profileId: string;
  isOtpVerified: boolean;
  token?: string;
}

export interface OtpResponse {
  status: string;
  message: string;
  otpExpiry: string;
  retryAfter?: number;
}