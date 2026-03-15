import { useState } from 'react';
import { addDocument } from '../hooks/useFirestore';
import './EditImageModal.css';

const FIELD_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'timestamp', label: 'Timestamp (server)' },
];

function parseValue(type, raw) {
  if (type === 'timestamp') return '__SERVER_TIMESTAMP__';
  if (type === 'number') return raw === '' ? 0 : Number(raw);
  if (type === 'boolean') return raw === 'true';
  return String(raw);
}

export default function AddDocumentModal({ collectionName, collectionDisplayName, onClose, onSaved }) {
  const [fields, setFields] = useState([{ name: '', type: 'string', value: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addField = () => setFields((f) => [...f, { name: '', type: 'string', value: '' }]);
  const removeField = (index) => setFields((f) => f.filter((_, i) => i !== index));
  const updateField = (index, key, value) => {
    setFields((f) => f.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
  };

  const handleSave = async () => {
    setError('');
    const data = {};
    for (const { name, type, value } of fields) {
      const trimmed = (name || '').trim();
      if (!trimmed) continue;
      data[trimmed] = parseValue(type, value);
    }
    if (Object.keys(data).length === 0) {
      setError('Add at least one field with a name.');
      return;
    }
    setSaving(true);
    try {
      await addDocument(collectionName, data);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content add-doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3>Add document — {collectionDisplayName}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-product-name">
            New document will be added to collection <strong>{collectionName}</strong>. Use Timestamp (server) for createdAt/updatedAt.
          </p>
          {fields.map((field, index) => (
            <div key={index} className="add-doc-row">
              <input
                type="text"
                placeholder="Field name"
                value={field.name}
                onChange={(e) => updateField(index, 'name', e.target.value)}
                className="add-doc-name"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(index, 'type', e.target.value)}
                className="add-doc-type"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {field.type === 'timestamp' ? (
                <span className="add-doc-hint">Server timestamp</span>
              ) : field.type === 'boolean' ? (
                <select
                  value={field.value}
                  onChange={(e) => updateField(index, 'value', e.target.value)}
                  className="add-doc-value"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => updateField(index, 'value', e.target.value)}
                  className="add-doc-value"
                />
              )}
              <button type="button" className="add-doc-remove" onClick={() => removeField(index)} title="Remove field">−</button>
            </div>
          ))}
          <button type="button" className="add-doc-add-field" onClick={addField}>+ Add field</button>
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Adding…' : 'Add document'}
          </button>
        </div>
      </div>
    </div>
  );
}
