import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Type definitions
export interface CustomerFilters {
  search?: string;
  status?: string;
  userType?: string;
  [key: string]: unknown;
}

interface PaginationFilters {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

interface CByAIPackageData {
  // Bilingual fields
  name_en: string;
  name_ar: string;
  displayName_en: string;
  displayName_ar: string;
  description_en?: string;
  description_ar?: string;
  highlightFeatures_en: string[];
  highlightFeatures_ar: string[];

  // Legacy fields (for backward compatibility)
  name?: string;
  displayName?: string;
  highlightFeatures?: string[];

  // Non-language-specific fields
  duration: number;
  price: number;
  currency: string;
  discountPercentage: number;
  features: Record<string, unknown>;
  isActive: boolean;
  isTrial: boolean;
  trialDays: number;
  sortOrder: number;
  [key: string]: unknown;
}

interface CByAISubscriptionData {
  profileId: string;
  packageId: string;
  status: string;
  [key: string]: unknown;
}

interface GameFeatureData {
  featureId: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  isActive?: boolean;
  isAdminOnly?: boolean;
  displayOrder?: number;
  metadata?: Record<string, unknown>;
  requirements?: string[];
}

// Use relative URL so browser requests go through Next.js rewrites (proxy).
// This avoids Mixed Content errors when the app is on HTTPS but the backend
// is HTTP. The rewrite in next.config.ts forwards /v1/... → backendUrl/v1/...
const API_URL = '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_CLIENT_SECRET;

// Cookie names
const ACCESS_TOKEN_COOKIE = 'digi_access_token';
const JWT_TOKEN_COOKIE = 'digi_jwt_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get access token
export const getAccessToken = async (): Promise<string> => {
  let accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
  
  if (!accessToken) {
    try {
      // Generate new access token
      const response = await axios.post(`${API_URL}/v1/auth/token`, {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });
      
      accessToken = response.data.accessToken;
      const expiresAt = new Date(response.data.expiresAt);
      
      // Store in cookie
      Cookies.set(ACCESS_TOKEN_COOKIE, accessToken!, {
        expires: expiresAt,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error('Failed to get access token:', err.response?.data || err.message);
      throw new Error('Failed to authenticate with API. Please check your credentials.');
    }
  }
  
  return accessToken!;
};

// Request interceptor to add both tokens
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Get JWT token
    const jwtToken = Cookies.get(JWT_TOKEN_COOKIE);
    if (jwtToken) {
      config.headers['X-JWT-Token'] = jwtToken;
    }

    // Debug logging for analytics requests
    if (config.url?.includes('/dashboard/statistics')) {
      console.log('🔍 Analytics API Request Debug:', {
        url: config.url,
        method: config.method,
        hasAccessToken: !!accessToken,
        hasJwtToken: !!jwtToken,
        headers: {
          Authorization: config.headers.Authorization,
          'X-JWT-Token': jwtToken ? `${jwtToken.substring(0, 20)}...` : undefined
        }
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging for analytics responses
    if (response.config.url?.includes('/dashboard/statistics')) {
      console.log('✅ Analytics API Response Debug:', {
        url: response.config.url,
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        dataPreview: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Debug logging for analytics errors
    if (originalRequest?.url?.includes('/dashboard/statistics')) {
      console.error('❌ Analytics API Error Debug:', {
        url: originalRequest.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        response: error.response?.data
      });
    }

    // Skip retry for verify-otp endpoint to prevent duplicate OTP verification
    const isVerifyOtpEndpoint = originalRequest.url?.includes('/verify-otp');

    // If access token expired, get new one and retry (but not for verify-otp)
    if (error.response?.status === 401 && !originalRequest._retry && !isVerifyOtpEndpoint) {
      originalRequest._retry = true;

      // Clear expired access token
      Cookies.remove(ACCESS_TOKEN_COOKIE);

      // Get new access token
      const accessToken = await getAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    }

    // If JWT token expired or invalid, redirect to login
    if (error.response?.status === 401 && error.response?.data?.message?.includes('JWT')) {
      Cookies.remove(JWT_TOKEN_COOKIE);
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  // Send OTP for phone login (legacy method)
  sendOtp: async (phoneNumber: string) => {
    const response = await apiClient.post('/v1/auth/send-otp', { phoneNumber });
    return response.data;
  },
  
  // Request OTP for login
  requestOtp: async (email?: string, mobile?: string) => {
    const data: Record<string, string> = {};
    if (email) data.email = email;
    if (mobile) data.mobile = mobile;
    
    const response = await apiClient.post('/v1/auth/request-otp', data);
    return response.data;
  },
  
  // Verify OTP
  verifyOtp: async (otp: number, email?: string, mobile?: string) => {
    const data: Record<string, string | number> = {
      otp,
      typeOfRequest: 'login'
    };
    if (email) data.email = email;
    if (mobile) data.mobile = mobile;
    
    const response = await apiClient.post('/v1/auth/verify-otp', data);
    
    // Store JWT token if returned
    if (response.data.token) {
      Cookies.set(JWT_TOKEN_COOKIE, response.data.token, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
    
    return response.data;
  },

  // Store JWT token (exported for use in auth flow)
  storeJwtToken: (token: string) => {
    Cookies.set(JWT_TOKEN_COOKIE, token, {
      expires: 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  },
  
  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/v1/profile/me');
    return response.data;
  },
  
  // Logout
  logout: () => {
    Cookies.remove(JWT_TOKEN_COOKIE);
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    window.location.href = '/login';
  },

  // Admin OTP login - Request OTP
  requestAdminOtp: async (email: string) => {
    const response = await axios.post('/api/admin/request-otp', { email });
    return response.data;
  },

  // Admin OTP login - Verify OTP
  verifyAdminOtp: async (email: string, otp: number) => {
    const response = await axios.post('/api/admin/verify-otp', { email, otp });

    // Store JWT token if returned
    if (response.data.token) {
      Cookies.set(JWT_TOKEN_COOKIE, response.data.token, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }

    return response.data;
  },
};

// Profile service functions
export const profileService = {
  // Get current profile
  getCurrentProfile: async () => {
    const response = await apiClient.get('/v1/profile/me');
    return response.data;
  },
  
  // Update profile
  updateProfile: async (profileId: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/profile/${profileId}`, data);
    return response.data;
  },

  // Create profile (used during registration)
  createProfile: async (data: { phoneNumber: string; name?: string; email?: string }) => {
    const response = await apiClient.post('/v1/profile/create', data);
    return response.data;
  },
};

// Product Category service functions
export const productCategoryService = {
  // Create product category
  create: async (data: {
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    image?: string;
    active?: boolean;
  }) => {
    const response = await apiClient.post('/v1/dashboard/product-categories', data);
    return response.data;
  },
  
  // Get all product categories
  findAll: async (lang?: string) => {
    const response = await apiClient.get('/v1/dashboard/product-categories', {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Get product category by ID
  findOne: async (id: string, lang?: string) => {
    const response = await apiClient.get(`/v1/product-category/${id}`, {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Update product category
  update: async (
    id: string,
    data: {
      name_en?: string;
      name_ar?: string;
      description_en?: string;
      description_ar?: string;
      image?: string;
      active?: boolean;
    }
  ) => {
    const response = await apiClient.put(`/v1/dashboard/product-categories/${id}`, data);
    return response.data;
  },
  
  // Delete product category
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/product-categories/${id}`);
    return response.data;
  },
};

// Food Category service functions
export const foodCategoryService = {
  // Create food category
  create: async (data: {
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    image?: string;
    active?: boolean;
  }) => {
    const response = await apiClient.post('/v1/dashboard/food-categories', data);
    return response.data;
  },
  
  // Get all food categories
  findAll: async (lang?: string) => {
    const response = await apiClient.get('/v1/dashboard/food-categories', {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Get food category by ID
  findOne: async (id: string, lang?: string) => {
    const response = await apiClient.get(`/v1/food-category/${id}`, {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Update food category
  update: async (
    id: string,
    data: {
      name_en?: string;
      name_ar?: string;
      description_en?: string;
      description_ar?: string;
      image?: string;
      active?: boolean;
    }
  ) => {
    const response = await apiClient.put(`/v1/dashboard/food-categories/${id}`, data);
    return response.data;
  },
  
  // Delete food category
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/food-categories/${id}`);
    return response.data;
  },
};

// Meal Component Template service functions
export const mealComponentTemplateService = {
  // Create meal component template
  create: async (data: {
    name: string;
    description?: string;
    foodCategory?: string;
    defaultConfig: {
      title: string;
      baseWeight: number;
      minWeight: number;
      maxWeight: number;
      step: number;
      basePrice: number;
      stepPrice: number;
      freeWeight?: boolean;
      nutritionPer100g: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
      };
      ingredientType?: string;
      description?: string;
    };
    active?: boolean;
    tags?: string[];
  }) => {
    const response = await apiClient.post('/v1/meal-component-template', data);
    return response.data;
  },

  // Get all templates with optional filters
  findAll: async (foodCategory?: string, active?: boolean) => {
    const params = new URLSearchParams();
    if (foodCategory) params.append('foodCategory', foodCategory);
    if (active !== undefined) params.append('active', active.toString());

    const response = await apiClient.get(`/v1/meal-component-template/list-all?${params.toString()}`);
    return response.data;
  },

  // Get template by ID
  findOne: async (id: string) => {
    const response = await apiClient.get(`/v1/meal-component-template/${id}`);
    return response.data;
  },

  // Get templates by food category
  findByFoodCategory: async (foodCategory: string) => {
    const response = await apiClient.get(`/v1/meal-component-template/by-food-category/${foodCategory}`);
    return response.data;
  },

  // Search templates
  search: async (query: string) => {
    const response = await apiClient.get(`/v1/meal-component-template/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Update template
  update: async (id: string, data: {
    name?: string;
    description?: string;
    foodCategory?: string;
    defaultConfig?: Record<string, unknown>;
    active?: boolean;
    tags?: string[];
  }) => {
    const response = await apiClient.patch(`/v1/meal-component-template/${id}`, data);
    return response.data;
  },

  // Soft delete template
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/meal-component-template/${id}`);
    return response.data;
  },

  // Hard delete template (permanent)
  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/v1/meal-component-template/${id}/hard`);
    return response.data;
  },
};

// Product service functions
export const productService = {
  // Create product
  create: async (data: {
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    name?: string;
    productCategory: string;
    foodCategory?: string;
    price: number;
    available?: boolean;
    hasOptions?: boolean;
    hasIngredients?: boolean;
    active?: boolean;
    sortOrder?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    preparationTime?: number;
    image?: string;
    allergens?: string[];
    nutritionInfo?: Record<string, unknown>;
    addOns?: string[];
    addOnPrices?: Record<string, number>;
    hasCustomizableComponents?: boolean;
    components?: Record<string, unknown>[];
    basePrice?: number;
  }) => {
    const response = await apiClient.post('/v1/dashboard/products', data);
    return response.data;
  },
  
  // Get all products
  findAll: async (lang?: string) => {
    const response = await apiClient.get('/v1/product/list-all', {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Get product by ID
  findOne: async (id: string, lang?: string) => {
    const response = await apiClient.post('/v1/product/find-one', {
      id,
      lang,
    });
    return response.data;
  },
  
  // Update product
  update: async (
    id: string,
    data: {
      name_en?: string;
      name_ar?: string;
      description_en?: string;
      description_ar?: string;
      [key: string]: unknown;
    }
  ) => {
    const response = await apiClient.patch(`/v1/product/${id}`, data);
    return response.data;
  },
  
  // Delete product
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/product/${id}`);
    return response.data;
  },
  
  // Search by product category
  searchByCategory: async (productCategory: string, lang?: string) => {
    const response = await apiClient.post('/v1/product/search-by-category', {
      productCategory,
      lang,
    });
    return response.data;
  },
  
  // Search by food category
  searchByFoodCategory: async (foodCategory: string, lang?: string) => {
    const response = await apiClient.post('/v1/product/search-by-food-category', {
      foodCategory,
      lang,
    });
    return response.data;
  },
  
  // Calculate component price
  calculateComponentPrice: async (productId: string, components: Array<{ id: string; weight: number }>) => {
    const response = await apiClient.post('/v1/product/calculate-component-price', { productId, components });
    return response.data;
  },
  
  // Calculate nutrition
  calculateNutrition: async (productId: string, components: Array<{ id: string; weight: number }>) => {
    const response = await apiClient.post('/v1/product/calculate-nutrition', { productId, components });
    return response.data;
  },
};

// Product Add-on service functions
export const productAddOnService = {
  // Create product add-on
  create: async (data: {
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    name?: string;
    description?: string;
    price: number;
    category: string;
    image?: string;
    available?: boolean;
    maxQuantity?: number;
    minQuantity?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
    active?: boolean;
    sortOrder?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) => {
    const response = await apiClient.post('/v1/dashboard/product-addons', data);
    return response.data;
  },
  
  // Get all product add-ons
  findAll: async (lang?: string) => {
    const response = await apiClient.get('/v1/product-addon', {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Get add-ons by category
  findByCategory: async (category: string, lang?: string) => {
    const response = await apiClient.get(`/v1/product-addon/category/${category}`, {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Get product add-on by ID
  findOne: async (id: string, lang?: string) => {
    const response = await apiClient.get(`/v1/product-addon/${id}`, {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },
  
  // Update product add-on
  update: async (
    id: string,
    data: {
      name_en?: string;
      name_ar?: string;
      description_en?: string;
      description_ar?: string;
      [key: string]: unknown;
    }
  ) => {
    const response = await apiClient.patch(`/v1/product-addon/${id}`, data);
    return response.data;
  },
  
  // Delete product add-on
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/product-addon/${id}`);
    return response.data;
  },
  
  // Calculate price for add-ons
  calculatePrice: async (addOnIds: string[], quantities?: { [key: string]: number }) => {
    const response = await apiClient.post('/v1/product-addon/calculate-price', {
      addOnIds,
      quantities,
    });
    return response.data;
  },
  
  // Toggle availability
  toggleAvailability: async (id: string) => {
    const response = await apiClient.patch(`/v1/product-addon/${id}/toggle-availability`, {});
    return response.data;
  },
};

// Order service functions
export const orderService = {
  // Create order
  create: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/v1/orders/add-order', data);
    return response.data;
  },
  
  // Create order from cart
  createFromCart: async (profileId: string, orderData?: Record<string, unknown>) => {
    const response = await apiClient.post('/v1/orders/from-cart', {
      profileId,
      orderData,
    });
    return response.data;
  },
  
  // Get all orders (dashboard API)
  findAll: async () => {
    const response = await apiClient.get('/v1/dashboard/orders');
    return response.data;
  },
  
  // Get filtered orders
  findFiltered: async (filters: {
    status?: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    startDate?: string;
    endDate?: string;
    profileId?: string;
    limit?: number;
    skip?: number;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/v1/dashboard/orders?${params.toString()}`);
    return response.data;
  },
  
  // Get order by ID (dashboard API)
  findOne: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/orders/${id}`);
    return response.data;
  },
  
  // Update order (dashboard API)
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/dashboard/orders/${id}`, data);
    return response.data;
  },
  
  // Update order status (dashboard API)
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/v1/dashboard/orders/${id}/status`, { status });
    return response.data;
  },
  
  // Update delivery status (dashboard API)
  updateDeliveryStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/v1/dashboard/orders/${id}/delivery-status`, { status });
    return response.data;
  },
  
  // Delete order
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/orders/${id}`);
    return response.data;
  },
  
  // Get order statistics (dashboard API)
  getStatistics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get(`/v1/dashboard/orders/statistics?${params.toString()}`);
    return response.data;
  },
  
  // Get orders by profile (use customer service instead)
  getByProfile: async (profileId: string) => {
    // Use customer service for profile orders in dashboard
    const response = await apiClient.get(`/v1/dashboard/customers/${profileId}/orders`);
    return response.data;
  },
  
  // Export orders to CSV
  exportToCSV: async (filters: {
    status?: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/v1/dashboard/orders/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  // Get orders summary for export
  getOrdersSummary: async (filters: {
    status?: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/v1/dashboard/orders/export/summary?${params.toString()}`);
    return response.data;
  },
};

// Challenge service functions
export const challengeService = {
  // Create challenge
  create: async (data: {
    title: string;
    description: string;
    subtitle?: string;
    type: "inhouse" | "sponsored" | "private";
    category: string;
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    creatorProfileId: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline?: Date;
    maxParticipants?: number;
    tags?: string[];
    images?: string[];
    coverImage?: string;
    rules: {
      title: string;
      description: string;
      requirements?: string[];
      restrictions?: string[];
      allowTeamParticipation?: boolean;
      maxTeamSize?: number;
      requireVerification?: boolean;
    };
    rewards: {
      title: string;
      description: string;
      prizes?: string[];
      prizeAmount?: number;
      currency?: string;
      badges?: string[];
      certificates?: string[];
    };
    sponsorName?: string;
    sponsorLogo?: string;
    sponsorWebsite?: string;
    sponsorshipAmount?: number;
    invitedProfileIds?: string[];
    requireApproval?: boolean;
  }) => {
    const response = await apiClient.post('/v1/dashboard/challenges', data);
    return response.data;
  },
  
  // Get all challenges
  findAll: async (filters?: {
    type?: string;
    category?: string;
    difficulty?: string;
    status?: string;
    isFeatured?: boolean;
    creatorProfileId?: string;
    limit?: number;
    skip?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/v1/dashboard/challenges?${params.toString()}`);
    return response.data;
  },
  
  // Get challenge by ID
  findOne: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/challenges/${id}`);
    return response.data;
  },
  
  // Update challenge
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/dashboard/challenges/${id}`, data);
    return response.data;
  },
  
  // Delete challenge
  remove: async (id: string, creatorProfileId: string) => {
    const response = await apiClient.delete(`/v1/dashboard/challenges/${id}`, {
      data: { creatorProfileId },
    });
    return response.data;
  },
  
  // Get challenge statistics
  getStatistics: async () => {
    const response = await apiClient.get('/v1/dashboard/challenges/statistics');
    return response.data;
  },
  
  // Upload cover image
  uploadCoverImage: async (challengeId: string, file: File, creatorProfileId: string) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    formData.append('creatorProfileId', creatorProfileId);
    
    const response = await apiClient.post(`/v1/dashboard/challenges/${challengeId}/upload-cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Upload challenge images
  uploadImages: async (challengeId: string, files: File[], creatorProfileId: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('creatorProfileId', creatorProfileId);
    
    const response = await apiClient.put(`/v1/challenges/${challengeId}/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Remove challenge image
  removeImage: async (challengeId: string, imageUrl: string, creatorProfileId: string) => {
    const response = await apiClient.delete(`/v1/challenges/${challengeId}/images`, {
      data: { imageUrl, creatorProfileId },
    });
    return response.data;
  },
};

// Competition service functions
export const competitionService = {
  // Create competition
  create: async (data: {
    name: string;
    description: string;
    subtitle?: string;
    creatorId: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline?: Date;
    competitionType: "running" | "cycling" | "swimming" | "walking" | "gym" | "yoga" | "custom";
    customActivityType?: string;
    difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
    mode: "weekly" | "monthly" | "custom";
    pointsDistribution: Array<{
      position: number;
      points: number;
      badge?: string;
    }>;
    rules?: {
      title: string;
      description: string;
      conditions?: string[];
      eligibilityCriteria?: string[];
      disqualificationRules?: string[];
    };
    location: string;
    locationRadius?: number;
    competitionImage?: string;
    maxParticipants?: number;
    entryFee?: number;
    sponsorName?: string;
    sponsorLogo?: string;
    sponsorWebsite?: string;
    sponsorDescription?: string;
  }) => {
    const response = await apiClient.post('/v1/dashboard/competitions', data);
    return response.data;
  },
  
  // Get all competitions
  findAll: async (filters?: {
    status?: string;
    competitionType?: string;
    mode?: string;
    activeOnly?: boolean;
    includePrivate?: boolean;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/v1/dashboard/competitions?${params.toString()}`);
    return response.data;
  },
  
  // Get competition by ID
  findOne: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/competitions/${id}`);
    return response.data;
  },
  
  // Update competition
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/dashboard/competitions/${id}`, data);
    return response.data;
  },
  
  // Delete competition
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/competitions/${id}`);
    return response.data;
  },
  
  // Activate competition
  activate: async (id: string) => {
    const response = await apiClient.put(`/v1/dashboard/competitions/${id}/activate`);
    return response.data;
  },
  
  // Get competition statistics
  getStatistics: async () => {
    const response = await apiClient.get(`/v1/dashboard/competitions/statistics`);
    return response.data;
  },
  
  // Get my competitions
  getMyCompetitions: async () => {
    const response = await apiClient.get('/v1/dashboard/competitions/my-competitions');
    return response.data;
  },
};

// Admin service functions
export const adminService = {
  // Create admin user
  createAdminUser: async (data: {
    email?: string;
    mobile?: string;
    firstName: string;
    lastName: string;
    gender: string;
    userType: string;
    permissions?: string[];
  }) => {
    const response = await apiClient.post('/v1/admin/create-admin', data);
    return response.data;
  },

  // Get all admin users
  getAdminUsers: async (filters?: {
    userType?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const response = await apiClient.get('/v1/admin/users', { params: filters });
    return response.data;
  },

  // Get admin user by ID
  getAdminUserById: async (id: string) => {
    const response = await apiClient.get(`/v1/admin/users/${id}`);
    return response.data;
  },

  // Update admin user
  updateAdminUser: async (userId: string, data: {
    email?: string;
    mobile?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    userType?: string;
    permissions?: string[];
    isActive?: boolean;
  }) => {
    const response = await apiClient.put(`/v1/admin/users/${userId}`, data);
    return response.data;
  },

  // Delete admin user
  deleteAdminUser: async (userId: string) => {
    const response = await apiClient.delete(`/v1/admin/users/${userId}`);
    return response.data;
  },

  // Get admin user statistics
  getAdminUserStatistics: async (userId: string) => {
    const response = await apiClient.get(`/v1/admin/users/${userId}/statistics`);
    return response.data;
  },
};

// Dashboard statistics service
export const dashboardService = {
  // Get overview statistics
  getOverviewStatistics: async () => {
    const response = await apiClient.get('/v1/dashboard/statistics/overview');
    return response.data;
  },
  
  // Get revenue statistics
  getRevenueStatistics: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/v1/dashboard/statistics/revenue?${params.toString()}`);
    return response.data;
  },
  
  // Get user statistics
  getUserStatistics: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/v1/dashboard/statistics/users?${params.toString()}`);
    return response.data;
  },
  
  // Get product statistics
  getProductStatistics: async () => {
    const response = await apiClient.get('/v1/dashboard/statistics/products');
    return response.data;
  },
};

// Room service functions
export const roomService = {
  // Create room
  create: async (data: {
    name: string;
    activity: string;
    description?: string;
    joinPointsRequired?: number;
    maxMembersCount?: number;
    roomPicture?: string;
    creatorId: string;
    isLocked?: boolean;
    startDate?: Date;
    endDate?: Date;
    isVisible?: boolean;
    tags?: string[];
  }) => {
    const response = await apiClient.post('/v1/dashboard/rooms', data);
    return response.data;
  },
  
  // Get all rooms
  findAll: async (filters?: {
    activity?: string;
    isLocked?: boolean;
    includePrivate?: boolean;
    limit?: number;
  }) => {
    const response = await apiClient.get('/v1/dashboard/rooms', { params: filters });
    return response.data;
  },
  
  // Get room by ID
  findOne: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/rooms/${id}`);
    return response.data;
  },
  
  // Update room
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/dashboard/rooms/${id}`, data);
    return response.data;
  },
  
  // Delete room
  remove: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/rooms/${id}`);
    return response.data;
  },
  
  // Get my rooms
  getMyRooms: async () => {
    const response = await apiClient.get('/v1/dashboard/rooms/my-rooms');
    return response.data;
  },
  
  // Get room statistics
  getStatistics: async () => {
    const response = await apiClient.get(`/v1/dashboard/rooms/statistics`);
    return response.data;
  },
  
  // Process join request
  processJoinRequest: async (roomId: string, requestProfileId: string, action: "approve" | "reject") => {
    const response = await apiClient.put(`/v1/dashboard/rooms/${roomId}/join-request/${requestProfileId}`, {
      action,
    });
    return response.data;
  },
  
  // Upload room picture
  uploadPicture: async (file: File) => {
    const formData = new FormData();
    formData.append('roomPicture', file);
    
    const response = await apiClient.post('/v1/dashboard/rooms/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Customer service
export const customerService = {
  getAll: async (filters?: CustomerFilters) => {
    const response = await apiClient.get('/v1/dashboard/customers', { params: filters });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/customers/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/v1/dashboard/customers/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/customers/${id}`);
    return response.data;
  },
  
  getOrders: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/customers/${id}/orders`);
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await apiClient.get('/v1/dashboard/customers/statistics');
    return response.data;
  },
  
  exportToCSV: async (filters?: CustomerFilters) => {
    const response = await apiClient.get('/v1/dashboard/customers/export/csv', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },
};

// C by AI Subscription Service
export const cbyaiService = {
  // Package Management
  getPackages: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/cbyai/packages', { params: filters });
    return response.data;
  },
  
  getPackageById: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/cbyai/packages/${id}`);
    return response.data;
  },
  
  createPackage: async (data: CByAIPackageData) => {
    const response = await apiClient.post('/v1/dashboard/cbyai/packages', data);
    return response.data;
  },
  
  updatePackage: async (id: string, data: Partial<CByAIPackageData>) => {
    const response = await apiClient.put(`/v1/dashboard/cbyai/packages/${id}`, data);
    return response.data;
  },
  
  deletePackage: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/cbyai/packages/${id}`);
    return response.data;
  },
  
  togglePackageStatus: async (id: string) => {
    const response = await apiClient.patch(`/v1/dashboard/cbyai/packages/${id}/toggle-status`);
    return response.data;
  },
  
  // Subscription Management
  getSubscriptions: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/cbyai/subscriptions', { params: filters });
    return response.data;
  },
  
  getSubscriptionById: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/cbyai/subscriptions/${id}`);
    return response.data;
  },
  
  createSubscription: async (data: CByAISubscriptionData) => {
    const response = await apiClient.post('/v1/dashboard/cbyai/subscriptions', data);
    return response.data;
  },
  
  updateSubscriptionStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/v1/dashboard/cbyai/subscriptions/${id}/status`, { status });
    return response.data;
  },
  
  extendSubscription: async (id: string, days: number) => {
    const response = await apiClient.patch(`/v1/dashboard/cbyai/subscriptions/${id}/extend`, { days });
    return response.data;
  },
  
  // Statistics & Analytics
  getStatistics: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/cbyai/statistics', { params: filters });
    return response.data;
  },
  
  getUsageStatistics: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/cbyai/usage-statistics', { params: filters });
    return response.data;
  },
  
  getPopularPackages: async () => {
    const response = await apiClient.get('/v1/dashboard/cbyai/popular-packages');
    return response.data;
  },
  
  exportSubscriptions: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/cbyai/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },
};

// C by AI Subscribers Service (Admin)
export const cbyaiSubscribersService = {
  // Get all subscribers with filters
  getAll: async (filters?: {
    status?: string;
    packageId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/cbyai-subscription/admin/subscribers', { params: filters });
    return response.data;
  },

  // Get subscription statistics
  getStatistics: async () => {
    const response = await apiClient.get('/cbyai-subscription/admin/statistics');
    return response.data;
  },
};

// C by AI Meal Deliveries Service
export const mealDeliveriesService = {
  // Get all meal deliveries with filters
  getAll: async (filters?: {
    status?: string;
    mealDate?: string;
    profileId?: string;
    driverProfileId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/cbyai-meals/deliveries', { params: filters });
    return response.data;
  },

  // Get meal delivery by ID
  getById: async (deliveryId: string) => {
    const response = await apiClient.get(`/cbyai-meals/deliveries/${deliveryId}`);
    return response.data;
  },

  // Get deliveries by customer profile
  getByProfile: async (profileId: string, limit?: number) => {
    const response = await apiClient.get(`/cbyai-meals/deliveries/profile/${profileId}`, {
      params: { limit },
    });
    return response.data;
  },

  // Get delivery statistics
  getStatistics: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/cbyai-meals/deliveries/statistics/overview', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Update delivery status
  updateStatus: async (deliveryId: string, status: string, notes?: string) => {
    const response = await apiClient.patch(`/cbyai-meals/deliveries/${deliveryId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Assign driver to delivery
  assignDriver: async (deliveryId: string, driverProfileId: string, estimatedPickupTime?: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/assign-driver`, {
      driverProfileId,
      estimatedPickupTime,
    });
    return response.data;
  },

  // Mark delivery as preparing
  markAsPreparing: async (deliveryId: string, notes?: string, preparedBy?: string, estimatedPreparationTime?: number) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/preparing`, {
      notes,
      preparedBy,
      estimatedPreparationTime,
    });
    return response.data;
  },

  // Mark delivery as ready
  markAsReady: async (deliveryId: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/ready`, {});
    return response.data;
  },

  // Record meal pickup by driver
  recordPickup: async (deliveryId: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/pickup`, {});
    return response.data;
  },

