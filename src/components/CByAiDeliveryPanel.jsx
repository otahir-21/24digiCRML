import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './CByAiDeliveryPanel.css';

const DELIVERY_COLLECTIONS = ['c_by_ai_delivery', 'cby_ai_delivery'];

function fmtTs(ts) {
  if (!ts) return '—';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

function num(v, digits = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) && digits === 0 ? String(n) : n.toFixed(digits);
}

function orderTs(ts) {
  if (!ts) return 0;
  if (typeof ts.seconds === 'number') return ts.seconds;
  try {
    const d = ts.toDate?.();
    if (d) return d.getTime() / 1000;
  } catch { /* ignore */ }
  return 0;
}

function mapsUrl(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return `https://www.google.com/maps?q=${la},${ln}`;
}

function normalizeDoc(id, data) {
  const meals = Array.isArray(data.lastOrderMeals) ? data.lastOrderMeals : [];
  return {
    id,
    userId: data.userId || id,
    fullName: data.fullName || '—',
    addressTitle: data.addressTitle || '',
    building: data.building || '',
    floor: data.floor || '',
    address: data.address || '',
    landmark: data.landmark || '',
    city: data.city || '',
    frequency: data.frequency,
    useForFuture: Boolean(data.useForFuture),
    lastSessionId: data.lastSessionId || '',
    lastOrderSelectedDay: data.lastOrderSelectedDay,
    lastOrderAt: data.lastOrderAt,
    updatedAt: data.updatedAt,
    mealPlanPdfUpdatedAt: data.mealPlanPdfUpdatedAt,
    mealPlanPdfPath: data.mealPlanPdfPath || '',
    mealPlanPdfUrl: data.mealPlanPdfUrl || '',
    latitude: data.latitude,
    longitude: data.longitude,
    lastOrderMeals: meals.map((m, i) => ({
      key: i,
      name: m?.name || '—',
      time: m?.time || '—',
      type: m?.type || '—',
      totalCal: m?.totalCal,
      totalProtein: m?.totalProtein,
      totalCarbs: m?.totalCarbs,
      totalFat: m?.totalFat,
    })),
  };
}

