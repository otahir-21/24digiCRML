export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

/** Employee portal URL: use a URL-safe slug (e.g. osama-tahir). */
export function employeePortalPath(slug) {
  const s = String(slug || '').trim();
  if (!s) return '/employee';
  return `/employee/${encodeURIComponent(s)}`;
}

/**
 * Only allow internal post-login redirects (prevents open redirects via ?next=).
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function sanitizeLoginNext(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  const noHash = raw.split('#')[0];
  const [pathPart, queryPart] = noHash.split('?');
  if (!pathPart.startsWith('/') || pathPart.startsWith('//') || pathPart.includes('://')) {
    return '';
  }
  if (pathPart.startsWith('/employee/')) {
    const slug = pathPart.slice('/employee/'.length);
    if (!slug || slug.includes('/') || slug === '.' || slug === '..') return '';
    return queryPart ? `${pathPart}?${queryPart}` : pathPart;
  }
  if (pathPart === ROUTES.DASHBOARD) {
    return queryPart ? `${pathPart}?${queryPart}` : pathPart;
  }
  return '';
}

/**
 * @param {string} path from sanitizeLoginNext
 * @returns {string | null} decoded slug
 */
export function parseEmployeeSlugFromLoginNext(path) {
  const safe = sanitizeLoginNext(path);
  if (!safe.startsWith('/employee/')) return null;
  const pathOnly = safe.split('?')[0];
  const enc = pathOnly.slice('/employee/'.length);
  if (!enc) return null;
  try {
    return decodeURIComponent(enc);
  } catch {
    return enc;
  }
}

/** Firestore: staff / employees created from admin CRM (document id = Auth uid). */
export const CRM_EMPLOYEES_COLLECTION = 'crm_employees';

/**
 * Staff admins (`role: staff_admin`) use `crmAllowedModules`: `['*']` = entire CRM, or a list of keys below.
 * Missing / null field = full access (legacy). Employees (`role: employee`) use the portal only; this field is cleared.
 */
export const CRM_ACCESS_MODULE_ALL = '*';

export const CRM_ACCESS_MODULES = [
  { key: 'dashboard', label: 'Dashboard overview' },
  { key: 'users', label: 'Users' },
  { key: 'staff_employees', label: 'Staff / employees' },
  { key: 'attendance_admin', label: 'Attendance (admin)' },
  { key: 'diet', label: 'Food categories' },
  { key: 'products', label: 'Products' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'challenge', label: 'Challenges & competitions' },
  { key: 'game_features', label: 'Game features' },
  { key: 'cby_ai_delivery', label: 'AI meal deliveries' },
  { key: 'meal-components', label: 'Meal component templates' },
  { key: 'orders', label: 'Orders' },
  { key: 'subscription-packages', label: 'Subscription packages' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'meal-preparations', label: 'Meal preparations' },
  { key: 'health-reads', label: 'Health reads' },
  { key: 'bracelet-products', label: 'Bracelet products' },
  { key: 'activity_ai', label: 'AI activity assistant' },
];

const CRM_MODULE_KEY_SET = new Set(CRM_ACCESS_MODULES.map((m) => m.key));

/**
 * @param {unknown} modules Firestore crmAllowedModules
 * @returns {boolean}
 */
export function crmStaffHasFullAccess(modules) {
  if (modules == null) return true;
  if (!Array.isArray(modules)) return true;
  if (modules.includes(CRM_ACCESS_MODULE_ALL)) return true;
  return false;
}

/**
 * @param {string[]} keys
 * @param {boolean} fullAccess
 * @returns {string[]|null} null means omit field (full legacy)
 */
export function buildCrmAllowedModulesForSave(keys, fullAccess) {
  if (fullAccess) return [CRM_ACCESS_MODULE_ALL];
  const merged = [...new Set(['dashboard', ...(keys || []).filter((k) => CRM_MODULE_KEY_SET.has(k))])];
  return merged;
}

/** Daily attendance (one check-in / check-out per employee per Dubai calendar day). */
export const CRM_ATTENDANCE_COLLECTION = 'crm_attendance';

/** Manual / suggested activity picks for pattern-based “AI” assistant (Vite CRM). */
export const CRM_ACTIVITY_SELECTION_LOG_COLLECTION = 'crm_activity_selections';

/** Shared CRM settings: doc ids under this collection (e.g. attendance rules). */
export const CRM_SETTINGS_COLLECTION = 'crm_settings';

export const CRM_ATTENDANCE_SETTINGS_DOC_ID = 'attendance';

/** All attendance dates and “office open” times use this IANA zone (UAE). */
export const ATTENDANCE_TIMEZONE_LABEL = 'Asia/Dubai';

/**
 * @param {string} uid
 * @param {string} dateKey YYYY-MM-DD (Dubai calendar day)
 */
export function attendanceDocId(uid, dateKey) {
  return `${uid}_${dateKey}`;
}

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

/** View that shows all challenges from challenges/competition/compitition collection. */
export const ALL_CHALLENGES_VIEW = '__24challenge_all__';

/** Collection IDs to check for the 24 Challenge list (first existing one is used). */
export const CHALLENGE_COLLECTION_IDS = ['challenges', 'competition', 'compitition'];

/** 24 Competition module collections */
export const COMPETITION_COLLECTIONS = [
  'competitions',
  'competition_notifications',
  'running_competation_24_competition',
];

/** Only this module shows "All Products" and product catalog in the sidebar (others go under CRM sections). */
export const PRODUCTS_MODULE_NAME = '24diet';

// 24DIGI Firestore Setup — 6 modules, 18 collections (see Firestore Setup Instructions)
export const FIRESTORE_MODULES = [
  {
    id: 'challenge',
    label: 'Challenge',
    collections: [
      'challenges',
      'competition',
      'compitition', // common typo – show in CRM if present in Firebase
      'challenge_participants',
      'challenge_rooms',
      'room_requests',
      'challenge_leaderboard',
      'challenge_activities',
    ],
  },
  {
    id: 'activity_ai',
    label: 'AI activity',
    collections: ['crm_activity_selections'],
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
  ...COMPETITION_COLLECTIONS,
  ...FIRESTORE_MODULES.flatMap((m) => m.collections),
  ...OTHER_LEGACY_COLLECTIONS,
].filter((id, i, arr) => arr.indexOf(id) === i);
