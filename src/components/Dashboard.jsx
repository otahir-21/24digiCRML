import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { useCollectionData } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { ROUTES, employeePortalPath } from '../constants';
import { CHALLENGE_COLLECTION_IDS } from '../constants';
import DashboardHeader from './DashboardHeader';
import DataTable from './DataTable';
import AddDocumentModal from './AddDocumentModal';
import FirestoreSetupHelp from './FirestoreSetupHelp';
import ChallengeSection from './ChallengeSection';
import UsersAdminPanel from './UsersAdminPanel';
import FoodCategoriesPanel from './FoodCategoriesPanel';
import ProductsPanel from './ProductsPanel';
import AddonsPanel from './AddonsPanel';
import GameFeaturesPanel from './GameFeaturesPanel';
import CByAiDeliveryPanel from './CByAiDeliveryPanel';
import EmployeePortalPanel from './EmployeePortalPanel';
import EmployeeAttendancePanel from './EmployeeAttendancePanel';
import AttendanceAdminPanel from './AttendanceAdminPanel';
import StaffEmployeesPanel from './StaffEmployeesPanel';
import ActivityAiAssistantPanel from './ActivityAiAssistantPanel';
import { useCrmStaffAccess } from '../hooks/useCrmStaffAccess';
import './Dashboard.css';

// ─── Navigation sections ───────────────────────────────────────────────────
const SECTION = {
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  DIET: 'diet',
  PRODUCTS: 'products',
  ADDONS: 'addons',
  GAME_FEATURES: 'game_features',
  CHALLENGE: 'challenge',
  CBY_AI_DELIVERY: 'cby_ai_delivery',
  STAFF_EMPLOYEES: 'staff_employees',
  EMPLOYEE_ATTENDANCE: 'employee_attendance',
  ATTENDANCE_ADMIN: 'attendance_admin',
  ACTIVITY_AI: 'activity_ai',
};

// 24Diet inner screens
const DIET_SCREENS = [
  {
    id: '24diet_products',
    label: 'Product Catalog',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    id: '24diet_productaddons',
    label: 'Add-ons',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: '24diet_productcategories',
    label: 'Categories',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

// ─── Sidebar icons ─────────────────────────────────────────────────────────
const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  diet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  challenge: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  attendance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  activityAi: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.2 4.2L18 9l-4.8 1.8L12 15l-1.2-4.2L6 9l4.8-1.8L12 3z" />
      <path d="M5 19l1-3M19 19l-1-3" strokeLinecap="round" />
    </svg>
  ),
};

