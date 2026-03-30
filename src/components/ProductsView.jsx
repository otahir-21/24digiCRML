import { useState } from 'react';
import { DIET_TABS } from '../constants';
import DataTable from './DataTable';
import './ProductsView.css';

const hasMultipleSources = DIET_TABS.length > 1;

export default function ProductsView({ dataByTab, allData, loading, error, refetch }) {
  const [activeTab, setActiveTab] = useState(hasMultipleSources ? 'all' : (DIET_TABS[0]?.id ?? 'all'));

  const getDataForTab = () => {
    if (activeTab === 'all') return allData;
    return dataByTab[activeTab] || [];
  };

  const displayData = getDataForTab();

  const getCount = (tabId) => {
    if (tabId === 'all') return allData.length;
    return (dataByTab[tabId] || []).length;
  };

  return (
    <div className="products-view">
      {hasMultipleSources && (
        <div className="products-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Products
            <span className="tab-count">({getCount('all')})</span>
          </button>
          {DIET_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="tab-count">({getCount(tab.id)})</span>
            </button>
          ))}
        </div>
      )}

      <div className="products-content">
        {error && <div className="content-error">{error}</div>}

        {loading ? (
          <div className="content-loading">Loading products...</div>
        ) : displayData.length === 0 ? (
          <div className="content-empty">
            No products in this category.
          </div>
        ) : (
          <DataTable
            data={displayData}
            collectionName={DIET_TABS.find((t) => t.id === activeTab)?.collection || '24diet_products'}
            onUpdate={refetch}
          />
        )}
      </div>
    </div>
  );
}
