import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ProductsPanel.css';

const PRODUCT_COLLECTIONS = ['24diet_products', 'products', 'shop_products'];
const CATEGORY_COLLECTIONS = ['24diet_productcategories', 'productcategories', 'food_categories', 'shop_categories'];

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

function toMoney(value) {
  const n = asNumber(value, 0);
  return `AED ${n.toFixed(2)}`;
}

function normalizeKey(text) {
  return String(text || '').trim().toLowerCase();
}

export default function ProductsPanel() {
  const [rows, setRows] = useState([]);
  const [categoriesById, setCategoriesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('all');
  const [editingRow, setEditingRow] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const productResults = await Promise.allSettled(
        PRODUCT_COLLECTIONS.map((name) => getDocs(collection(db, name)).then((snap) => ({ name, docs: snap.docs })))
      );
      const categoryResults = await Promise.allSettled(
        CATEGORY_COLLECTIONS.map((name) => getDocs(collection(db, name)).then((snap) => ({ name, docs: snap.docs })))
      );

      const productSource = productResults.find((r) => r.status === 'fulfilled' && r.value.docs.length > 0)?.value
        || productResults.find((r) => r.status === 'fulfilled')?.value
        || { docs: [] };
      const categorySource = categoryResults.find((r) => r.status === 'fulfilled' && r.value.docs.length > 0)?.value
        || categoryResults.find((r) => r.status === 'fulfilled')?.value
        || { docs: [] };

      const categoryMap = {};
      categorySource.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const cid = String(pick(data, ['id', 'category_id', 'cat_id'], docSnap.id));
        const cname = String(pick(data, ['name_en', 'name', 'title'], cid));
        categoryMap[cid] = cname;
        categoryMap[docSnap.id] = cname;
      });
      setCategoriesById(categoryMap);

      const mapped = productSource.docs.map((docSnap, idx) => {
        const data = docSnap.data();
        const categoryRef = String(pick(data, ['category_id', 'categoryId', 'category', 'cat_id'], ''));
        const foodCategory = String(
          pick(
            data,
            ['food_category', 'foodCategory', 'category_name', 'sub_category', 'subcategory'],
            categoryMap[categoryRef] || 'Uncategorized'
          )
        );
        return {
          id: docSnap.id,
          sourceCollection: productSource.name,
          displayId: pick(data, ['id', 'product_id', 'sku'], idx + 1),
          nameEn: String(pick(data, ['name_en', 'name', 'title'], 'Unnamed Product')),
          nameAr: String(pick(data, ['name_ar', 'arabic_name'], 'Not provided')),
          descriptionEn: String(pick(data, ['description_en', 'description', 'desc'], '')),
          image: String(pick(data, ['image', 'image_url', 'thumbnail'], '')),
          price: toMoney(pick(data, ['price', 'amount', 'cost'], 0)),
          priceRaw: asNumber(pick(data, ['price', 'amount', 'cost'], 0), 0),
          basePriceRaw: asNumber(pick(data, ['base_price', 'basePrice'], 0), 0),
          category: String(pick(data, ['type', 'category_type', 'product_type'], 'Food')),
          foodCategory,
          status: normalizeStatus(pick(data, ['status', 'is_active', 'active'], 'active')),
          customizable: Boolean(pick(data, ['customizable', 'is_customizable'], false)) ? 'Yes' : 'No',
          hasAddons: Boolean(pick(data, ['has_addons', 'hasAddons'], false)),
          mealComponents: Array.isArray(pick(data, ['meal_components'], []))
            ? pick(data, ['meal_components'], [])
            : [],
        };
      });

      setRows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load products from Firebase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set(rows.map((r) => normalizeKey(r.category)).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  const foodCategoryOptions = useMemo(() => {
    const set = new Set(rows.map((r) => normalizeKey(r.foodCategory)).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && normalizeKey(r.category) !== categoryFilter) return false;
      if (foodCategoryFilter !== 'all' && normalizeKey(r.foodCategory) !== foodCategoryFilter) return false;
      if (!q) return true;
      return (
        r.nameEn.toLowerCase().includes(q)
        || r.nameAr.toLowerCase().includes(q)
        || String(r.displayId).toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoryFilter, foodCategoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, foodCategoryFilter, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  const saveEdit = async (next) => {
    const ref = doc(db, next.sourceCollection, next.id);
    const isActive = String(next.status || '').toLowerCase() === 'active';
    const payload = {
      name_en: next.nameEn,
      name: next.nameEn,
      name_ar: next.nameAr,
      description_en: next.descriptionEn || '',
      description: next.descriptionEn || '',
      price: asNumber(next.priceRaw, 0),
      base_price: asNumber(next.basePriceRaw, 0),
      category_type: next.category,
      food_category: next.foodCategory,
      image: next.image || '',
      image_url: next.image || '',
      status: next.status,
      active: isActive,
      is_active: isActive,
      customizable: next.customizable === 'Yes',
      is_customizable: next.customizable === 'Yes',
      has_addons: !!next.hasAddons,
      meal_components: next.mealComponents || [],
    };
    await updateDoc(ref, payload);
    await load();
  };

  const toggleProductStatus = async (row) => {
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

  return (
    <div className="pp-root">
      <div className="pp-page-title">Products</div>

      <div className="pp-card">
        <div className="pp-filter-row">
          <div className="pp-filter-block">
            <label>Filter by Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All Categories' : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="pp-filter-block">
            <label>Filter by Food Category</label>
            <select value={foodCategoryFilter} onChange={(e) => setFoodCategoryFilter(e.target.value)}>
              {foodCategoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All food categories' : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="pp-actions">
            <button type="button" className="pp-btn" onClick={load}>Refresh</button>
            <button type="button" className="pp-btn dark" title="UI only">Add Product</button>
          </div>
        </div>

        <div className="pp-search-row">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="pp-error">{error}</div>}
        {loading ? (
          <div className="pp-loading">Loading products...</div>
        ) : (
          <>
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name (EN)</th>
                    <th>Name (AR)</th>
                    <th>Image</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Food Category</th>
                    <th>Status</th>
                    <th>Customizable</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.displayId}</td>
                      <td>{row.nameEn}</td>
                      <td>{row.nameAr}</td>
                      <td>{row.image ? <img className="pp-thumb" src={row.image} alt={row.nameEn} /> : '-'}</td>
                      <td>{row.price}</td>
                      <td>{row.category}</td>
                      <td>{row.foodCategory}</td>
                      <td><span className="pp-status">{row.status}</span></td>
                      <td>{row.customizable}</td>
                      <td>
                        <button
                          type="button"
                          className={`pp-toggle-btn ${row.status === 'Active' ? 'disable' : 'enable'}`}
                          onClick={() => toggleProductStatus(row)}
                        >
                          {row.status === 'Active' ? 'Disable' : 'Active'}
                        </button>
                        <button type="button" className="pp-action-icon" onClick={() => setEditingRow(row)} title="Edit">
                          ✎
                        </button>
                        <span className="pp-action-icon" title="Delete (coming soon)">🗑</span>
                      </td>
                    </tr>
                  ))}
                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="pp-empty">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pp-footer">
              <span>
                Showing {(filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1)} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} results
              </span>
              <div className="pp-pagination">
                <button type="button" onClick={goFirst} disabled={currentPage === 1}>«</button>
                <button type="button" onClick={goPrev} disabled={currentPage === 1}>‹</button>
                <span className="pp-page-indicator">{currentPage} / {totalPages}</span>
                <button type="button" onClick={goNext} disabled={currentPage === totalPages}>›</button>
                <button type="button" onClick={goLast} disabled={currentPage === totalPages}>»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {editingRow && (
        <EditProductDialog
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={async (next) => {
            await saveEdit(next);
            setEditingRow(null);
          }}
          categoryOptions={categoryOptions}
          foodCategoryOptions={foodCategoryOptions}
        />
      )}
    </div>
  );
}

function EditProductDialog({ row, onClose, onSave, categoryOptions, foodCategoryOptions }) {
  const [draft, setDraft] = useState({
    ...row,
    status: row.status || 'Active',
    category: row.category || 'Food',
    foodCategory: row.foodCategory || '',
    customizable: row.customizable || 'No',
    hasAddons: !!row.hasAddons,
    mealComponents: row.mealComponents?.length ? row.mealComponents : [{
      title: 'Component 1',
      ingredient_type: 'Protein',
      base_weight: 100,
      min_weight: 100,
      max_weight: 250,
      step_size: 50,
      base_price: 5,
      step_price: 7,
      first_increment_free: false,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    }],
  });
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState('en');

  const updateField = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const updateComponent = (index, patch) => {
    setDraft((p) => {
      const next = [...(p.mealComponents || [])];
      next[index] = { ...next[index], ...patch };
      return { ...p, mealComponents: next };
    });
  };

  const removeComponent = (index) => {
    setDraft((p) => {
      const next = [...(p.mealComponents || [])];
      next.splice(index, 1);
      return { ...p, mealComponents: next };
    });
  };

  const addComponent = () => {
    setDraft((p) => ({
      ...p,
      mealComponents: [
        ...(p.mealComponents || []),
        {
          title: `Component ${(p.mealComponents?.length || 0) + 1}`,
          ingredient_type: 'Protein',
          base_weight: 100,
          min_weight: 100,
          max_weight: 250,
          step_size: 50,
          base_price: 0,
          step_price: 0,
          first_increment_free: false,
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        },
      ],
    }));
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
    <div className="pp-dialog-overlay" onClick={onClose}>
      <div className="pp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pp-dialog-header">
          <div>
            <h3>Edit Product</h3>
            <p>Update the product details.</p>
          </div>
          <button type="button" className="pp-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="pp-dialog-form">
          <div className="pp-lang-switch">
            <button type="button" className={activeLang === 'en' ? 'active' : ''} onClick={() => setActiveLang('en')}>
              English
            </button>
            <button type="button" className={activeLang === 'ar' ? 'active' : ''} onClick={() => setActiveLang('ar')}>
              Arabic
            </button>
          </div>

          <div className="pp-grid-2">
            <label>
              Name (English)
              <input value={draft.nameEn} onChange={(e) => updateField('nameEn', e.target.value)} />
            </label>
            <label>
              Name (Arabic)
              <input value={draft.nameAr} onChange={(e) => updateField('nameAr', e.target.value)} />
            </label>
          </div>

          <label>
            Description (English)
            <textarea value={draft.descriptionEn} onChange={(e) => updateField('descriptionEn', e.target.value)} rows={3} />
          </label>

          <div className="pp-grid-2">
            <label>
              Price (AED)
              <input type="number" value={draft.priceRaw} onChange={(e) => updateField('priceRaw', e.target.value)} />
            </label>
            <label>
              Base Price (AED) (if customizable)
              <input type="number" value={draft.basePriceRaw} onChange={(e) => updateField('basePriceRaw', e.target.value)} />
            </label>
          </div>

          <div className="pp-grid-2">
            <label>
              Product Category
              <select value={normalizeKey(draft.category)} onChange={(e) => updateField('category', e.target.value)}>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All Categories' : opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Food Category (Optional)
              <select value={normalizeKey(draft.foodCategory)} onChange={(e) => updateField('foodCategory', e.target.value)}>
                {foodCategoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All food categories' : opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Product Image (URL)
            <input value={draft.image} onChange={(e) => updateField('image', e.target.value)} />
          </label>
          {draft.image && (
            <div className="pp-image-preview-wrap">
              <img src={draft.image} alt="product preview" className="pp-image-preview" />
              <button type="button" className="pp-remove-image" onClick={() => updateField('image', '')}>✕</button>
            </div>
          )}

          <div className="pp-check-row">
            <label><input type="checkbox" checked={draft.status === 'Active'} onChange={(e) => updateField('status', e.target.checked ? 'Active' : 'Inactive')} /> Active</label>
            <label><input type="checkbox" checked={draft.customizable === 'Yes'} onChange={(e) => updateField('customizable', e.target.checked ? 'Yes' : 'No')} /> Has Customizable Components</label>
            <label><input type="checkbox" checked={draft.hasAddons} onChange={(e) => updateField('hasAddons', e.target.checked)} /> Has Add-Ons</label>
          </div>

          <div className="pp-components">
            <div className="pp-components-header">
              <h4>Meal Components</h4>
              <button type="button" className="pp-btn dark" onClick={addComponent}>+ Add Component</button>
            </div>

            {(draft.mealComponents || []).map((comp, idx) => (
              <div key={idx} className="pp-component-card">
                <div className="pp-component-top">
                  <strong>Component {idx + 1}</strong>
                  <button type="button" className="pp-btn" onClick={() => removeComponent(idx)}>Remove</button>
                </div>

                <div className="pp-grid-2">
                  <label>
                    Title
                    <input value={comp.title || ''} onChange={(e) => updateComponent(idx, { title: e.target.value })} />
                  </label>
                  <label>
                    Ingredient Type
                    <input value={comp.ingredient_type || ''} onChange={(e) => updateComponent(idx, { ingredient_type: e.target.value })} />
                  </label>
                </div>

                <div className="pp-grid-4">
                  <label>Base Weight<input type="number" value={comp.base_weight || 0} onChange={(e) => updateComponent(idx, { base_weight: Number(e.target.value) })} /></label>
                  <label>Minimum Weight<input type="number" value={comp.min_weight || 0} onChange={(e) => updateComponent(idx, { min_weight: Number(e.target.value) })} /></label>
                  <label>Maximum Weight<input type="number" value={comp.max_weight || 0} onChange={(e) => updateComponent(idx, { max_weight: Number(e.target.value) })} /></label>
                  <label>Step Size<input type="number" value={comp.step_size || 0} onChange={(e) => updateComponent(idx, { step_size: Number(e.target.value) })} /></label>
                </div>
              </div>
            ))}
          </div>

          <div className="pp-dialog-actions">
            <button type="button" className="pp-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="pp-btn dark" disabled={saving}>{saving ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