export default function CByAiDeliveryPanel() {
  const [rows, setRows] = useState([]);
  const [sourceCollection, setSourceCollection] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let picked = null;
      for (const name of DELIVERY_COLLECTIONS) {
        const snap = await getDocs(collection(db, name));
        if (snap.size > 0 || !picked) {
          picked = { name, snap };
          if (snap.size > 0) break;
        }
      }
      if (!picked) {
        setRows([]);
        setSourceCollection(DELIVERY_COLLECTIONS[0]);
        return;
      }
      setSourceCollection(picked.name);
      const list = picked.snap.docs.map((d) => normalizeDoc(d.id, d.data()));
      list.sort((a, b) => orderTs(b.lastOrderAt) - orderTs(a.lastOrderAt));
      setRows(list);
      setSelectedId((prev) => (prev && list.some((r) => r.id === prev) ? prev : list[0]?.id || null));
    } catch (e) {
      setError(e.message || 'Failed to load c_by_ai_delivery from Firebase');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q)
        || String(r.userId || '').toLowerCase().includes(q)
        || String(r.fullName || '').toLowerCase().includes(q)
        || String(r.city || '').toLowerCase().includes(q)
        || String(r.building || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const selected = useMemo(() => {
    const inFilter = filtered.find((r) => r.id === selectedId);
    if (inFilter) return inFilter;
    return filtered[0] || null;
  }, [filtered, selectedId]);

  return (
    <div className="cbd-root">
      <div className="cbd-page-title">C by AI — delivery &amp; meal plan</div>
      <p className="cbd-sub">
        Live data from Firestore <code>{sourceCollection || DELIVERY_COLLECTIONS[0]}</code>
        {sourceCollection && rows.length === 0 && !loading && ' (no documents yet)'}
      </p>

      <div className="cbd-card cbd-toolbar">
        <input
          type="search"
          className="cbd-search"
          placeholder="Search by user ID, name, city, building…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="cbd-btn" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="cbd-error">{error}</div>}
      {loading && <div className="cbd-loading">Loading delivery profiles…</div>}

      {!loading && !error && (
        <div className="cbd-layout">
          <aside className="cbd-list">
            <div className="cbd-list-head">{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}</div>
            <ul>
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`cbd-list-item ${selected?.id === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <span className="cbd-list-name">{r.fullName}</span>
                    <span className="cbd-list-meta">{r.city || r.id.slice(0, 8)}…</span>
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && <div className="cbd-empty">No rows match search.</div>}
          </aside>

          <div className="cbd-detail">
            {!selected && <div className="cbd-empty">No delivery documents in this collection.</div>}
            {selected && (
              <>
                <div className="cbd-card">
                  <h3 className="cbd-h3">Customer</h3>
                  <dl className="cbd-dl">
                    <dt>User ID</dt>
                    <dd><code>{selected.userId}</code></dd>
                    <dt>Full name</dt>
                    <dd>{selected.fullName}</dd>
                    <dt>Frequency</dt>
                    <dd>{selected.frequency != null ? selected.frequency : '—'} meals / period</dd>
                    <dt>Use for future orders</dt>
                    <dd>{selected.useForFuture ? 'Yes' : 'No'}</dd>
                    <dt>Last session ID</dt>
                    <dd>{selected.lastSessionId || '—'}</dd>
                    <dt>Last order — selected day</dt>
                    <dd>{selected.lastOrderSelectedDay != null ? selected.lastOrderSelectedDay : '—'}</dd>
                  </dl>
                </div>

                <div className="cbd-card">
                  <h3 className="cbd-h3">Delivery address</h3>
                  <dl className="cbd-dl">
                    <dt>Label</dt>
                    <dd>{selected.addressTitle || '—'}</dd>
                    <dt>Building / tower</dt>
                    <dd>{selected.building || '—'}</dd>
                    <dt>Floor</dt>
                    <dd>{selected.floor || '—'}</dd>
                    <dt>Unit / address</dt>
                    <dd>{selected.address || '—'}</dd>
                    <dt>Landmark</dt>
                    <dd>{selected.landmark || '—'}</dd>
                    <dt>City</dt>
                    <dd>{selected.city || '—'}</dd>
                    <dt>Coordinates</dt>
                    <dd>
                      {mapsUrl(selected.latitude, selected.longitude) ? (
                        <a href={mapsUrl(selected.latitude, selected.longitude)} target="_blank" rel="noopener noreferrer">
                          {num(selected.latitude, 6)}, {num(selected.longitude, 6)} — Open in Maps
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </dl>
                </div>

                <div className="cbd-card">
                  <h3 className="cbd-h3">Meal plan PDF</h3>
                  <dl className="cbd-dl">
                    <dt>Updated</dt>
                    <dd>{fmtTs(selected.mealPlanPdfUpdatedAt)}</dd>
                    <dt>Storage path</dt>
                    <dd className="cbd-mono-wrap">{selected.mealPlanPdfPath || '—'}</dd>
                    <dt>Download</dt>
                    <dd>
                      {selected.mealPlanPdfUrl ? (
                        <a className="cbd-link-btn" href={selected.mealPlanPdfUrl} target="_blank" rel="noopener noreferrer">
                          Open PDF
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </dl>
                </div>

                <div className="cbd-card">
                  <h3 className="cbd-h3">Timestamps</h3>
                  <dl className="cbd-dl">
                    <dt>Last order at</dt>
                    <dd>{fmtTs(selected.lastOrderAt)}</dd>
                    <dt>Record updated</dt>
                    <dd>{fmtTs(selected.updatedAt)}</dd>
                  </dl>
                </div>

                <div className="cbd-card cbd-meals-card">
                  <h3 className="cbd-h3">Last order — meals ({selected.lastOrderMeals.length})</h3>
                  {selected.lastOrderMeals.length === 0 ? (
                    <p className="cbd-muted">No lastOrderMeals array on this document.</p>
                  ) : (
                    <div className="cbd-table-wrap">
                      <table className="cbd-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Cal</th>
                            <th>Protein</th>
                            <th>Carbs</th>
                            <th>Fat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.lastOrderMeals.map((m) => (
                            <tr key={m.key}>
                              <td>{m.time}</td>
                              <td>{m.name}</td>
                              <td><span className="cbd-chip">{m.type}</span></td>
                              <td>{num(m.totalCal, 0)}</td>
                              <td>{num(m.totalProtein, 1)}</td>
                              <td>{num(m.totalCarbs, 1)}</td>
                              <td>{num(m.totalFat, 1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
