import { useCallback, useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import {
  attendanceDocId,
  CRM_ATTENDANCE_COLLECTION,
  CRM_ATTENDANCE_SETTINGS_DOC_ID,
  CRM_SETTINGS_COLLECTION,
  ATTENDANCE_TIMEZONE_LABEL,
} from '../constants';
import {
  dubaiCalendarDateKey,
  dubaiDateKeysInclusiveRange,
  dubaiShiftDateKey,
  isCheckInLate,
  normalizeGraceMinutes,
  normalizeWorkdayStart,
} from '../utils/dubaiAttendance';
import './EmployeeAttendancePanel.css';

function requestGeoPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('This device does not support location. Attendance requires location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? null,
        });
      },
      (err) => {
        const code = err?.code;
        let msg = 'Location is required to mark attendance. Enable location services and try again.';
        if (code === 1) msg = 'Location permission denied. Allow location for this site to mark attendance.';
        else if (code === 2) msg = 'Location unavailable. Move to an area with GPS/Wi‑Fi and try again.';
        else if (code === 3) msg = 'Location request timed out. Try again.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
    );
  });
}

function formatTsDubai(ts) {
  if (!ts?.toDate) return '—';
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: ATTENDANCE_TIMEZONE_LABEL,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts.toDate());
}

function formatHistoryTs(ts) {
  if (!ts?.toDate) return '—';
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: ATTENDANCE_TIMEZONE_LABEL,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts.toDate());
}

function employeeHistoryStatus(row, todayKey) {
  if (row.empty) {
    return { label: 'No record', cls: 'eap-chip eap-chip--absent' };
  }
  const hasIn = row.checkInAt;
  const hasOut = row.checkOutAt;
  if (hasIn && hasOut) {
    return row.checkInLate
      ? { label: 'Late', cls: 'eap-chip eap-chip--late' }
      : { label: 'On time', cls: 'eap-chip eap-chip--ok' };
  }
  if (hasIn && !hasOut) {
    if (row.dateKey === todayKey) {
      return { label: 'Awaiting check-out', cls: 'eap-chip eap-chip--open' };
    }
    return { label: 'Missing check-out', cls: 'eap-chip eap-chip--warn' };
  }
  return { label: '—', cls: 'eap-chip eap-chip--absent' };
}

function todayTimelineLabel(record) {
  if (!record?.checkInAt) {
    return { text: 'Not checked in yet today', tone: 'muted' };
  }
  if (!record?.checkOutAt) {
    return {
      text: record.checkInLate
        ? 'Checked in (late) — remember to check out'
        : 'Checked in on time — check out when you leave',
      tone: record.checkInLate ? 'late' : 'ok',
    };
  }
  return {
    text: record.checkInLate ? 'Day complete (late arrival)' : 'Day complete',
    tone: record.checkInLate ? 'late' : 'ok',
  };
}

