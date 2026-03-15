import { useState, useEffect, useMemo } from 'react';
import { useFirestoreCollections, useCollectionData } from '../hooks/useFirestore';
import { useAllProductsData } from '../hooks/useAllProductsData';
import { getCollectionDisplayName, groupByModule, isModuleCollection } from '../utils/displayNames';
import { ALL_PRODUCTS_VIEW, FIRESTORE_MODULES, PRODUCTS_MODULE_NAME } from '../constants';
import DashboardHeader from './DashboardHeader';
import DataTable from './DataTable';
import ProductsView from './ProductsView';
import AddDocumentModal from './AddDocumentModal';
import FirestoreSetupHelp from './FirestoreSetupHelp';
import './Dashboard.css';

const DB_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

export default function Dashboard() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [setupHelpOpen, setSetupHelpOpen] = useState(false);
  const { collections, loading: collectionsLoading } = useFirestoreCollections();
  const isProductsView = selectedCollection === ALL_PRODUCTS_VIEW;
  const { data, loading: dataLoading, error, refetch } = useCollectionData(
    isProductsView ? null : selectedCollection
  );
  const productsData = useAllProductsData();

  const allCollections = collections;

  const { productModuleItems, crmGroups, otherLegacy } = useMemo(() => {
    const moduleCols = allCollections.filter(isModuleCollection);
    const moduleMap = groupByModule(moduleCols);
    const productModuleItems = (moduleMap[PRODUCTS_MODULE_NAME] || []);
    const inAnyCrmModule = new Set(FIRESTORE_MODULES.flatMap((m) => m.collections));
    const crmGroups = FIRESTORE_MODULES.map((mod) => ({
      ...mod,
      collections: mod.collections.filter((c) => allCollections.includes(c)),
    })).filter((g) => g.collections.length > 0);
    const is24diet = (c) => c.startsWith('24diet_');
    const otherLegacy = allCollections.filter(
      (c) => !inAnyCrmModule.has(c) && !is24diet(c) && c !== 'products'
    );
    return { productModuleItems, crmGroups, otherLegacy };
  }, [allCollections]);

  const hasProductsSection = productModuleItems.length > 0;

  useEffect(() => {
    if (selectedCollection) return;
    if (hasProductsSection) {
      setSelectedCollection(ALL_PRODUCTS_VIEW);
      setExpandedModules({ [PRODUCTS_MODULE_NAME]: true });
    } else if (allCollections.includes('users')) {
      setSelectedCollection('users');
    } else {
      const firstCrm = crmGroups[0]?.collections?.[0] || otherLegacy[0];
      if (firstCrm) setSelectedCollection(firstCrm);
    }
  }, [selectedCollection, hasProductsSection, allCollections, crmGroups, otherLegacy]);

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const loading = collectionsLoading || dataLoading;

  return (
    <div className="dashboard">
      <DashboardHeader />

      <main className="dashboard-main">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span>24Digi</span>
          </div>
          <nav className="sidebar-nav">
          {collectionsLoading ? (
            <p className="sidebar-loading">Loading...</p>
          ) : (
            <>
              {hasProductsSection && (
                <>
                  <h3 className="sidebar-section">Products</h3>
                  <ul className="collection-list">
                    <li className="module-group">
                      <button
                        className="module-header"
                        onClick={() => toggleModule(PRODUCTS_MODULE_NAME)}
                      >
                        <span className="module-chevron">
                          {expandedModules[PRODUCTS_MODULE_NAME] !== false ? '▼' : '▶'}
                        </span>
                        <span className="module-name">{PRODUCTS_MODULE_NAME}</span>
                      </button>
                      {expandedModules[PRODUCTS_MODULE_NAME] !== false && (
                        <ul className="module-items">
                          <li>
                            <button
                              className={`collection-btn ${selectedCollection === ALL_PRODUCTS_VIEW ? 'active' : ''}`}
                              onClick={() => setSelectedCollection(ALL_PRODUCTS_VIEW)}
                            >
                              <span className="nav-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                              </span>
                              All Products
                            </button>
                          </li>
                          {productModuleItems.map((item) => (
                            <li key={item.fullName}>
                              <button
                                className={`collection-btn ${selectedCollection === item.fullName ? 'active' : ''}`}
                                onClick={() => setSelectedCollection(item.fullName)}
                              >
                                <span className="nav-icon">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 7h-9" />
                                    <path d="M14 17H5" />
                                    <circle cx="17" cy="17" r="3" />
                                    <circle cx="7" cy="7" r="3" />
                                  </svg>
                                </span>
                                {item.display}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  </ul>
                </>
              )}
              {crmGroups.map((group) => (
                  <div key={group.id} className="module-group">
                    <h3 className="sidebar-section">{group.label}</h3>
                    <ul className="collection-list">
                      {group.collections.map((col) => (
                        <li key={col}>
                          <button
                            className={`collection-btn ${selectedCollection === col ? 'active' : ''}`}
                            onClick={() => setSelectedCollection(col)}
                          >
                            <span className="nav-icon">{DB_ICON}</span>
                            {getCollectionDisplayName(col)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
              ))}
              {otherLegacy.length > 0 && (
                <>
                  <h3 className="sidebar-section">Other</h3>
                  <ul className="collection-list">
                    {otherLegacy.map((col) => (
                      <li key={col}>
                        <button
                          className={`collection-btn ${selectedCollection === col ? 'active' : ''}`}
                          onClick={() => setSelectedCollection(col)}
                        >
                          <span className="nav-icon">{DB_ICON}</span>
                          {getCollectionDisplayName(col)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
          </nav>
          {allCollections.length === 0 && !collectionsLoading && (
            <p className="sidebar-empty">No collections found.</p>
          )}
          <div className="sidebar-footer">
            <button type="button" className="setup-help-btn" onClick={() => setSetupHelpOpen(true)}>
              Firestore setup & how to create
            </button>
          </div>
        </aside>

        <section className="content">
          {selectedCollection === ALL_PRODUCTS_VIEW ? (
            <>
              <div className="content-header">
                <div>
                  <h2>Products</h2>
                  <div className="content-stats">
                    <span className="content-stat">
                      Total: <strong>{(productsData.allData || []).length}</strong> products
                    </span>
                  </div>
                </div>
                <button onClick={productsData.refetch} className="refresh-btn">Refresh</button>
              </div>
              <ProductsView {...productsData} />
            </>
          ) : selectedCollection && (
            <>
              <div className="content-header">
                <div>
                  <h2>{getCollectionDisplayName(selectedCollection)}</h2>
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
                  <button onClick={refetch} className="refresh-btn">Refresh</button>
                </div>
              </div>

              {error && <div className="content-error">{error}</div>}

              {dataLoading ? (
                <div className="content-loading">Loading data...</div>
              ) : data.length === 0 ? (
                <div className="content-empty">
                  No documents in this collection.
                  <button type="button" className="add-doc-btn inline" onClick={() => setAddDocOpen(true)}>Add first document</button>
                </div>
              ) : (
                <DataTable
                  data={data}
                  collectionName={selectedCollection}
                  onUpdate={refetch}
                />
              )}

              {addDocOpen && (
                <AddDocumentModal
                  collectionName={selectedCollection}
                  collectionDisplayName={getCollectionDisplayName(selectedCollection)}
                  onClose={() => setAddDocOpen(false)}
                  onSaved={() => { setAddDocOpen(false); refetch(); }}
                />
              )}
            </>
          )}

          {setupHelpOpen && (
            <FirestoreSetupHelp
              collections={allCollections}
              onClose={() => setSetupHelpOpen(false)}
            />
          )}

          {!selectedCollection && !loading && (
            <div className="content-placeholder">
              <p>Select a collection from the sidebar to view your data.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
