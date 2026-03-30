// API Response Types
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

// Challenge Types
export interface Challenge {
  _id: string;
  title: string;
  description: string;
  subtitle?: string;
  type: 'inhouse' | 'sponsored' | 'private';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  creatorProfileId: string;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline?: Date | string;
  maxParticipants?: number;
  participants: Participant[];
  tags?: string[];
  images?: string[];
  coverImage?: string;
  rules: ChallengeRules;
  rewards: ChallengeRewards;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorWebsite?: string;
  sponsorshipAmount?: number;
  invitedProfileIds?: string[];
  requireApproval?: boolean;
  isFeatured?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChallengeRules {
  title: string;
  description: string;
  requirements?: string[];
  restrictions?: string[];
  allowTeamParticipation?: boolean;
  maxTeamSize?: number;
  requireVerification?: boolean;
}

export interface ChallengeRewards {
  title: string;
  description: string;
  prizes?: string[];
  prizeAmount?: number;
  currency?: string;
  badges?: string[];
  certificates?: string[];
}

export interface ChallengeStatistics {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  totalParticipants: number;
  averageParticipants: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}

// Competition Types
export interface Competition {
  _id: string;
  name: string;
  description: string;
  subtitle?: string;
  creatorId: string;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline?: Date | string;
  competitionType: 'running' | 'cycling' | 'swimming' | 'walking' | 'gym' | 'yoga' | 'custom';
  customActivityType?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mode: 'weekly' | 'monthly' | 'custom';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  pointsDistribution: PointDistribution[];
  rules?: CompetitionRules;
  location: string;
  locationRadius?: number;
  competitionImage?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  participants: Participant[];
  activities: Activity[];
  entryFee?: number;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorWebsite?: string;
  sponsorDescription?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PointDistribution {
  position: number;
  points: number;
  badge?: string;
}

export interface CompetitionRules {
  title: string;
  description: string;
  conditions?: string[];
  eligibilityCriteria?: string[];
  disqualificationRules?: string[];
}

export interface Participant {
  _id?: string;
  profileId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  joinedAt: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  score?: number;
  rank?: number;
}

export interface Activity {
  _id?: string;
  type: string;
  name: string;
  duration?: number;
  distance?: number;
  calories?: number;
  points?: number;
  completedAt: Date | string;
}

// Room Types
export interface Room {
  _id: string;
  name: string;
  activity: string;
  description?: string;
  joinPointsRequired?: number;
  maxMembersCount?: number;
  currentMembersCount?: number;
  roomPicture?: string;
  creatorId: string;
  isLocked?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  isVisible?: boolean;
  tags?: string[];
  members: Participant[];
  joinRequests?: Participant[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Order Types
export interface Order {
  _id: string;
  orderNumber: string;
  profileId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  discount?: number;
  tax?: number;
  deliveryFee?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'online' | 'tabby';
  deliveryStatus?: 'pending' | 'assigned' | 'picked' | 'delivered';
  deliveryAddress?: DeliveryAddress;
  deliveryTime?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  addOns?: OrderAddOn[];
  customizations?: Record<string, unknown>;
  subtotal: number;
}

export interface OrderAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  name_en: string;
  name_ar?: string;
  productCategory: string | ProductCategory;
  foodCategory?: string | FoodCategory;
  price: number;
  description?: string;
  description_en?: string;
  description_ar?: string;
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
  nutritionInfo?: NutritionInfo;
  addOns?: string[];
  addOnPrices?: Record<string, number>;
  hasCustomizableComponents?: boolean;
  components?: ProductComponent[];
  basePrice?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductCategory {
  _id: string;
  productCategoryId?: string;
  name: string;
  name_en: string;
  name_ar?: string;
  description?: string;
  description_en?: string;
  description_ar?: string;
  image?: string;
  active?: boolean;
  sortOrder?: number;
  products?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FoodCategory {
  _id: string;
  foodCategoryId?: string;
  name: string;
  name_en: string;
  name_ar?: string;
  description?: string;
  description_en?: string;
  description_ar?: string;
  image?: string;
  active?: boolean;
  sortOrder?: number;
  products?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductAddOn {
  _id: string;
  name: string;
  name_en: string;
  name_ar?: string;
  description?: string;
  description_en?: string;
  description_ar?: string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface ProductComponent {
  id: string;
  name: string;
  category: string;
  weight?: number;
  price?: number;
  nutritionInfo?: NutritionInfo;
}

// Filter Types
export interface ChallengeFilters {
  type?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  isFeatured?: boolean;
  creatorProfileId?: string;
  limit?: number;
  skip?: number;
}

export interface CompetitionFilters {
  status?: string;
  competitionType?: string;
  mode?: string;
  activeOnly?: boolean;
  includePrivate?: boolean;
  limit?: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  startDate?: string;
  endDate?: string;
  profileId?: string;
  limit?: number;
  skip?: number;
}

export interface RoomFilters {
  activity?: string;
  isLocked?: boolean;
  includePrivate?: boolean;
  limit?: number;
}

// Statistics Types
export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  averageOrderValue: number;
}