  // Record successful delivery
  recordDelivery: async (deliveryId: string, deliveryNotes?: string, actualDeliveryTime?: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/deliver`, {
      deliveryNotes,
      actualDeliveryTime,
    });
    return response.data;
  },

  // Cancel delivery
  cancel: async (deliveryId: string, reason: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Rate delivery
  rateDelivery: async (deliveryId: string, rating: number, feedback?: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/rate`, {
      rating,
      feedback,
    });
    return response.data;
  },
};

// C by AI Meal Preparations Service
export const mealPreparationsService = {
  // Get meal preparation queue for a specific date
  getPreparationQueue: async (date: string, mealType?: string) => {
    const response = await apiClient.get('/cbyai-meals/deliveries/preparation/queue', {
      params: { date, mealType },
    });
    return response.data;
  },

  // Mark meal as preparing
  markAsPreparing: async (deliveryId: string, notes?: string, preparedBy?: string, estimatedPreparationTime?: number) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/preparing`, {
      notes,
      preparedBy,
      estimatedPreparationTime,
    });
    return response.data;
  },

  // Mark meal as ready
  markAsReady: async (deliveryId: string) => {
    const response = await apiClient.post(`/cbyai-meals/deliveries/${deliveryId}/ready`, {});
    return response.data;
  },
};

// Game Features Service
export const gameFeatureService = {
  // Get all game features
  getFeatures: async (filters?: PaginationFilters) => {
    const response = await apiClient.get('/v1/dashboard/game-features', { params: filters });
    return response.data;
  },

  // Get game feature by ID
  getFeatureById: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/game-features/${id}`);
    return response.data;
  },

  // Create game feature
  createFeature: async (data: GameFeatureData) => {
    const response = await apiClient.post('/v1/dashboard/game-features', data);
    return response.data;
  },

  // Update game feature
  updateFeature: async (id: string, data: Partial<GameFeatureData>) => {
    const response = await apiClient.put(`/v1/dashboard/game-features/${id}`, data);
    return response.data;
  },

  // Delete game feature
  deleteFeature: async (id: string) => {
    const response = await apiClient.delete(`/v1/dashboard/game-features/${id}`);
    return response.data;
  },

  // Toggle feature status
  toggleFeatureStatus: async (id: string) => {
    const response = await apiClient.put(`/v1/dashboard/game-features/${id}/toggle`);
    return response.data;
  },

  // Get feature analytics
  getFeatureAnalytics: async (id: string) => {
    const response = await apiClient.get(`/v1/dashboard/game-features/${id}/analytics`);
    return response.data;
  },

  // Initialize default features
  initializeDefaults: async () => {
    const response = await apiClient.post('/v1/dashboard/game-features/initialize-defaults');
    return response.data;
  },
};

// Export settings service
export { registrationRewardService, getSystemInfo } from './services/settings.service';

export default apiClient;