/** `crmModule` must match keys in `CRM_ACCESS_MODULES` / crm_employees.crmAllowedModules */
function buildOwnerSidebarSections() {
  return [
    {
      id: 'main',
      label: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, section: SECTION.DASHBOARD, crmModule: 'dashboard' },
        { id: 'users', label: 'Users', icon: ICONS.profile, section: SECTION.PROFILE, crmModule: 'users' },
        {
          id: 'create-admin',
          label: 'Create Admin/Staff',
          icon: ICONS.profile,
          section: SECTION.STAFF_EMPLOYEES,
          staffTab: 'create',
          crmModule: 'staff_employees',
        },
        {
          id: 'admin-users',
          label: 'Admin Users',
          icon: ICONS.profile,
          section: SECTION.STAFF_EMPLOYEES,
          staffTab: 'list',
          crmModule: 'staff_employees',
        },
        {
          id: 'attendance-admin',
          label: 'Attendance',
          icon: ICONS.attendance,
          section: SECTION.ATTENDANCE_ADMIN,
          crmModule: 'attendance_admin',
        },
      ],
    },
    {
      id: 'commerce',
      label: '',
      items: [
        { id: 'food-categories', label: 'Food Categories', icon: ICONS.diet, section: SECTION.DIET, crmModule: 'diet' },
        { id: 'products', label: 'Products', icon: ICONS.diet, section: SECTION.PRODUCTS, crmModule: 'products' },
        { id: 'addons', label: 'Add-ons', icon: ICONS.diet, section: SECTION.ADDONS, crmModule: 'addons' },
        { id: 'meal-components', label: 'Meal Component Templates', icon: ICONS.diet, crmModule: 'meal-components' },
        { id: 'orders', label: 'Orders', icon: ICONS.dashboard, crmModule: 'orders' },
        {
          id: 'challenges',
          label: 'Challenges',
          icon: ICONS.challenge,
          section: SECTION.CHALLENGE,
          challengeTab: 'overview',
          crmModule: 'challenge',
        },
        {
          id: 'competitions',
          label: 'Competitions',
          icon: ICONS.challenge,
          section: SECTION.CHALLENGE,
          challengeTab: 'competitions',
          crmModule: 'challenge',
        },
        {
          id: 'rooms',
          label: 'Rooms',
          icon: ICONS.challenge,
          section: SECTION.CHALLENGE,
          challengeTab: 'rooms',
          crmModule: 'challenge',
        },
        {
          id: 'game-features',
          label: 'Game Features',
          icon: ICONS.challenge,
          section: SECTION.GAME_FEATURES,
          crmModule: 'game_features',
        },
      ],
    },
    {
      id: 'ai',
      label: 'C BY AI',
      items: [
        { id: 'subscription-packages', label: 'Subscription Packages', icon: ICONS.diet, crmModule: 'subscription-packages' },
        { id: 'subscribers', label: 'Subscribers', icon: ICONS.profile, crmModule: 'subscribers' },
        {
          id: 'ai-meal-deliveries',
          label: 'AI Meal Deliveries',
          icon: ICONS.diet,
          section: SECTION.CBY_AI_DELIVERY,
          crmModule: 'cby_ai_delivery',
        },
        {
          id: 'ai-activity-assistant',
          label: 'AI activity assistant',
          icon: ICONS.activityAi,
          section: SECTION.ACTIVITY_AI,
          crmModule: 'activity_ai',
        },
        { id: 'meal-preparations', label: 'Meal Preparations', icon: ICONS.diet, crmModule: 'meal-preparations' },
      ],
    },
    {
      id: 'bracelet',
      label: 'BRACELA HEALTH',
      items: [
        { id: 'health-reads', label: 'Health Reads', icon: ICONS.dashboard, crmModule: 'health-reads' },
      ],
    },
    {
      id: 'bracelet-store',
      label: 'BRACELET STORE',
      items: [
        { id: 'bracelet-products', label: 'Bracelet Products', icon: ICONS.dashboard, crmModule: 'bracelet-products' },
      ],
    },
  ];
}

function filterSidebarByCrmAccess(sections, canSee) {
  return sections
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => canSee(item.crmModule)),
    }))
    .filter((g) => g.items.length > 0);
}

function sectionToCrmModule(section) {
  switch (section) {
    case SECTION.DASHBOARD:
      return 'dashboard';
    case SECTION.PROFILE:
      return 'users';
    case SECTION.DIET:
      return 'diet';
    case SECTION.PRODUCTS:
      return 'products';
    case SECTION.ADDONS:
      return 'addons';
    case SECTION.GAME_FEATURES:
      return 'game_features';
    case SECTION.CHALLENGE:
      return 'challenge';
    case SECTION.CBY_AI_DELIVERY:
      return 'cby_ai_delivery';
    case SECTION.STAFF_EMPLOYEES:
      return 'staff_employees';
    case SECTION.ATTENDANCE_ADMIN:
      return 'attendance_admin';
    case SECTION.ACTIVITY_AI:
      return 'activity_ai';
    default:
      return 'dashboard';
  }
}

function pickDefaultFromFilteredSidebar(filteredSections) {
  for (const g of filteredSections) {
    for (const item of g.items) {
      if (item.section) {
        return {
          section: item.section,
          challengeTab: item.challengeTab || 'overview',
          staffTab: item.staffTab || 'create',
        };
      }
    }
  }
  return { section: SECTION.DASHBOARD, challengeTab: 'overview', staffTab: 'create' };
}

function CrmAccessDenied() {
  return (
    <div className="crm-access-denied">
      <h2 className="crm-access-denied-title">Access restricted</h2>
      <p className="crm-access-denied-text">
        You don’t have permission to open this area. Ask an owner to update your modules under{' '}
        <strong>Staff → Directory</strong> (CRM access).
      </p>
    </div>
  );
}

function GuardedOwnerPanel({ canSee, accessLoading, moduleKey, children }) {
  if (accessLoading) {
    return <div className="content-loading">Loading permissions…</div>;
  }
  if (!canSee(moduleKey)) {
    return <CrmAccessDenied />;
  }
  return children;
}

/** Minimal sidebar for /employee/:slug — add Attendance etc. here later */
function buildEmployeeSidebarSections() {
  return [
    {
      id: 'employee',
      label: 'Navigation',
      items: [
        { id: 'emp-home', label: 'Overview', icon: ICONS.dashboard, section: SECTION.DASHBOARD },
        { id: 'emp-attendance', label: 'Attendance', icon: ICONS.attendance, section: SECTION.EMPLOYEE_ATTENDANCE },
      ],
    },
  ];
}

