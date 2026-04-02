import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './UsersAdminPanel.css';

const USER_COLLECTION_CANDIDATES = ['profile', 'users', 'profiles', 'user_profiles'];

function pickValue(obj, keys, fallback = '') {
  for (const key of keys) {
    const value = key.includes('.')
      ? key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
      : obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function pickValueInsensitive(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  const lowerMap = Object.keys(obj).reduce((acc, k) => {
    acc[k.toLowerCase()] = obj[k];
    return acc;
  }, {});

  for (const key of keys) {
    if (!key.includes('.')) {
      const direct = lowerMap[key.toLowerCase()];
      if (direct !== undefined && direct !== null && direct !== '') return direct;
      continue;
    }

    const parts = key.split('.');
    let cursor = obj;
    let ok = true;
    for (const p of parts) {
      if (!cursor || typeof cursor !== 'object') {
        ok = false;
        break;
      }
      const map = Object.keys(cursor).reduce((acc, k) => {
        acc[k.toLowerCase()] = cursor[k];
        return acc;
      }, {});
      cursor = map[p.toLowerCase()];
      if (cursor === undefined) {
        ok = false;
        break;
      }
    }
    if (ok && cursor !== null && cursor !== '') return cursor;
  }

  return fallback;
}

function looksLikeNameKey(key) {
  const k = String(key || '').toLowerCase();
  return (
    k === 'name' ||
    k === 'fullname' ||
    k === 'full_name' ||
    k === 'displayname' ||
    k === 'display_name' ||
    k === 'username' ||
    k === 'user_name'
  );
}

function looksLikeGoodName(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (v.length < 2) return false;
  if (v.includes('@')) return false;
  // Avoid showing raw document-like ids as names
  if (/^[A-Za-z0-9_-]{18,}$/.test(v)) return false;
  return true;
}

function findNameDeep(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return '';

  // First pass: direct name-like keys in this object
  for (const [key, value] of Object.entries(obj)) {
    if (looksLikeNameKey(key) && looksLikeGoodName(value)) {
      return String(value).trim();
    }
  }

  // Second pass: recurse into nested objects/arrays
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findNameDeep(item, depth + 1);
        if (found) return found;
      }
      continue;
    }
    if (value && typeof value === 'object') {
      const found = findNameDeep(value, depth + 1);
      if (found) return found;
    }
  }

  return '';
}

function normalizeStatus(raw) {
  const value = String(raw || '').toLowerCase();
  if (['active', 'enabled', 'approved', 'online'].includes(value)) return 'active';
  if (['inactive', 'disabled', 'blocked', 'offline'].includes(value)) return 'inactive';
  return 'new';
}

