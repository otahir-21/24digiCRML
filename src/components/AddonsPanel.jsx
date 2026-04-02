import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './AddonsPanel.css';

const ADDON_COLLECTIONS = ['24diet_productaddons', 'productaddons', 'addons'];

function pick(obj, keys, fallback = '') {
  for (const key of keys) {
    const value = key.includes('.')
      ? key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
      : obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatus(value) {
  const text = String(value || '').toLowerCase();
  if (['active', 'enabled', 'published', 'true', '1'].includes(text)) return 'Active';
  if (['inactive', 'disabled', 'draft', 'false', '0'].includes(text)) return 'Inactive';
  return 'Active';
}

function normalizeKey(text) {
  return String(text || '').trim().toLowerCase();
}

function toMoney(value) {
  const n = asNumber(value, 0);
  return `AED ${n.toFixed(2)}`;
}

export default function AddonsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingRow, setEditingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        ADDON_COLLECTIONS.map((name) =>
          getDocs(collection(db, name)).then((snap) => ({ name, docs: snap.docs }))
        )
      );

      const source = results.find((r) => r.status === 'fulfilled' && r.value.docs.length > 0)?.value
        || results.find((r) => r.status === 'fulfilled')?.value
        || { name: ADDON_COLLECTIONS[0], docs: [] };

      const mapped = source.docs.map((docSnap, idx) => {
        const data = docSnap.data();
        const nutritionObj = pick(data, ['nutrition'], {});
        const applicableCategories = Array.isArray(pick(data, ['applicable_categories', 'applicableCategories'], []))
          ? pick(data, ['applicable_categories', 'applicableCategories'], [])
          : [];
        return {
          id: docSnap.id,
          sourceCollection: source.name,
          displayId: pick(data, ['id', 'addon_id', 'add_on_id'], idx + 1),
          nameEn: String(pick(data, ['name_en', 'name', 'title'], 'Unnamed Add-on')),
          nameAr: String(pick(data, ['name_ar', 'arabic_name'], 'Not provided')),
          descriptionEn: String(pick(data, ['description_en', 'description'], '')),
          sortOrder: asNumber(pick(data, ['sort_order', 'sortOrder'], 0), 0),
          image: String(pick(data, ['image', 'image_url', 'thumbnail'], '')),
          category: String(pick(data, ['category', 'type'], 'Other')),
          price: toMoney(pick(data, ['price', 'amount', 'cost'], 0)),
          priceRaw: asNumber(pick(data, ['price', 'amount', 'cost'], 0), 0),
          minQty: asNumber(pick(data, ['min_qty', 'min_quantity'], 0), 0),
          maxQty: asNumber(pick(data, ['max_qty', 'max_quantity'], 5), 5),
          qtyRange: `${pick(data, ['min_qty', 'min_quantity'], 0)}-${pick(data, ['max_qty', 'max_quantity'], 5)}`,
          available: String(pick(data, ['available', 'is_available', 'stock'], 'Yes')).toLowerCase() === 'false' ? 'No' : 'Yes',
          status: normalizeStatus(pick(data, ['status', 'is_active', 'active'], 'active')),
          nutritionCalories: asNumber(pick(data, ['nutrition_cal', 'calories', 'nutrition.calories'], nutritionObj?.calories ?? 0), 0),
          nutritionProtein: asNumber(pick(data, ['protein', 'nutrition.protein'], nutritionObj?.protein ?? 0), 0),
          nutritionCarbs: asNumber(pick(data, ['carbs', 'nutrition.carbs'], nutritionObj?.carbs ?? 0), 0),
          nutritionFat: asNumber(pick(data, ['fat', 'nutrition.fat'], nutritionObj?.fat ?? 0), 0),
          nutrition: `${asNumber(pick(data, ['nutrition_cal', 'calories', 'nutrition.calories'], nutritionObj?.calories ?? 0), 0)} kcal`,
          applicableCategories: applicableCategories.length ? applicableCategories : ['Food'],
        };
      });

      setRows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (row) => {
    const nextStatus = row.status === 'Active' ? 'Inactive' : 'Active';
    const isActive = nextStatus === 'Active';
    const ref = doc(db, row.sourceCollection, row.id);
    await updateDoc(ref, {
      status: nextStatus,
      active: isActive,
      is_active: isActive,
    });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)));
  };

  const saveEdit = async (next) => {
    const ref = doc(db, next.sourceCollection, next.id);
    const isActive = next.status === 'Active';
    const isAvailable = next.available === 'Yes';
    const payload = {
      name_en: next.nameEn,
      name: next.nameEn,
      name_ar: next.nameAr,
      description_en: next.descriptionEn || '',
      description: next.descriptionEn || '',
      category: next.category,
      type: next.category,
      price: asNumber(next.priceRaw, 0),
      sort_order: asNumber(next.sortOrder, 0),
      min_qty: asNumber(next.minQty, 0),
      min_quantity: asNumber(next.minQty, 0),
      max_qty: asNumber(next.maxQty, 0),
      max_quantity: asNumber(next.maxQty, 0),
      image: next.image || '',
      image_url: next.image || '',
      available: isAvailable,
      is_available: isAvailable,
      status: next.status,
      active: isActive,
      is_active: isActive,
      applicable_categories: next.applicableCategories || [],
      applicableCategories: next.applicableCategories || [],
      nutrition_cal: asNumber(next.nutritionCalories, 0),
      calories: asNumber(next.nutritionCalories, 0),
      protein: asNumber(next.nutritionProtein, 0),
      carbs: asNumber(next.nutritionCarbs, 0),
      fat: asNumber(next.nutritionFat, 0),
      nutrition: {
        calories: asNumber(next.nutritionCalories, 0),
        protein: asNumber(next.nutritionProtein, 0),
        carbs: asNumber(next.nutritionCarbs, 0),
        fat: asNumber(next.nutritionFat, 0),
      },
    };
    await updateDoc(ref, payload);
    await load();
  };

  const categoryOptions = useMemo(() => {
    const set = new Set(rows.map((r) => normalizeKey(r.category)).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && normalizeKey(r.category) !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.nameEn.toLowerCase().includes(q)
        || r.nameAr.toLowerCase().includes(q)
        || String(r.displayId).toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoryFilter]);

  return (
    <div className="ao-root">
      <div className="ao-page-title">Add-ons</div>

      <div className="ao-card">
        <div className="ao-top">
          <h3>Product Add-ons</h3>
          <div className="ao-actions">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All Categories' : opt}
                </option>
              ))}
            </select>
            <button type="button" className="ao-btn" onClick={load}>Refresh</button>
            <button type="button" className="ao-btn dark">Add Add-on</button>
          </div>
        </div>

        <div className="ao-search-row">
          <input
            placeholder="Search add-ons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="ao-error">{error}</div>}
        {loading ? (
          <div className="ao-loading">Loading add-ons...</div>
        ) : (
          <div className="ao-table-wrap">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name (EN)</th>
                  <th>Name (AR)</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity Range</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Nutrition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.displayId}</td>
                    <td>{row.nameEn}</td>
                    <td>{row.nameAr}</td>
                    <td>{row.category}</td>
                    <td>{row.price}</td>
                    <td>{row.qtyRange}</td>
                    <td><span className="ao-chip">{row.available}</span></td>
                    <td><span className="ao-chip">{row.status}</span></td>
                    <td>{row.nutrition}</td>
                    <td>
                      <button
                        type="button"
                        className={`ao-toggle-btn ${row.status === 'Active' ? 'disable' : 'enable'}`}
                        onClick={() => toggleStatus(row)}
                      >
                        {row.status === 'Active' ? 'Disable' : 'Active'}
                      </button>
                      <button type="button" className="ao-action-icon" title="Edit" onClick={() => setEditingRow(row)}>✎</button>
                      <button type="button" className="ao-action-icon" title="Delete">🗑</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="ao-empty">No add-ons found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingRow && (
        <EditAddonDialog
          row={editingRow}
          categoryOptions={categoryOptions}
          onClose={() => setEditingRow(null)}
          onSave={async (next) => {
            await saveEdit(next);
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}

function EditAddonDialog({ row, onClose, onSave, categoryOptions }) {
  const [draft, setDraft] = useState({ ...row });
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState('basic');
  const [lang, setLang] = useState('en');
  const [useImageUrl, setUseImageUrl] = useState(true);

  const updateField = (key, value) => setDraft((p) => ({ ...p, [key]: value }));
  const toggleApplicableCategory = (value) => {
    setDraft((p) => {
      const current = Array.isArray(p.applicableCategories) ? p.applicableCategories : [];
      const exists = current.includes(value);
      return {
        ...p,
        applicableCategories: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ao-dialog-overlay" onClick={onClose}>
      <div className="ao-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ao-dialog-header">
          <div>
            <h3>Edit Add-on</h3>
            <p>Update the add-on details.</p>
          </div>
          <button type="button" className="ao-close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="ao-dialog-form" onSubmit={submit}>
          <div className="ao-tabs">
            <button type="button" className={mainTab === 'basic' ? 'active' : ''} onClick={() => setMainTab('basic')}>Basic Info</button>
            <button type="button" className={mainTab === 'restrictions' ? 'active' : ''} onClick={() => setMainTab('restrictions')}>Restrictions</button>
            <button type="button" className={mainTab === 'nutrition' ? 'active' : ''} onClick={() => setMainTab('nutrition')}>Nutrition</button>
          </div>

          <div className="ao-lang-tabs">
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
            <button type="button" className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>Arabic</button>
          </div>

          {mainTab === 'basic' && (
            <>
              <div className="ao-grid-2">
                <label>
                  Name (English)
                  <input value={draft.nameEn || ''} onChange={(e) => updateField('nameEn', e.target.value)} />
                </label>
                <label>
                  Name (Arabic)
                  <input value={draft.nameAr || ''} onChange={(e) => updateField('nameAr', e.target.value)} />
                </label>
              </div>

              <label>
                Description (English)
                <textarea rows={2} placeholder="Optional description" value={draft.descriptionEn || ''} onChange={(e) => updateField('descriptionEn', e.target.value)} />
              </label>

              <div className="ao-grid-2">
                <label>
                  Category
                  <select value={normalizeKey(draft.category)} onChange={(e) => updateField('category', e.target.value)}>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'all' ? 'All Categories' : opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sort Order
                  <input type="number" value={draft.sortOrder ?? 0} onChange={(e) => updateField('sortOrder', e.target.value)} />
                </label>
              </div>

              <div className="ao-grid-2">
                <label>
                  Price (AED)
                  <input type="number" value={draft.priceRaw ?? 0} onChange={(e) => updateField('priceRaw', e.target.value)} />
                </label>
                <div />
              </div>

              <div className="ao-image-block">
                <div className="ao-image-title">Add-on Image</div>
                {draft.image ? (
                  <div className="ao-image-preview-wrap">
                    <img src={draft.image} alt="addon preview" className="ao-image-preview" />
                    <button type="button" className="ao-remove-image" onClick={() => updateField('image', '')}>✕</button>
                  </div>
                ) : (
                  <div className="ao-upload-placeholder">
                    Drop an image here or click to browse
                    <span>Max size: 5MB</span>
                  </div>
                )}
                <button type="button" className="ao-link-btn" onClick={() => setUseImageUrl((v) => !v)}>
                  {useImageUrl ? 'Use upload area instead' : 'Or enter image URL instead'}
                </button>
                {useImageUrl && (
                  <input
                    className="ao-image-url-input"
                    placeholder="https://..."
                    value={draft.image || ''}
                    onChange={(e) => updateField('image', e.target.value)}
                  />
                )}
              </div>

              <div className="ao-check-row">
                <label><input type="checkbox" checked={draft.available === 'Yes'} onChange={(e) => updateField('available', e.target.checked ? 'Yes' : 'No')} /> Available</label>
                <label><input type="checkbox" checked={draft.status === 'Active'} onChange={(e) => updateField('status', e.target.checked ? 'Active' : 'Inactive')} /> Active</label>
              </div>
            </>
          )}

          {mainTab === 'restrictions' && (
            <>
              <div className="ao-grid-2">
                <label>
                  Minimum Quantity
                  <input type="number" value={draft.minQty ?? 0} onChange={(e) => updateField('minQty', e.target.value)} />
                </label>
                <label>
                  Maximum Quantity
                  <input type="number" value={draft.maxQty ?? 0} onChange={(e) => updateField('maxQty', e.target.value)} />
                </label>
              </div>

              <div className="ao-section-note">
                Applicable Categories
                <span>Select product categories this add-on can be used with. Leave empty for global availability.</span>
              </div>

              <div className="ao-check-row">
                {['Food', 'Points', 'Subscriptions'].map((cat) => (
                  <label key={cat}>
                    <input
                      type="checkbox"
                      checked={(draft.applicableCategories || []).includes(cat)}
                      onChange={() => toggleApplicableCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </>
          )}

          {mainTab === 'nutrition' && (
            <>
              <div className="ao-section-note">
                Optional nutrition information per serving
              </div>
              <div className="ao-grid-2">
                <label>
                  Calories
                  <input type="number" step="0.001" value={draft.nutritionCalories ?? 0} onChange={(e) => updateField('nutritionCalories', e.target.value)} />
                </label>
                <label>
                  Protein (g)
                  <input type="number" step="0.001" value={draft.nutritionProtein ?? 0} onChange={(e) => updateField('nutritionProtein', e.target.value)} />
                </label>
              </div>
              <div className="ao-grid-2">
                <label>
                  Carbs (g)
                  <input type="number" step="0.001" value={draft.nutritionCarbs ?? 0} onChange={(e) => updateField('nutritionCarbs', e.target.value)} />
                </label>
                <label>
                  Fat (g)
                  <input type="number" step="0.001" value={draft.nutritionFat ?? 0} onChange={(e) => updateField('nutritionFat', e.target.value)} />
                </label>
              </div>
            </>
          )}

          <div className="ao-dialog-actions">
            <button type="button" className="ao-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ao-btn dark" disabled={saving}>{saving ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