// ─── Dashboard stats hook ──────────────────────────────────────────────────
function useDashboardStats() {
  const [stats, setStats] = useState({
    users: null,
    challenges: null,
    dietProducts: null,
    payments: null,
    challengeCollection: null,
    loading: true,
  });

  const fetch = useCallback(async () => {
    setStats((s) => ({ ...s, loading: true }));
    const targets = ['users', '24diet_products', 'payments', ...CHALLENGE_COLLECTION_IDS];

    const results = await Promise.allSettled(
      targets.map((name) =>
        getDocs(collection(db, name)).then((snap) => ({ name, count: snap.size }))
      )
    );

    const counts = { users: 0, dietProducts: 0, payments: 0, challenges: 0, challengeCollection: null };

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const { name, count } = r.value;
      if (name === 'users') counts.users = count;
      else if (name === '24diet_products') counts.dietProducts = count;
      else if (name === 'payments') counts.payments = count;
      else if (CHALLENGE_COLLECTION_IDS.includes(name) && count > 0 && !counts.challengeCollection) {
        counts.challenges = count;
        counts.challengeCollection = name;
      }
    }

    setStats({ ...counts, loading: false });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...stats, refetch: fetch };
}

// ─── Overview bar chart (pure SVG) ────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 120;
  const BAR_W = 48;
  const GAP = 28;
  const total = data.length;
  const svgW = total * (BAR_W + GAP) - GAP + 16;

  return (
    <svg width={svgW} height={H + 40} className="bar-chart-svg">
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * H);
        const x = i * (BAR_W + GAP);
        const y = H - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx="6" fill={d.color} opacity="0.85" />
            <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#0f172a">
              {d.value}
            </text>
            <text x={x + BAR_W / 2} y={H + 18} textAnchor="middle" fontSize="11" fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Dashboard overview view ──────────────────────────────────────────────
