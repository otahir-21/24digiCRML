import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './FoodCategoriesPanel.css';

const CATEGORY_COLLECTIONS = [
  '24diet_productcategories',
  'productcategories',
  'food_categories',
  'shop_categories',
];

function pick(obj, keys, fallback = '') {
  for (const key of keys) {
    const value = key.includes('.')
      ? key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
      : obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function normalizeStatus(value) {
  const text = String(value || '').toLowerCase();
  if (['active', 'enabled', 'published', 'true', '1'].includes(text)) return 'Active';
  if (['inactive', 'disabled', 'draft', 'false', '0'].includes(text)) return 'Inactive';
  return 'Active';
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function FoodCategoriesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        CATEGORY_COLLECTIONS.map((name) =>
          getDocs(collection(db, name)).then((snap) => ({ name, docs: snap.docs }))
        )
      );

      const source = results.find((r) => r.status === 'fulfilled' && r.value.docs.length > 0)?.value
        || results.find((r) => r.status === 'fulfilled')?.value
        || { name: CATEGORY_COLLECTIONS[0], docs: [] };

      const mapped = source.docs.map((docSnap, idx) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          displayId: pick(data, ['id', 'category_id', 'cat_id'], idx + 1),
          nameEn: pick(data, ['name_en', 'english_name', 'name', 'title'], 'Unnamed'),
          nameAr: pick(data, ['name_ar', 'arabic_name', 'nameAr'], 'Not provided'),
          image: pick(data, ['image', 'image_url', 'thumbnail', 'icon'], ''),
          products: asNumber(pick(data, ['products_count', 'products', 'item_count'], 0), 0),
          status: normalizeStatus(pick(data, ['status', 'is_active', 'active'], 'active')),
          sourceCollection: source.name,
        };
      });

      setRows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load categories from Firebase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.nameEn).toLowerCase().includes(q)
      || String(r.nameAr).toLowerCase().includes(q)
      || String(r.displayId).toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="fc-root">
      <div className="fc-page-title">Food Categories</div>

      <div className="fc-card">
        <div className="fc-top">
          <h3>Food Categories</h3>
          <div className="fc-actions">
            <button type="button" className="fc-btn" onClick={load}>Refresh</button>
            <button type="button" className="fc-btn dark" title="UI only">Add Category</button>
          </div>
        </div>

        <div className="fc-search-row">
          <input
            className="fc-search"
            placeholder="Search food categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="fc-error">{error}</div>}
        {loading ? (
          <div className="fc-loading">Loading categories...</div>
        ) : (
          <div className="fc-table-wrap">
            <table className="fc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name (EN)</th>
                  <th>Name (AR)</th>
                  <th>Image</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.displayId}</td>
                    <td>{row.nameEn}</td>
                    <td>{row.nameAr}</td>
                    <td>
                      {row.image ? (
                        <img className="fc-thumb" src={row.image} alt={row.nameEn} />
                      ) : (
                        <span className="fc-no-image">-</span>
                      )}
                    </td>
                    <td>{row.products} products</td>
                    <td><span className="fc-status">{row.status}</span></td>
                    <td>
                      <span className="fc-action-icon">✎</span>
                      <span className="fc-action-icon">🗑</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="fc-empty">No categories found.</td>
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
