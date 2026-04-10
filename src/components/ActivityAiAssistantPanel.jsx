import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseConfigError } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { addDocument } from '../hooks/useFirestore';
import {
  CRM_ACTIVITY_SELECTION_LOG_COLLECTION,
} from '../constants';
import {
  computeActivitySuggestion,
  formatLocalTime,
  LOOKBACK_DAYS,
  MIN_MANUAL_FOR_PREDICTION,
} from '../utils/activityAiSuggestions';
import './ActivityAiAssistantPanel.css';

const ACTIVITY_PRESETS = [
  { key: 'running', label: 'Running' },
  { key: 'walking', label: 'Walking' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'swimming', label: 'Swimming' },
  { key: 'gym', label: 'Gym' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'group_class', label: 'Group class' },
  { key: 'other', label: 'Other' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function ActivityAiAssistantPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [activityKey, setActivityKey] = useState('running');
  const [timeStr, setTimeStr] = useState('15:30');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (firebaseConfigError || !db || !user?.uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, CRM_ACTIVITY_SELECTION_LOG_COLLECTION),
        where('uid', '==', user.uid),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ma = a.createdAt?.toMillis?.() ?? 0;
        const mb = b.createdAt?.toMillis?.() ?? 0;
        return mb - ma;
      });
      setRows(list);
    } catch (e) {
      setError(e.message || 'Could not load activity history.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const suggestion = useMemo(() => computeActivitySuggestion(rows), [rows]);

  const logSelection = async (source, overrides = {}) => {
    if (!user?.uid) return;
    if (firebaseConfigError || !db) {
      setError('Firebase is not configured.');
      return;
    }
    const preset = ACTIVITY_PRESETS.find((p) => p.key === activityKey);
    const key = overrides.activityKey ?? activityKey;
    const label =
      overrides.activityLabel ?? (preset?.label || key);
    let hourLocal = null;
    let minuteLocal = null;
    const t = overrides.timeStr ?? timeStr;
    if (t && typeof t === 'string' && t.includes(':')) {
      const [h, m] = t.split(':').map((x) => parseInt(x, 10));
      if (Number.isFinite(h) && h >= 0 && h <= 23) hourLocal = h;
      if (Number.isFinite(m) && m >= 0 && m <= 59) minuteLocal = m;
    }
    setSaving(true);
    setError('');
    try {
      await addDocument(CRM_ACTIVITY_SELECTION_LOG_COLLECTION, {
        uid: user.uid,
        email: user.email || null,
        activityKey: key,
        activityLabel: label,
        hourLocal,
        minuteLocal,
        notes: notes.trim() || null,
        source: source === 'suggestion_applied' ? 'suggestion_applied' : 'manual',
        createdAt: 'SERVER_TIMESTAMP',
      });
      setNotes('');
      await load();
    } catch (e) {
      setError(e.message || 'Save failed. Check Firestore rules for crm_activity_selections.');
    } finally {
      setSaving(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion.ready) return;
    const h =
      typeof suggestion.suggestedHourLocal === 'number' ? suggestion.suggestedHourLocal : 15;
    const m =
      typeof suggestion.suggestedMinuteLocal === 'number' ? suggestion.suggestedMinuteLocal : 30;
    logSelection('suggestion_applied', {
      activityKey: suggestion.activityKey,
      activityLabel: suggestion.activityLabel,
      timeStr: `${pad2(h)}:${pad2(m)}`,
    });
  };

  if (firebaseConfigError || !db) {
    return (
      <div className="aia-root">
        <p className="aia-error">Connect Firebase (VITE_FIREBASE_*) to use the activity assistant.</p>
      </div>
    );
  }

  return (
    <div className="aia-root">
      <h2 className="aia-title">AI activity assistant</h2>
      <p className="aia-sub">
        Log what you (or a test user) plan to do manually. After the same activity is chosen{' '}
        <strong>{MIN_MANUAL_FOR_PREDICTION} times</strong> within {LOOKBACK_DAYS} days, this panel shows a pattern-based
        suggestion. This is phase 1 (on-device rules); you can later swap in a real model via your API.
      </p>

      {error ? <div className="aia-error">{error}</div> : null}

      {suggestion.ready ? (
        <div className="aia-card aia-card--accent">
          <h3>Suggested next activity</h3>
          <p className="aia-prediction-main">{suggestion.activityLabel}</p>
          <p className="aia-prediction-meta">
            Based on {suggestion.sameActivityPickCount} manual picks in the last {LOOKBACK_DAYS} days
            {typeof suggestion.suggestedHourLocal === 'number'
              ? ` · typical time ~ ${formatLocalTime(suggestion.suggestedHourLocal, suggestion.suggestedMinuteLocal)}`
              : ''}
            <span className="aia-badge aia-badge--sugg" style={{ marginLeft: 8 }}>
              {suggestion.engine}
            </span>
          </p>
          <div className="aia-actions">
            <button
              type="button"
              className="aia-btn aia-btn-primary"
              disabled={saving}
              onClick={applySuggestion}
            >
              Log this suggestion
            </button>
          </div>
        </div>
      ) : (
        <div className="aia-card">
          <h3>Not enough data yet</h3>
          <p className="aia-sub" style={{ marginBottom: 0 }}>
            Manual selections in window: <strong>{suggestion.countInWindow ?? 0}</strong> — need at least{' '}
            <strong>{suggestion.needed ?? MIN_MANUAL_FOR_PREDICTION}</strong> total, with the same activity
            appearing at least {MIN_MANUAL_FOR_PREDICTION} times in the last {LOOKBACK_DAYS} days to unlock suggestions.
          </p>
        </div>
      )}

      <div className="aia-card">
        <h3 style={{ color: '#0f172a', marginBottom: '0.75rem' }}>Log manual selection</h3>
        <div className="aia-form-grid">
          <div className="aia-field">
            <label htmlFor="aia-activity">Activity</label>
            <select
              id="aia-activity"
              value={activityKey}
              onChange={(e) => setActivityKey(e.target.value)}
            >
              {ACTIVITY_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="aia-field">
            <label htmlFor="aia-time">Preferred time (local)</label>
            <input
              id="aia-time"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </div>
        </div>
        <div className="aia-field" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="aia-notes">Notes (optional)</label>
          <input
            id="aia-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Big group run with Essa"
          />
        </div>
        <div className="aia-actions" style={{ marginTop: '0.85rem' }}>
          <button
            type="button"
            className="aia-btn aia-btn-primary"
            disabled={saving || loading}
            onClick={() => logSelection('manual')}
          >
            {saving ? 'Saving…' : 'Save manual pick'}
          </button>
          <button type="button" className="aia-btn" disabled={loading} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="aia-card">
        <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Recent log</h3>
        {loading ? (
          <p className="aia-sub">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="aia-sub">No rows yet. Add a few manual selections above.</p>
        ) : (
          <div className="aia-table-wrap">
            <table className="aia-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Activity</th>
                  <th>Time</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.createdAt?.toDate
                        ? r.createdAt.toDate().toLocaleString()
                        : '—'}
                    </td>
                    <td>{r.activityLabel || r.activityKey}</td>
                    <td>
                      {typeof r.hourLocal === 'number'
                        ? `${pad2(r.hourLocal)}:${pad2(typeof r.minuteLocal === 'number' ? r.minuteLocal : 0)}`
                        : '—'}
                    </td>
                    <td>
                      <span className="aia-badge">
                        {r.source === 'suggestion_applied' ? 'From suggestion' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="aia-hint">
        Firestore collection: <code>{CRM_ACTIVITY_SELECTION_LOG_COLLECTION}</code>. Add rules so authenticated
        users may create/read only documents where <code>uid</code> matches their auth id; admins may read all for
        reporting.
      </p>
    </div>
  );
}
