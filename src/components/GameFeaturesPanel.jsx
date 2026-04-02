import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './GameFeaturesPanel.css';

const COLLECTION_NAME = 'game_features';

const DEFAULT_FEATURES = [
  { id: 'ENTER_GAME_ZONE', name: 'Enter Game Zone', category: 'GAME ENTRY', cost: 30, usage: 15, requirements: [] },
  { id: 'PRIVATE_CHALLENGE_CREATE', name: 'Private Challenge - Create', category: 'PRIVATE CHALLENGE', cost: 450, usage: 3, requirements: ['none'] },
  { id: 'PRIVATE_CHALLENGE_JOIN', name: 'Private Challenge - Join', category: 'PRIVATE CHALLENGE', cost: 200, usage: 9, requirements: ['none'] },
  { id: 'PUBLIC_COMPETITION', name: 'Public Competition', category: 'COMPETITION', cost: 0, usage: 0, requirements: ['none'] },
  { id: 'PRIVATE_COMPETITION', name: 'Private Competition', category: 'COMPETITION', cost: 75, usage: 9, requirements: ['GOLD_MEDAL', 'SILVER_MEDAL'] },
  { id: 'GOLD_MEDAL', name: 'Gold Medal', category: 'MEDAL', cost: 100, usage: 0, requirements: ['none'] },
  { id: 'SILVER_MEDAL', name: 'Silver Medal', category: 'MEDAL', cost: 50, usage: 0, requirements: ['none'] },
  { id: 'BRONZE_MEDAL', name: 'Bronze Medal', category: 'MEDAL', cost: 25, usage: 0, requirements: ['none'] },
];

function normalizeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function GameFeaturesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const mapped = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          featureId: data.feature_id || d.id,
          name: data.name || 'Untitled Feature',
          description: data.description || '',
          category: data.category || 'OTHER',
          cost: normalizeNum(data.cost, 0),
          usage: normalizeNum(data.usage, 0),
          requirements: Array.isArray(data.requirements) ? data.requirements : [],
          active: data.active !== false,
        };
      });
      setRows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load game features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const initializeDefaults = async () => {
    setSeeding(true);
    setError('');
    try {
      for (const feature of DEFAULT_FEATURES) {
        const ref = doc(db, COLLECTION_NAME, feature.id);
        await setDoc(ref, {
          feature_id: feature.id,
          name: feature.name,
          description: '',
          category: feature.category,
          cost: feature.cost,
          usage: feature.usage,
          requirements: feature.requirements,
          active: true,
        }, { merge: true });
      }
      await load();
    } catch (e) {
      setError(e.message || 'Failed to initialize defaults');
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (row) => {
    const ref = doc(db, COLLECTION_NAME, row.id);
    const next = !row.active;
    await updateDoc(ref, { active: next });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: next } : r)));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.featureId.toLowerCase().includes(q)
      || r.name.toLowerCase().includes(q)
      || r.category.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.active).length;
    const usage = rows.reduce((sum, r) => sum + (r.usage || 0), 0);
    const avgCost = total ? Math.round(rows.reduce((sum, r) => sum + (r.cost || 0), 0) / total) : 0;
    return { total, active, usage, avgCost };
  }, [rows]);

  return (
    <div className="gf-root">
      <div className="gf-page-title">Game Features</div>

      <div className="gf-head-row">
        <div>
          <h3>Game Zone Features</h3>
          <p>Manage game zone features, pricing, and requirements.</p>
        </div>
        <div className="gf-actions">
          <button type="button" className="gf-btn" onClick={load}>Refresh</button>
          <button type="button" className="gf-btn" onClick={initializeDefaults} disabled={seeding}>
            {seeding ? 'Initializing...' : 'Initialize Defaults'}
          </button>
          <button type="button" className="gf-btn dark" onClick={() => setShowCreate(true)}>+ Add Feature</button>
        </div>
      </div>

      <div className="gf-stats">
        <div className="gf-stat-card"><span>Total Features</span><strong>{stats.total}</strong></div>
        <div className="gf-stat-card"><span>Active Features</span><strong>{stats.active}</strong></div>
        <div className="gf-stat-card"><span>Total Usage</span><strong>{stats.usage}</strong></div>
        <div className="gf-stat-card"><span>Avg. Cost</span><strong>{stats.avgCost} pts</strong></div>
      </div>

      <div className="gf-table-card">
        <div className="gf-table-top">
          <h4>All Features</h4>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="gf-error">{error}</div>}
        {loading ? (
          <div className="gf-loading">Loading features...</div>
        ) : (
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>Feature ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Usage</th>
                  <th>Requirements</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.featureId}</td>
                    <td>
                      <div className="gf-name-cell">
                        <strong>{row.name}</strong>
                        {row.description && <span>{row.description}</span>}
                      </div>
                    </td>
                    <td><span className="gf-cat-chip">{row.category}</span></td>
                    <td>{row.cost} pts</td>
                    <td>{row.usage}</td>
                    <td>{row.requirements.length ? row.requirements.join(', ') : 'None'}</td>
                    <td>
                      <label className="gf-switch">
                        <input type="checkbox" checked={row.active} onChange={() => toggleActive(row)} />
                        <span className="gf-slider" />
                      </label>
                    </td>
                    <td>
                      <button type="button" className="gf-icon-btn" onClick={() => setEditingRow(row)}>✎</button>
                      <button type="button" className="gf-icon-btn">🗑</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="gf-empty">No features found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateFeatureDialog
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            await load();
            setShowCreate(false);
          }}
        />
      )}

      {editingRow && (
        <EditFeatureDialog
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onUpdated={async () => {
            await load();
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}

function CreateFeatureDialog({ onClose, onCreated }) {
  const FEATURE_TYPES = [
    'GAME_ZONE_ENTRY',
    'PRIVATE_CHALLENGE_CREATE',
    'PRIVATE_CHALLENGE_JOIN',
    'PUBLIC_COMPETITION',
    'PRIVATE_COMPETITION',
    'GOLD_MEDAL',
    'SILVER_MEDAL',
    'BRONZE_MEDAL',
  ];
  const CATEGORIES = ['ENTRY', 'PRIVATE CHALLENGE', 'COMPETITION', 'MEDAL'];
  const [saving, setSaving] = useState(false);
  const [reqInput, setReqInput] = useState('');
  const [draft, setDraft] = useState({
    featureId: '',
    name: '',
    description: '',
    category: '',
    cost: 0,
    displayOrder: 0,
    requirements: [],
    active: true,
    adminOnly: false,
  });

  const update = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const addRequirement = () => {
    const next = reqInput.trim();
    if (!next) return;
    setDraft((p) => ({
      ...p,
      requirements: p.requirements.includes(next) ? p.requirements : [...p.requirements, next],
    }));
    setReqInput('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.featureId.trim()) return;
    setSaving(true);
    try {
      const docId = draft.featureId.trim();
      await setDoc(doc(db, COLLECTION_NAME, docId), {
        feature_id: docId,
        name: draft.name || docId,
        description: draft.description || '',
        category: draft.category || 'ENTRY',
        cost: normalizeNum(draft.cost, 0),
        display_order: normalizeNum(draft.displayOrder, 0),
        usage: 0,
        requirements: draft.requirements,
        active: !!draft.active,
        admin_only: !!draft.adminOnly,
      }, { merge: true });
      await onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gf-dialog-overlay" onClick={onClose}>
      <div className="gf-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="gf-dialog-header">
          <div>
            <h3>Create Feature</h3>
            <p>Fill in the details to create a new feature</p>
          </div>
          <button type="button" className="gf-close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="gf-dialog-form" onSubmit={submit}>
          <div className="gf-grid-2">
            <label>
              Feature ID
              <select value={draft.featureId} onChange={(e) => update('featureId', e.target.value)}>
                <option value="">Select feature type</option>
                {FEATURE_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label>
              Feature Name
              <input
                placeholder="e.g., Enter Game Zone"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </label>
          </div>

          <label>
            Description
            <input
              placeholder="Feature description"
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </label>

          <div className="gf-grid-3">
            <label>
              Category
              <select value={draft.category} onChange={(e) => update('category', e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Cost (Points)
              <input type="number" value={draft.cost} onChange={(e) => update('cost', e.target.value)} />
            </label>
            <label>
              Display Order
              <input type="number" value={draft.displayOrder} onChange={(e) => update('displayOrder', e.target.value)} />
            </label>
          </div>

          <label>
            Requirements
            <div className="gf-req-row">
              <input
                placeholder="Add a requirement (e.g., GOLD_MEDAL)"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
              />
              <button type="button" className="gf-btn dark" onClick={addRequirement}>Add</button>
            </div>
          </label>
          {draft.requirements.length > 0 && (
            <div className="gf-req-list">
              {draft.requirements.map((req) => (
                <span key={req} className="gf-req-chip">{req}</span>
              ))}
            </div>
          )}

          <div className="gf-check-row">
            <label>
              <input type="checkbox" checked={draft.active} onChange={(e) => update('active', e.target.checked)} />
              Feature is active
            </label>
            <label>
              <input type="checkbox" checked={draft.adminOnly} onChange={(e) => update('adminOnly', e.target.checked)} />
              Admin only feature
            </label>
          </div>

          <div className="gf-dialog-actions">
            <button type="button" className="gf-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="gf-btn dark" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditFeatureDialog({ row, onClose, onUpdated }) {
  const FEATURE_TYPES = [
    'GAME_ZONE_ENTRY',
    'PRIVATE_CHALLENGE_CREATE',
    'PRIVATE_CHALLENGE_JOIN',
    'PUBLIC_COMPETITION',
    'PRIVATE_COMPETITION',
    'GOLD_MEDAL',
    'SILVER_MEDAL',
    'BRONZE_MEDAL',
  ];
  const CATEGORIES = ['ENTRY', 'PRIVATE CHALLENGE', 'COMPETITION', 'MEDAL'];
  const [saving, setSaving] = useState(false);
  const [reqInput, setReqInput] = useState('');
  const [draft, setDraft] = useState({
    id: row.id,
    featureId: row.featureId || row.id,
    name: row.name || '',
    description: row.description || '',
    category: row.category || 'ENTRY',
    cost: row.cost ?? 0,
    displayOrder: row.displayOrder ?? 0,
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    active: !!row.active,
    adminOnly: !!row.admin_only,
  });

  const update = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const addRequirement = () => {
    const next = reqInput.trim();
    if (!next) return;
    setDraft((p) => ({
      ...p,
      requirements: p.requirements.includes(next) ? p.requirements : [...p.requirements, next],
    }));
    setReqInput('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, draft.id);
      await updateDoc(docRef, {
        feature_id: draft.featureId,
        name: draft.name || draft.featureId,
        description: draft.description || '',
        category: draft.category || 'ENTRY',
        cost: normalizeNum(draft.cost, 0),
        display_order: normalizeNum(draft.displayOrder, 0),
        requirements: draft.requirements,
        active: !!draft.active,
        admin_only: !!draft.adminOnly,
      });
      await onUpdated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gf-dialog-overlay" onClick={onClose}>
      <div className="gf-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="gf-dialog-header">
          <div>
            <h3>Edit Feature</h3>
            <p>Update the feature details below</p>
          </div>
          <button type="button" className="gf-close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="gf-dialog-form" onSubmit={submit}>
          <div className="gf-grid-2">
            <label>
              Feature ID
              <select value={draft.featureId} onChange={(e) => update('featureId', e.target.value)}>
                {FEATURE_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label>
              Feature Name
              <input value={draft.name} onChange={(e) => update('name', e.target.value)} />
            </label>
          </div>

          <label>
            Description
            <input value={draft.description} onChange={(e) => update('description', e.target.value)} />
          </label>

          <div className="gf-grid-3">
            <label>
              Category
              <select value={draft.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Cost (Points)
              <input type="number" value={draft.cost} onChange={(e) => update('cost', e.target.value)} />
            </label>
            <label>
              Display Order
              <input type="number" value={draft.displayOrder} onChange={(e) => update('displayOrder', e.target.value)} />
            </label>
          </div>

          <label>
            Requirements
            <div className="gf-req-row">
              <input
                placeholder="Add a requirement (e.g., GOLD_MEDAL)"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
              />
              <button type="button" className="gf-btn dark" onClick={addRequirement}>Add</button>
            </div>
          </label>

          {draft.requirements.length > 0 && (
            <div className="gf-req-list">
              {draft.requirements.map((req) => (
                <span key={req} className="gf-req-chip">{req}</span>
              ))}
            </div>
          )}

          <div className="gf-check-row">
            <label>
              <input type="checkbox" checked={draft.active} onChange={(e) => update('active', e.target.checked)} />
              Feature is active
            </label>
            <label>
              <input type="checkbox" checked={draft.adminOnly} onChange={(e) => update('adminOnly', e.target.checked)} />
              Admin only feature
            </label>
          </div>

          <div className="gf-dialog-actions">
            <button type="button" className="gf-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="gf-btn dark" disabled={saving}>{saving ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
