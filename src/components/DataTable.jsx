import { useState } from 'react';
import { formatValue, getTableColumns } from '../utils/formatters';
import EditImageModal from './EditImageModal';
import './Dashboard.css';

export default function DataTable({ data, collectionName, onUpdate }) {
  const [editingItem, setEditingItem] = useState(null);

  const columns = getTableColumns(data);
  const hasImageColumn = columns.some((c) => c.toLowerCase().includes('image'));

  if (!data?.length) return null;

  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              {hasImageColumn && collectionName && (
                <th className="th-actions">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="id-cell">{row.id}</td>
                {columns.map((col) => {
                  const raw = formatValue(row[col]);
                  const isLong = typeof raw === 'string' && raw.length > 80;
                  return (
                    <td key={col} className={isLong ? 'cell-truncate' : ''} title={isLong ? raw : undefined}>
                      {col.toLowerCase().includes('image') && row[col] ? (
                        <div className="cell-image">
                          <img src={row[col]} alt="" onError={(e) => e.target.style.display = 'none'} />
                          <span className="image-url-truncate">{raw}</span>
                        </div>
                      ) : isLong ? (
                        <span className="cell-text-truncate">{raw}</span>
                      ) : (
                        raw
                      )}
                    </td>
                  );
                })}
                {hasImageColumn && collectionName && (
                  <td className="td-actions">
                    <button
                      className="btn-edit-image"
                      onClick={() => setEditingItem(row)}
                      title="Update image"
                    >
                      Edit image
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <EditImageModal
          item={editingItem}
          collectionName={editingItem._collection || collectionName}
          onClose={() => setEditingItem(null)}
          onSaved={onUpdate}
        />
      )}
    </>
  );
}
