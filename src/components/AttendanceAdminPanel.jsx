import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import {
  CRM_ATTENDANCE_COLLECTION,
  CRM_ATTENDANCE_SETTINGS_DOC_ID,
  CRM_SETTINGS_COLLECTION,
  ATTENDANCE_TIMEZONE_LABEL,
} from '../constants';
import {
  dubaiCalendarDateKey,
  dubaiShiftDateKey,
  normalizeGraceMinutes,
  normalizeWorkdayStart,
} from '../utils/dubaiAttendance';
import './AttendanceAdminPanel.css';

const MAX_RANGE_DAYS = 93;

function formatTsDubai(ts) {
  if (!ts?.toDate) return '—';
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: ATTENDANCE_TIMEZONE_LABEL,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(ts.toDate());
}

function googleMapsPinUrl(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  return `https://www.google.com/maps?q=${la},${lo}&z=17`;
}

function LatLngMapLink({ lat, lng }) {
  const href = googleMapsPinUrl(lat, lng);
  if (!href) return '—';
  const la = Number(lat);
  const lo = Number(lng);
  const label = `${la.toFixed(5)}, ${lo.toFixed(5)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="aap-map-link" title="Open in Google Maps">
      {label}
    </a>
  );
}

function escapeCsv(s) {
  const t = String(s ?? '');
  if (/[,"\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export default function AttendanceAdminPanel() {
  const { user } = useAuth();

  const todayDubai = dubaiCalendarDateKey();
  const [dateFrom, setDateFrom] = useState(() => dubaiShiftDateKey(todayDubai, -29));
  const [dateTo, setDateTo] = useState(todayDubai);

  const [workStart, setWorkStart] = useState('09:00');
  const [grace, setGrace] = useState(15);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [rawRows, setRawRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const ref = doc(db, CRM_SETTINGS_COLLECTION, CRM_ATTENDANCE_SETTINGS_DOC_ID);
      const snap = await getDoc(ref);
      const d = snap.data() || {};
      setWorkStart(normalizeWorkdayStart(d.workdayStartDubai, '09:00'));
      setGrace(normalizeGraceMinutes(d.lateGraceMinutes, 15));
    } catch (e) {
      setSettingsMsg(e.message || 'Could not load settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    let from = dateFrom;
    let to = dateTo;
    if (from > to) {
      [from, to] = [to, from];
    }
    const fromParts = from.split('-').map(Number);
    const toParts = to.split('-').map(Number);
    const approxDays =
      (Date.UTC(toParts[0], toParts[1] - 1, toParts[2]) - Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2])) /
        (86400000) +
      1;
    if (approxDays > MAX_RANGE_DAYS) {
      setRowsError(`Choose a range of at most ${MAX_RANGE_DAYS} days.`);
      setRawRows([]);
      return;
    }

    setRowsLoading(true);
    setRowsError('');
    try {
      const q = query(
        collection(db, CRM_ATTENDANCE_COLLECTION),
        where('dateKey', '>=', from),
        where('dateKey', '<=', to),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRawRows(list);
    } catch (e) {
      setRowsError(e.message || 'Could not load attendance records.');
      setRawRows([]);
    } finally {
      setRowsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const rangeStats = useMemo(() => {
    const present = rawRows.filter((r) => r.checkInAt).length;
    const late = rawRows.filter((r) => r.checkInLate).length;
    const openCheckout = rawRows.filter((r) => r.checkInAt && !r.checkOutAt).length;
    const complete = rawRows.filter((r) => r.checkInAt && r.checkOutAt).length;
    return {
      records: rawRows.length,
      present,
      late,
      openCheckout,
      complete,
    };
  }, [rawRows]);

  const filteredSortedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rawRows;
    if (q) {
      list = list.filter((r) => {
        const name = String(r.fullName || '').toLowerCase();
        const em = String(r.email || '').toLowerCase();
        return name.includes(q) || em.includes(q);
      });
    }
    if (statusFilter === 'late') {
      list = list.filter((r) => r.checkInLate);
    } else if (statusFilter === 'open') {
      list = list.filter((r) => r.checkInAt && !r.checkOutAt);
    } else if (statusFilter === 'complete') {
      list = list.filter((r) => r.checkInAt && r.checkOutAt);
    } else if (statusFilter === 'ontime') {
      list = list.filter((r) => r.checkInAt && !r.checkInLate);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'email') {
        return String(a.email || '').localeCompare(String(b.email || ''));
      }
      if (sortBy === 'date') {
        return String(b.dateKey || '').localeCompare(String(a.dateKey || ''));
      }
      if (sortBy === 'checkin') {
        const ta = a.checkInAt?.toMillis?.() ?? 0;
        const tb = b.checkInAt?.toMillis?.() ?? 0;
        return ta - tb;
      }
      return String(a.fullName || '').localeCompare(String(b.fullName || ''));
    });
    return sorted;
  }, [rawRows, search, statusFilter, sortBy]);

  const exportCsv = () => {
    const headers = [
      'Date',
      'Employee',
      'Email',
      'Check-in (Dubai)',
      'Check-out (Dubai)',
      'Late',
      'In lat',
      'In lng',
      'Out lat',
      'Out lng',
    ];
    const lines = [headers.join(',')];
    for (const r of filteredSortedRows) {
      lines.push(
        [
          escapeCsv(r.dateKey),
          escapeCsv(r.fullName),
          escapeCsv(r.email),
          escapeCsv(formatTsDubai(r.checkInAt)),
          escapeCsv(r.checkOutAt ? formatTsDubai(r.checkOutAt) : ''),
          escapeCsv(r.checkInLate ? 'Yes' : 'No'),
          escapeCsv(r.checkInLat),
          escapeCsv(r.checkInLng),
          escapeCsv(r.checkOutLat),
          escapeCsv(r.checkOutLng),
        ].join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsMsg('');
    try {
      const ws = normalizeWorkdayStart(workStart, '09:00');
      const g = normalizeGraceMinutes(grace, 15);
      await setDoc(
        doc(db, CRM_SETTINGS_COLLECTION, CRM_ATTENDANCE_SETTINGS_DOC_ID),
        {
          workdayStartDubai: ws,
          lateGraceMinutes: g,
          timezone: ATTENDANCE_TIMEZONE_LABEL,
          updatedAt: serverTimestamp(),
          updatedByUid: user?.uid || null,
          updatedByEmail: user?.email || null,
        },
        { merge: true },
      );
      setWorkStart(ws);
      setGrace(g);
      setSettingsMsg('Saved. New rules apply to the next check-in.');
    } catch (err) {
      setSettingsMsg(err.message || 'Save failed.');
    }
  };

  const setQuickRange = (days) => {
    const end = dubaiCalendarDateKey();
    setDateTo(end);
    setDateFrom(dubaiShiftDateKey(end, -(days - 1)));
  };

  return (
    <div className="aap-root">
      <header className="aap-head">
        <h2 className="aap-title">Attendance</h2>
        <p className="aap-sub">
          Employee check-in/out (<strong>{ATTENDANCE_TIMEZONE_LABEL}</strong> · GPS required). Use the cards and filters
          below for a quick overview; export filtered rows to CSV for payroll or HR.
        </p>
      </header>

      <section className="aap-kpi-row" aria-label="Attendance summary for selected range">
        <div className="aap-kpi">
          <span className="aap-kpi-value">{rangeStats.records}</span>
          <span className="aap-kpi-label">Records in range</span>
        </div>
        <div className="aap-kpi aap-kpi--blue">
          <span className="aap-kpi-value">{rangeStats.present}</span>
          <span className="aap-kpi-label">With check-in</span>
        </div>
        <div className="aap-kpi aap-kpi--amber">
          <span className="aap-kpi-value">{rangeStats.late}</span>
          <span className="aap-kpi-label">Late check-in</span>
        </div>
        <div className="aap-kpi aap-kpi--violet">
          <span className="aap-kpi-value">{rangeStats.openCheckout}</span>
          <span className="aap-kpi-label">Missing check-out</span>
        </div>
        <div className="aap-kpi aap-kpi--green">
          <span className="aap-kpi-value">{rangeStats.complete}</span>
          <span className="aap-kpi-label">Day complete</span>
        </div>
      </section>

      <section className="aap-card">
        <h3 className="aap-h3">Rules ({ATTENDANCE_TIMEZONE_LABEL})</h3>
        {settingsLoading ? (
          <p className="aap-muted">Loading settings…</p>
        ) : (
          <form className="aap-form" onSubmit={saveSettings}>
            <label className="aap-label">
              Workday start (Dubai)
              <input
                className="aap-input"
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                required
              />
            </label>
            <label className="aap-label">
              Late grace (minutes after start)
              <input
                className="aap-input"
                type="number"
                min={0}
                max={720}
                value={grace}
                onChange={(e) => setGrace(parseInt(e.target.value, 10) || 0)}
              />
            </label>
            <button type="submit" className="aap-btn">
              Save rules
            </button>
            {settingsMsg && <p className="aap-form-msg">{settingsMsg}</p>}
          </form>
        )}
        <p className="aap-hint">
          Firestore: allow employees to create/update only their own <code>crm_attendance</code> doc, and to read{' '}
          <code>crm_settings/attendance</code>. Range queries on <code>dateKey</code> may require a composite index
          the first time you run them (Firebase console will show a link).
        </p>
      </section>

      <section className="aap-card">
        <div className="aap-toolbar aap-toolbar--wrap">
          <h3 className="aap-h3 aap-h3-inline">Records</h3>
          <div className="aap-quick-ranges">
            <button type="button" className="aap-chip" onClick={() => setQuickRange(1)}>
              Today
            </button>
            <button type="button" className="aap-chip" onClick={() => setQuickRange(7)}>
              7 days
            </button>
            <button type="button" className="aap-chip" onClick={() => setQuickRange(30)}>
              30 days
            </button>
          </div>
        </div>

        <div className="aap-filters">
          <label className="aap-date-label">
            From (Dubai)
            <input
              className="aap-input aap-input-date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="aap-date-label">
            To (Dubai)
            <input
              className="aap-input aap-input-date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          <button type="button" className="aap-btn-secondary" onClick={loadRows} disabled={rowsLoading}>
            Refresh
          </button>
        </div>

        <div className="aap-filters aap-filters--grow">
          <label className="aap-search-label">
            Search name / email
            <input
              className="aap-input aap-input-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter…"
            />
          </label>
          <label className="aap-date-label">
            Status
            <select
              className="aap-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="ontime">On time</option>
              <option value="late">Late</option>
              <option value="open">Missing check-out</option>
              <option value="complete">Complete day</option>
            </select>
          </label>
          <label className="aap-date-label">
            Sort
            <select className="aap-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Employee name</option>
              <option value="email">Email</option>
              <option value="date">Date (newest)</option>
              <option value="checkin">Check-in time</option>
            </select>
          </label>
          <button
            type="button"
            className="aap-btn-secondary"
            onClick={exportCsv}
            disabled={filteredSortedRows.length === 0}
          >
            Export CSV
          </button>
        </div>

        <p className="aap-table-meta">
          Showing <strong>{filteredSortedRows.length}</strong> of <strong>{rawRows.length}</strong> loaded records
        </p>

        {rowsError && <div className="aap-error">{rowsError}</div>}

        {rowsLoading ? (
          <p className="aap-muted">Loading…</p>
        ) : rawRows.length === 0 ? (
          <p className="aap-muted">No attendance in this date range.</p>
        ) : filteredSortedRows.length === 0 ? (
          <p className="aap-muted">No rows match your filters.</p>
        ) : (
          <div className="aap-table-wrap">
            <table className="aap-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Check-in</th>
                  <th>Out</th>
                  <th>Late</th>
                  <th>In lat/lng</th>
                  <th>Out lat/lng</th>
                </tr>
              </thead>
              <tbody>
                {filteredSortedRows.map((r) => (
                  <tr key={r.id}>
                    <td className="aap-mono">{r.dateKey || '—'}</td>
                    <td>{r.fullName || '—'}</td>
                    <td className="aap-mono">{r.email || '—'}</td>
                    <td>{formatTsDubai(r.checkInAt)}</td>
                    <td>{r.checkOutAt ? formatTsDubai(r.checkOutAt) : '—'}</td>
                    <td>{r.checkInLate ? 'Yes' : 'No'}</td>
                    <td className="aap-mono aap-ll">
                      <LatLngMapLink lat={r.checkInLat} lng={r.checkInLng} />
                    </td>
                    <td className="aap-mono aap-ll">
                      <LatLngMapLink lat={r.checkOutLat} lng={r.checkOutLng} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