function toDate(raw) {
  if (!raw) return null;
  if (raw?.toDate) return raw.toDate();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(raw) {
  const d = toDate(raw);
  if (!d) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatPhone(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (text.startsWith('+')) return text;
  return `+${text}`;
}

function formatPoints(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString() : '0';
}

function formatOrders(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `${n}` : '0';
}

export default function UsersAdminPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled(
          USER_COLLECTION_CANDIDATES.map((name) =>
            getDocs(collection(db, name)).then((snap) => ({ name, docs: snap.docs }))
          )
        );

        const firstFulfilled = results.find(
          (r) => r.status === 'fulfilled' && r.value.docs.length > 0
        );
        const source = firstFulfilled?.status === 'fulfilled'
          ? firstFulfilled.value
          : (results.find((r) => r.status === 'fulfilled')?.value || { name: 'users', docs: [] });

        const mapped = source.docs.map((docSnap) => {
          const data = docSnap.data();
          const firstName = pickValueInsensitive(data, [
            'first_name',
            'firstName',
            'firstname',
            'profile.first_name',
            'profile.firstName',
          ], '');
          const lastName = pickValueInsensitive(data, [
            'last_name',
            'lastName',
            'lastname',
            'profile.last_name',
            'profile.lastName',
          ], '');
          const joinedFullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
          const explicitName = pickValueInsensitive(data, [
            'name',
            'full_name',
            'fullName',
            'display_name',
            'displayName',
            'username',
            'user_name',
            'profile.fullName',
            'profile.name',
            'profile.displayName',
          ], '');
          const discoveredDeepName = findNameDeep(data);
          const emailForFallback = String(
            pickValueInsensitive(data, ['email', 'emailAddress', 'profile.email'], '')
          ).trim();
          const emailLocal = emailForFallback.includes('@') ? emailForFallback.split('@')[0] : '';
          const resolvedName = explicitName || joinedFullName || discoveredDeepName || emailLocal || 'Unknown User';

          const joinedAt = pickValue(data, ['joined_at', 'createdAt', 'created_at', 'registeredAt', 'profile.createdAt'], null);
          const statusRaw = pickValue(data, ['status', 'accountStatus', 'profile.status'], 'new');
          return {
            id: docSnap.id,
            name: String(resolvedName),
            phone: formatPhone(pickValue(data, ['phone', 'phoneNumber', 'mobile', 'profile.phone'], '')),
            type: String(pickValue(data, ['type', 'role', 'userType', 'profile.type'], 'Customer')),
            status: normalizeStatus(statusRaw),
            statusRaw: String(statusRaw || 'new'),
            points: Number(pickValue(data, ['points', 'score', 'total_points', 'walletPoints'], 0)) || 0,
            orders: Number(pickValue(data, ['orders', 'orders_count', 'totalOrders'], 0)) || 0,
            joinedAt,
            sourceCollection: source.name,
          };
        });

        if (mounted) setRows(mapped);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load users from Firebase.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const active = rows.filter((r) => r.status === 'active').length;
    const inactive = rows.filter((r) => r.status === 'inactive').length;
    const newToday = rows.filter((r) => {
      const d = toDate(r.joinedAt);
      return d && d >= todayStart;
    }).length;
    const newThisMonth = rows.filter((r) => {
      const d = toDate(r.joinedAt);
      return d && d >= monthStart;
    }).length;

    return {
      total: rows.length,
      active,
      inactive,
      newToday,
      newThisMonth,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.type.toLowerCase() !== typeFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter, typeFilter]);

  const typeOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.type.toLowerCase()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  return (
    <div className="users-admin-root">
      <div className="users-admin-top">
        <h2>Users</h2>
        <p>Showing data from Firebase profile/user collections.</p>
      </div>

      <div className="users-stats-grid">
        <div className="users-stat-card">
          <span className="users-stat-title">Total Customers</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="users-stat-card">
          <span className="users-stat-title">Active</span>
          <strong className="green">{stats.active}</strong>
        </div>
        <div className="users-stat-card">
          <span className="users-stat-title">Inactive</span>
          <strong className="orange">{stats.inactive}</strong>
        </div>
        <div className="users-stat-card">
          <span className="users-stat-title">New Today</span>
          <strong>{stats.newToday}</strong>
        </div>
        <div className="users-stat-card">
          <span className="users-stat-title">New This Month</span>
          <strong>{stats.newThisMonth}</strong>
        </div>
      </div>

      <div className="users-table-card">
        <div className="users-toolbar">
          <input
            className="users-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, id..."
          />
          <select
            className="users-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New</option>
          </select>
          <select
            className="users-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="users-error">{error}</div>}
        {loading ? (
          <div className="users-loading">Loading users...</div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="user-main">
                        <span className="user-name">{row.name}</span>
                        <span className="user-sub">{row.phone || row.id}</span>
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td>
                      <span className={`status-pill ${row.status}`}>
                        {row.statusRaw || row.status}
                      </span>
                    </td>
                    <td>{formatPoints(row.points)}</td>
                    <td>{formatOrders(row.orders)} orders</td>
                    <td>{formatDate(row.joinedAt)}</td>
                    <td>
                      <button type="button" className="btn-delete" title="UI only">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="users-empty">
                      No users match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