function DashboardOverview() {
  const { users, challenges, dietProducts, payments, loading, refetch } = useDashboardStats();

  const statCards = [
    { label: 'Total Users', value: users, color: '#3b82f6', bg: '#eff6ff', icon: ICONS.profile, desc: 'Registered profiles' },
    { label: '24Diet Products', value: dietProducts, color: '#10b981', bg: '#ecfdf5', icon: ICONS.diet, desc: 'Active product catalog' },
    { label: 'Challenges', value: challenges, color: '#f59e0b', bg: '#fffbeb', icon: ICONS.challenge, desc: 'Running competitions' },
    { label: 'Payments', value: payments, color: '#8b5cf6', bg: '#f5f3ff', icon: ICONS.dashboard, desc: 'Total transactions' },
  ];

  const chartData = [
    { label: 'Users', value: users ?? 0, color: '#3b82f6' },
    { label: 'Diet Products', value: dietProducts ?? 0, color: '#10b981' },
    { label: 'Challenges', value: challenges ?? 0, color: '#f59e0b' },
    { label: 'Payments', value: payments ?? 0, color: '#8b5cf6' },
  ];

  return (
    <div className="overview-root">
      <div className="overview-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="overview-subtitle">Live snapshot from Firestore collections</p>
        </div>
        <button className="refresh-btn" onClick={refetch}>Refresh</button>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card" style={{ borderTop: `3px solid ${card.color}` }}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-card-body">
              <div className="stat-card-value" style={{ color: card.color }}>
                {loading ? <span className="stat-skeleton" /> : (card.value ?? 0)}
              </div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-desc">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Collection Overview</h3>
          <span className="chart-card-sub">Document counts per module</span>
        </div>
        <div className="chart-body">
          {loading ? (
            <div className="content-loading">Loading chart data…</div>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="quick-links-card">
        <h3>Quick Navigation</h3>
        <div className="quick-links-grid">
          <div className="quick-link-item" style={{ borderLeft: '3px solid #3b82f6' }}>
            <span className="ql-label">User Profiles</span>
            <span className="ql-sub">Manage registered users</span>
          </div>
          <div className="quick-link-item" style={{ borderLeft: '3px solid #10b981' }}>
            <span className="ql-label">24Diet Module</span>
            <span className="ql-sub">Products, add-ons, categories</span>
          </div>
          <div className="quick-link-item" style={{ borderLeft: '3px solid #f59e0b' }}>
            <span className="ql-label">24Challenge</span>
            <span className="ql-sub">Challenges & competitions</span>
          </div>
          <div className="quick-link-item" style={{ borderLeft: '3px solid #8b5cf6' }}>
            <span className="ql-label">Payments</span>
            <span className="ql-sub">{loading ? '...' : `${payments ?? 0} transactions`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collection view (Profile / Diet screen / Challenge) ──────────────────
function CollectionView({ collectionName, displayName, addDocLabel }) {
  const [addDocOpen, setAddDocOpen] = useState(false);
  const { data, loading, error, refetch } = useCollectionData(collectionName);

  return (
    <div>
      <div className="content-header">
        <div>
          <h2>{displayName}</h2>
          <div className="content-stats">
            <span className="content-stat">
              Total: <strong>{data?.length ?? 0}</strong> {data?.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
        <div className="content-actions">
          <button type="button" className="add-doc-btn" onClick={() => setAddDocOpen(true)}>
            Add document
          </button>
          <button className="refresh-btn" onClick={refetch}>Refresh</button>
        </div>
      </div>

      {error && <div className="content-error">{error}</div>}

      {loading ? (
        <div className="content-loading">Loading {displayName}…</div>
      ) : data.length === 0 ? (
        <div className="content-empty">
          No documents in this collection.
          <button type="button" className="add-doc-btn inline" onClick={() => setAddDocOpen(true)}>
            Add first document
          </button>
        </div>
      ) : (
        <DataTable data={data} collectionName={collectionName} onUpdate={refetch} />
      )}

      {addDocOpen && (
        <AddDocumentModal
          collectionName={collectionName}
          collectionDisplayName={addDocLabel || displayName}
          onClose={() => setAddDocOpen(false)}
          onSaved={() => { setAddDocOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── 24Diet view with sub-screen tabs ─────────────────────────────────────
function DietView() {
  return <FoodCategoriesPanel />;
}


// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard({ employeeSlug = null }) {
  const [section, setSection] = useState(SECTION.DASHBOARD);
  const [challengeInitialTab, setChallengeInitialTab] = useState('overview');
  const [staffInitialTab, setStaffInitialTab] = useState('create');
  const [setupHelpOpen, setSetupHelpOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { loading: accessLoading, hasFullAccess, staffRole, canSee } = useCrmStaffAccess();

  const ownerSidebarBase = useMemo(() => buildOwnerSidebarSections(), []);
  const ownerSidebarFiltered = useMemo(() => {
    if (employeeSlug) return ownerSidebarBase;
    return filterSidebarByCrmAccess(ownerSidebarBase, canSee);
  }, [employeeSlug, ownerSidebarBase, canSee]);

  const sidebarSections = employeeSlug ? buildEmployeeSidebarSections() : ownerSidebarFiltered;

  useEffect(() => {
    if (employeeSlug || accessLoading) return;
    if (canSee(sectionToCrmModule(section))) return;
    const next = pickDefaultFromFilteredSidebar(ownerSidebarFiltered);
    setSection(next.section);
    setChallengeInitialTab(next.challengeTab);
    setStaffInitialTab(next.staffTab);
  }, [employeeSlug, accessLoading, section, canSee, ownerSidebarFiltered]);

  const activeMenuId = (() => {
    if (employeeSlug) {
      if (section === SECTION.EMPLOYEE_ATTENDANCE) return 'emp-attendance';
      return 'emp-home';
    }
    if (section === SECTION.DIET) return 'food-categories';
    if (section === SECTION.PRODUCTS) return 'products';
    if (section === SECTION.ADDONS) return 'addons';
    if (section === SECTION.GAME_FEATURES) return 'game-features';
    if (section === SECTION.PROFILE) return 'users';
    if (section === SECTION.CHALLENGE && challengeInitialTab === 'competitions') return 'competitions';
    if (section === SECTION.CHALLENGE && challengeInitialTab === 'rooms') return 'rooms';
    if (section === SECTION.CHALLENGE) return 'challenges';
    if (section === SECTION.CBY_AI_DELIVERY) return 'ai-meal-deliveries';
    if (section === SECTION.STAFF_EMPLOYEES) {
      return staffInitialTab === 'list' ? 'admin-users' : 'create-admin';
    }
    if (section === SECTION.ATTENDANCE_ADMIN) return 'attendance-admin';
    if (section === SECTION.ACTIVITY_AI) return 'ai-activity-assistant';
    return 'dashboard';
  })();

  const onMenuClick = (item) => {
    if (item.section) {
      setSection(item.section);
      if (item.section === SECTION.CHALLENGE) {
        setChallengeInitialTab(item.challengeTab || 'overview');
      }
      if (item.section === SECTION.STAFF_EMPLOYEES) {
        setStaffInitialTab(item.staffTab || 'create');
      }
    }
  };

  const isEmployeePortal = Boolean(employeeSlug);

  const handleSignOut = async () => {
    await signOut();
    if (isEmployeePortal) {
      navigate(`${ROUTES.LOGIN}?next=${encodeURIComponent(employeePortalPath(employeeSlug))}`, {
        replace: true,
      });
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className={`dashboard ${isEmployeePortal ? 'dashboard--employee' : ''}`}>
      <DashboardHeader
        variant={isEmployeePortal ? 'employee' : 'admin'}
        employeeReturnPath={isEmployeePortal ? employeePortalPath(employeeSlug) : null}
      />

      <main className="dashboard-main">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${isEmployeePortal ? 'sidebar--employee' : ''}`}>
          <div className="sidebar-brand">
            <span className="brand-logo">◈</span>
            <div className="sidebar-brand-text">
              <span className="brand-name">{isEmployeePortal ? 'My workspace' : 'Admin Panel'}</span>
              {isEmployeePortal && (
                <div className="sidebar-employee-slug" title="Your workspace address">
                  {user?.email ?? '—'}
                </div>
              )}
            </div>
          </div>

          <nav className="sidebar-nav">
            {sidebarSections.map((group) => (
              <div key={group.id} className="sidebar-group">
                {group.label && <div className="sidebar-group-title">{group.label}</div>}
                <ul className="collection-list">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        className={`collection-btn ${activeMenuId === item.id ? 'active' : ''} ${!item.section ? 'muted' : ''}`}
                        onClick={() => onMenuClick(item)}
                        type="button"
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user-meta">
              <div className="sidebar-user-email">{isEmployeePortal ? 'Your account' : 'Logged in as'}</div>
              <div className="sidebar-user-value">{user?.email ?? '—'}</div>
              <div className={`sidebar-user-role ${isEmployeePortal ? 'sidebar-user-role--employee' : ''}`}>
                {isEmployeePortal
                  ? 'Employee'
                  : staffRole === 'staff_admin' && !hasFullAccess
                    ? 'Staff (limited)'
                    : 'Administrator'}
              </div>
            </div>
            <div
              className={`sidebar-footer-actions${isEmployeePortal ? ' sidebar-footer-actions--single' : ''}`}
            >
              {!isEmployeePortal && (
                <button type="button" className="setup-help-btn" onClick={() => setSetupHelpOpen(true)}>
                  Setup
                </button>
              )}
              <button type="button" className="sidebar-logout-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <section className="content">
          {section === SECTION.DASHBOARD && !employeeSlug && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="dashboard">
              <DashboardOverview />
            </GuardedOwnerPanel>
          )}
          {section === SECTION.DASHBOARD && employeeSlug && <EmployeePortalPanel slug={employeeSlug} />}
          {employeeSlug && section === SECTION.EMPLOYEE_ATTENDANCE && (
            <EmployeeAttendancePanel slug={employeeSlug} />
          )}
          {!employeeSlug && section === SECTION.PROFILE && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="users">
              <UsersAdminPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.DIET && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="diet">
              <DietView />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.PRODUCTS && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="products">
              <ProductsPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.ADDONS && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="addons">
              <AddonsPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.GAME_FEATURES && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="game_features">
              <GameFeaturesPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.CHALLENGE && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="challenge">
              <ChallengeSection initialTab={challengeInitialTab} />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.CBY_AI_DELIVERY && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="cby_ai_delivery">
              <CByAiDeliveryPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.STAFF_EMPLOYEES && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="staff_employees">
              <StaffEmployeesPanel initialTab={staffInitialTab} />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.ATTENDANCE_ADMIN && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="attendance_admin">
              <AttendanceAdminPanel />
            </GuardedOwnerPanel>
          )}
          {!employeeSlug && section === SECTION.ACTIVITY_AI && (
            <GuardedOwnerPanel canSee={canSee} accessLoading={accessLoading} moduleKey="activity_ai">
              <ActivityAiAssistantPanel />
            </GuardedOwnerPanel>
          )}
        </section>
      </main>

      {setupHelpOpen && (
        <FirestoreSetupHelp collections={[]} onClose={() => setSetupHelpOpen(false)} />
      )}
    </div>
  );
}
