import { useState, useRef } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { parseExcelFile } from '../utils/excelParser';
import './ExcelUpload.css';

const BATCH_SIZE = 400; // Firestore limit is 500 per batch

export default function ExcelUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [collectionPrefix, setCollectionPrefix] = useState('24diet');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, sheet: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setError('');
    setSuccess('');
    setFile(selectedFile);

    try {
      const parsed = await parseExcelFile(selectedFile);
      setSheets(parsed);
    } catch (err) {
      setError(err.message || 'Failed to parse Excel file');
      setSheets([]);
    }
  };

  const uploadToFirestore = async () => {
    if (!sheets.length) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      let totalUploaded = 0;

      for (const sheet of sheets) {
        if (!sheet.data?.length) continue;

        const collectionName = collectionPrefix
          ? `${collectionPrefix}_${sheet.name}`
          : sheet.name;

        const colRef = collection(db, collectionName);

        for (let i = 0; i < sheet.data.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = sheet.data.slice(i, i + BATCH_SIZE);

          chunk.forEach((row, idx) => {
            const docRef = doc(colRef);
            const cleanRow = sanitizeForFirestore(row);
            batch.set(docRef, cleanRow);
          });

          await batch.commit();
          totalUploaded += chunk.length;

          setProgress({
            current: totalUploaded,
            total: sheets.reduce((sum, s) => sum + s.data.length, 0),
            sheet: collectionName,
          });
        }
      }

      const uploadedCollections = sheets
        .filter((s) => s.data?.length)
        .map((s) => (collectionPrefix ? `${collectionPrefix}_${s.name}` : s.name));

      setSuccess(`Uploaded ${totalUploaded} rows across ${sheets.length} sheet(s) to Firebase.`);
      onUploadComplete?.(uploadedCollections);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, sheet: '' });
    }
  };

  const sanitizeForFirestore = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = String(key).trim().replace(/\./g, '_') || 'field';
      if (value === null || value === undefined || value === '') continue;
      if (value instanceof Date) {
        result[cleanKey] = value.toISOString();
      } else if (typeof value === 'object') {
        result[cleanKey] = JSON.stringify(value);
      } else {
        result[cleanKey] = value;
      }
    }
    return result;
  };

  const reset = () => {
    setFile(null);
    setSheets([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalRows = sheets.reduce((sum, s) => sum + (s.data?.length || 0), 0);

  return (
    <div className="excel-upload">
      <h2>Upload Excel to Firebase</h2>
      <p className="upload-description">
        Upload your 24diet product Excel file. All tabs/sheets will be uploaded as separate collections.
      </p>

      <div
        className={`upload-zone ${file ? 'has-file' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="upload-input"
        />
        {file ? (
          <div>
            <strong>{file.name}</strong>
            <span>{sheets.length} sheet(s) · {totalRows} rows</span>
          </div>
        ) : (
          <div>
            <span className="upload-icon">📁</span>
            <span>Click or drag to select Excel file</span>
            <span className="upload-hint">.xlsx or .xls</span>
          </div>
        )}
      </div>

      {sheets.length > 0 && (
        <div className="upload-options">
          <div className="form-row">
            <label>Collection prefix (e.g. 24diet → 24diet_products)</label>
            <input
              type="text"
              value={collectionPrefix}
              onChange={(e) => setCollectionPrefix(e.target.value)}
              placeholder="24diet"
            />
          </div>

          <div className="sheets-preview">
            <h4>Sheets to upload:</h4>
            <ul>
              {sheets.map((s) => (
                <li key={s.name}>
                  {collectionPrefix ? `${collectionPrefix}_` : ''}{s.name} → {s.rowCount} rows
                </li>
              ))}
            </ul>
          </div>

          <div className="upload-actions">
            <button onClick={reset} className="btn-secondary" disabled={uploading}>
              Clear
            </button>
            <button
              onClick={uploadToFirestore}
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload to Firebase`}
            </button>
          </div>
        </div>
      )}

      {uploading && progress.total > 0 && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <span>{progress.current} / {progress.total} rows · {progress.sheet}</span>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}
      {success && <div className="upload-success">{success}</div>}
    </div>
  );
}