export default function EmployeeAttendancePanel({ slug }) {
  const { user } = useAuth();
  const displaySlug = slug ? decodeURIComponent(slug) : '';

  const [dateKey, setDateKey] = useState(() => dubaiCalendarDateKey());
  const [settings, setSettings] = useState({
    workdayStartDubai: '09:00',
    lateGraceMinutes: 15,
  });
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    const today = dubaiCalendarDateKey();
    const start = dubaiShiftDateKey(today, -29);
    const keysAsc = dubaiDateKeysInclusiveRange(start, today);
    const keys = [...keysAsc].reverse();
    setHistoryLoading(true);
    try {
      const snaps = await Promise.all(
        keys.map((dk) => getDoc(doc(db, CRM_ATTENDANCE_COLLECTION, attendanceDocId(user.uid, dk)))),
      );
      const rows = keys.map((dk, i) => {
        const s = snaps[i];
        if (!s.exists()) {
          return { dateKey: dk, empty: true };
        }
        return { dateKey: dk, empty: false, ...s.data() };
      });
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  const loadDay = useCallback(async () => {
    if (!user?.uid) return;
    const dk = dubaiCalendarDateKey();
    setDateKey(dk);
    setLoading(true);
    setError('');
    try {
      const settingsRef = doc(db, CRM_SETTINGS_COLLECTION, CRM_ATTENDANCE_SETTINGS_DOC_ID);
      const settingsSnap = await getDoc(settingsRef);
      const s = settingsSnap.data() || {};
      setSettings({
        workdayStartDubai: normalizeWorkdayStart(s.workdayStartDubai, '09:00'),
        lateGraceMinutes: normalizeGraceMinutes(s.lateGraceMinutes, 15),
      });

      const attRef = doc(db, CRM_ATTENDANCE_COLLECTION, attendanceDocId(user.uid, dk));
      const attSnap = await getDoc(attRef);
      setRecord(attSnap.exists() ? { id: attSnap.id, ...attSnap.data() } : null);
    } catch (e) {
      setError(e.message || 'Could not load attendance.');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onCheckIn = async () => {
    if (!user?.uid || !user?.email) return;
    setBusy(true);
    setError('');
    try {
      let geo;
      try {
        geo = await requestGeoPosition();
      } catch (geoErr) {
        throw geoErr;
      }

      const dk = dubaiCalendarDateKey();
      const now = Timestamp.now();
      const ms = now.toMillis();
      const late = isCheckInLate(ms, dk, settings.workdayStartDubai, settings.lateGraceMinutes);

      const docId = attendanceDocId(user.uid, dk);
      const ref = doc(db, CRM_ATTENDANCE_COLLECTION, docId);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.checkInAt) {
            throw new Error('You have already checked in today. Times cannot be edited.');
          }
        }
        tx.set(ref, {
          uid: user.uid,
          email: user.email.toLowerCase(),
          fullName: user.displayName || user.email.split('@')[0],
          portalSlug: displaySlug,
          dateKey: dk,
          timezone: ATTENDANCE_TIMEZONE_LABEL,
          checkInAt: now,
          checkOutAt: null,
          checkInLat: geo.latitude,
          checkInLng: geo.longitude,
          checkInAccuracyM: geo.accuracyM,
          checkOutLat: null,
          checkOutLng: null,
          checkOutAccuracyM: null,
          checkInLate: late,
          workdayStartUsed: settings.workdayStartDubai,
          lateGraceMinutesUsed: settings.lateGraceMinutes,
          createdAt: serverTimestamp(),
        });
      });

      await loadDay();
      await loadHistory();
    } catch (e) {
      setError(e.message || 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const onCheckOut = async () => {
    if (!user?.uid) return;
    setBusy(true);
    setError('');
    try {
      let geo;
      try {
        geo = await requestGeoPosition();
      } catch (geoErr) {
        throw geoErr;
      }

      const dk = dubaiCalendarDateKey();
      const now = Timestamp.now();
      const docId = attendanceDocId(user.uid, dk);
      const ref = doc(db, CRM_ATTENDANCE_COLLECTION, docId);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          throw new Error('Check in first before checking out.');
        }
        const d = snap.data();
        if (!d.checkInAt) {
          throw new Error('Check in first before checking out.');
        }
        if (d.checkOutAt) {
          throw new Error('You have already checked out today. Times cannot be edited.');
        }
        tx.update(ref, {
          checkOutAt: now,
          checkOutLat: geo.latitude,
          checkOutLng: geo.longitude,
          checkOutAccuracyM: geo.accuracyM,
          updatedAt: serverTimestamp(),
        });
      });

      await loadDay();
      await loadHistory();
    } catch (e) {
      setError(e.message || 'Check-out failed.');
    } finally {
      setBusy(false);
    }
  };

  const hasIn = Boolean(record?.checkInAt);
  const hasOut = Boolean(record?.checkOutAt);
  const timeline = todayTimelineLabel(record);

  return (
    <div className="eap-root">
      <header className="eap-head">
        <h2 className="eap-title">Attendance</h2>
        <p className="eap-sub">
          All times use <strong>{ATTENDANCE_TIMEZONE_LABEL}</strong> (UAE / Dubai). One check-in and one check-out per
          day. Location must be on for each action; coordinates are stored for verification.
        </p>
      </header>

      <div className="eap-meta">
        <span className="eap-meta-label">Working day (Dubai)</span>
        <span className="eap-meta-value">{dateKey}</span>
        <span className="eap-meta-hint">
          Office start {settings.workdayStartDubai} Dubai · On time if you check in by{' '}
          {settings.workdayStartDubai} + {settings.lateGraceMinutes} min grace
        </span>
      </div>

      {!loading && (
        <div className={`eap-timeline eap-timeline--${timeline.tone}`}>
          <span className="eap-timeline-label">Today</span>
          <p className="eap-timeline-text">{timeline.text}</p>
        </div>
      )}

      {error && <div className="eap-error">{error}</div>}

      {loading ? (
        <p className="eap-muted">Loading…</p>
      ) : (
        <div className="eap-card">
          {!hasIn && (
            <>
              <p className="eap-step">You have not checked in today.</p>
              <button type="button" className="eap-btn eap-btn-primary" disabled={busy} onClick={onCheckIn}>
                {busy ? 'Getting location…' : 'Check in'}
              </button>
            </>
          )}

          {hasIn && !hasOut && (
            <>
              <div className="eap-row">
                <span className="eap-k">Check-in</span>
                <span className="eap-v">{formatTsDubai(record.checkInAt)}</span>
                {record.checkInLate ? <span className="eap-badge eap-badge-late">Late</span> : <span className="eap-badge eap-badge-ok">On time</span>}
              </div>
              <p className="eap-coords">
                In: {Number(record.checkInLat).toFixed(5)}, {Number(record.checkInLng).toFixed(5)}
                {record.checkInAccuracyM != null ? ` (±${Math.round(record.checkInAccuracyM)} m)` : ''}
              </p>
              <p className="eap-step">Check out when your shift ends.</p>
              <button type="button" className="eap-btn eap-btn-secondary" disabled={busy} onClick={onCheckOut}>
                {busy ? 'Getting location…' : 'Check out'}
              </button>
            </>
          )}

          {hasIn && hasOut && (
            <>
              <p className="eap-done">Day complete. Times cannot be changed.</p>
              <div className="eap-row">
                <span className="eap-k">Check-in</span>
                <span className="eap-v">{formatTsDubai(record.checkInAt)}</span>
                {record.checkInLate ? <span className="eap-badge eap-badge-late">Late</span> : <span className="eap-badge eap-badge-ok">On time</span>}
              </div>
              <div className="eap-row">
                <span className="eap-k">Check-out</span>
                <span className="eap-v">{formatTsDubai(record.checkOutAt)}</span>
              </div>
              <p className="eap-coords">
                In: {Number(record.checkInLat).toFixed(5)}, {Number(record.checkInLng).toFixed(5)}
                {record.checkInAccuracyM != null ? ` (±${Math.round(record.checkInAccuracyM)} m)` : ''}
                <br />
                Out: {Number(record.checkOutLat).toFixed(5)}, {Number(record.checkOutLng).toFixed(5)}
                {record.checkOutAccuracyM != null ? ` (±${Math.round(record.checkOutAccuracyM)} m)` : ''}
              </p>
            </>
          )}
        </div>
      )}

      <p className="eap-foot">
        Check-in/out cannot be edited after submission. Contact HR if something is wrong.
      </p>

      <section className="eap-history" aria-labelledby="eap-history-title">
        <div className="eap-history-head">
          <h3 id="eap-history-title" className="eap-history-title">
            Last 30 days (Dubai)
          </h3>
          <button type="button" className="eap-btn-ghost" disabled={historyLoading} onClick={loadHistory}>
            {historyLoading ? 'Refreshing…' : 'Refresh history'}
          </button>
        </div>
        <p className="eap-history-sub">Newest first. Past days without a check-out are flagged for review.</p>
        {historyLoading && !historyRows.length ? (
          <p className="eap-muted">Loading history…</p>
        ) : (
          <div className="eap-history-table-wrap">
            <table className="eap-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => {
                  const st = employeeHistoryStatus(row, dubaiCalendarDateKey());
                  return (
                    <tr key={row.dateKey}>
                      <td className="eap-mono">{row.dateKey}</td>
                      <td>
                        <span className={st.cls}>{st.label}</span>
                      </td>
                      <td>{row.empty ? '—' : formatHistoryTs(row.checkInAt)}</td>
                      <td>
                        {row.empty ? '—' : row.checkOutAt ? formatHistoryTs(row.checkOutAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
