export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

export const DEFAULT_COLLECTIONS = [
  'users',
  'contacts',
  'leads',
  'customers',
  'orders',
  'products',
];

// 24diet module collections (from MongoDB migration)
export const DIET_COLLECTIONS = [
  '24diet_products',
  '24diet_productaddons',
  '24diet_productcategories',
];

export const DIET_TABS = [
  { id: 'products', label: 'Product Catalog', collection: '24diet_products' },
];

export const ALL_PRODUCTS_VIEW = '__24diet_all__';

/** Only this module shows "All Products" and product catalog in the sidebar (others go under CRM sections). */
export const PRODUCTS_MODULE_NAME = '24diet';

// 24DIGI Firestore Setup — 6 modules, 18 collections (see Firestore Setup Instructions)
export const FIRESTORE_MODULES = [
  {
    id: 'challenge',
    label: 'Challenge',
    collections: [
      'challenges',
      'challenge_participants',
      'challenge_rooms',
      'room_requests',
      'challenge_leaderboard',
      'challenge_activities',
    ],
  },
  {
    id: 'shop',
    label: 'Shop',
    collections: [
      'shop_categories',
      'shop_products',
      'shop_cart',
      'shop_wishlist',
      'shop_orders',
      'product_reviews',
    ],
  },
  {
    id: 'user',
    label: 'User & Profile',
    collections: ['users', 'user_addresses'],
  },
  {
    id: 'ai',
    label: 'AI & Meal Plan',
    collections: ['ai_meal_plans', 'ai_delivery_schedule'],
  },
  {
    id: 'payments',
    label: 'Payments',
    collections: ['payments'],
  },
  {
    id: 'delivery',
    label: 'Delivery Partners',
    collections: ['delivery_partners'],
  },
];

// Legacy/other collections not in the 6 modules (contacts, leads, etc.)
export const OTHER_LEGACY_COLLECTIONS = [
  'contacts',
  'leads',
  'customers',
  'orders',
  'products',
];

// All collection IDs we may try to load (for discovery)
export const ALL_FIRESTORE_COLLECTION_IDS = [
  ...DEFAULT_COLLECTIONS,
  ...DIET_COLLECTIONS,
  ...FIRESTORE_MODULES.flatMap((m) => m.collections),
  ...OTHER_LEGACY_COLLECTIONS,
].filter((id, i, arr) => arr.indexOf(id) === i);
