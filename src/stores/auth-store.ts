import { create } from 'zustand';
import { User, UserType } from '@/types/auth';
import { authService } from '@/lib/api-client';
import Cookies from 'js-cookie';

interface DecodedJWT {
  profileId?: string;
  userType?: UserType;
  exp?: number;
  iat?: number;
}

// Helper function to decode JWT token
const decodeJWT = (token: string): DecodedJWT | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserType[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      const jwtToken = Cookies.get('digi_jwt_token');
      if (!jwtToken) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      const userData = await authService.getCurrentUser();
      
      // If userType is missing from the response, extract it from JWT token
      let userType = userData.userType;
      if (!userType) {
        const decodedToken = decodeJWT(jwtToken);
        userType = decodedToken?.userType || UserType.CUSTOMER;
      }
      
      const user = {
        ...userData,
        userType: userType as UserType
      };
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  hasRole: (roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.userType);
  },
  
  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    
    // Admin has all permissions
    if (user.userType === UserType.ADMIN) return true;
    
    // Check specific permissions for staff
    return user.permissions?.includes(permission) || false;
  },
}));