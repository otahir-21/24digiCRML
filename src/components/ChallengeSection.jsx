/**
 * ChallengeSection – Full 24 Competition CRM
 * Sections: Overview | Competitions | Rooms | Leaderboard | Sponsors | App Config
 */
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  useCollectionData,
  useSubcollectionData,
  updateDocument,
  setDocumentFields,
  getDocument,
} from '../hooks/useFirestore';
import './ChallengeSection.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDateShort(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAED(n) {
  if (n === undefined || n === null || n === '') return '—';
  return `AED ${Number(n).toLocaleString()}`;
}
function fmtPts(n) {
  return n !== undefined && n !== null ? `${Number(n).toLocaleString()} pts` : '—';
}

const COMP_STATUSES   = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const ROOM_STATUSES   = ['LOBBY', 'ACTIVE', 'ENDED'];
const SPONSOR_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CONTACTED'];

const STATUS_COLOR = {
  UPCOMING:  { color: '#3b82f6', bg: '#eff6ff' },
  LIVE:      { color: '#10b981', bg: '#ecfdf5' }, // kept for backward compat
  ACTIVE:    { color: '#10b981', bg: '#ecfdf5' },
  COMPLETED: { color: '#8b5cf6', bg: '#f5f3ff' },
  ENDED:     { color: '#94a3b8', bg: '#f1f5f9' },
  LOBBY:     { color: '#f59e0b', bg: '#fffbeb' },
  CANCELLED: { color: '#ef4444', bg: '#fef2f2' },
  PENDING:   { color: '#f59e0b', bg: '#fffbeb' },
  APPROVED:  { color: '#10b981', bg: '#ecfdf5' },
  REJECTED:  { color: '#ef4444', bg: '#fef2f2' },
  CONTACTED: { color: '#3b82f6', bg: '#eff6ff' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_COLOR[(status || '').toUpperCase()] || { color: '#64748b', bg: '#f1f5f9' };
  return (
    <span className="cs-badge" style={{ background: cfg.bg, color: cfg.color }}>
      {status || '—'}
    </span>
  );
}

function StatusSelect({ value, options, onSave, disabled }) {
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_COLOR[(value || '').toUpperCase()] || { color: '#64748b' };

  async function handleChange(e) {
    const next = e.target.value;
    if (next === value || saving) return;
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <select
        className="cs-status-select"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || saving}
        style={{ borderColor: cfg.color, color: cfg.color }}
      >
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {saving && <span className="cs-saving">Saving…</span>}
    </div>
  );
}

// ─── Shared table wrapper ────────────────────────────────────────────────────
function CSTable({ columns, rows, emptyMsg = 'No records.' }) {
  if (!rows.length) return <div className="cs-empty">{emptyMsg}</div>;
  return (
    <div className="cs-table-wrap">
      <table className="cs-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key || c.label}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => (
                <td key={c.key || c.label}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function ChallengeOverview() {
  const [stats, setStats] = useState({
    totalComps: 0, upcoming: 0, live: 0, completed: 0,
    totalRooms: 0, activeRooms: 0,
    pendingSponsors: 0,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const targets = ['competitions', 'challenge_rooms', 'sponsor_requests', 'global_leaderboard'];
      const results = await Promise.allSettled(
        targets.map((n) => getDocs(collection(db, n)).then((s) => ({ n, docs: s.docs.map((d) => ({ id: d.id, ...d.data() })) })))
      );
      const map = {};
      for (const r of results) {
        if (r.status === 'fulfilled') map[r.value.n] = r.value.docs;
      }
      const comps  = map.competitions || [];
      const rooms  = map.challenge_rooms || [];
      const spons  = map.sponsor_requests || [];
      setStats({
        totalComps:     comps.length,
        upcoming:       comps.filter((c) => c.status === 'UPCOMING').length,
        live:           comps.filter((c) => c.status === 'ACTIVE').length,
        completed:      comps.filter((c) => c.status === 'COMPLETED').length,
        totalRooms:     rooms.length,
        activeRooms:    rooms.filter((r) => r.status === 'ACTIVE').length,
        pendingSponsors: spons.filter((s) => s.status === 'PENDING').length,
        loading: false,
      });
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Competitions', value: stats.totalComps,      color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Upcoming',           value: stats.upcoming,         color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Active',             value: stats.live,             color: '#10b981', bg: '#ecfdf5' },
    { label: 'Completed',          value: stats.completed,        color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Challenge Rooms',    value: stats.totalRooms,       color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Active Rooms',       value: stats.activeRooms,      color: '#10b981', bg: '#ecfdf5' },
    { label: 'Pending Sponsors',   value: stats.pendingSponsors,  color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div>
      <div className="cs-page-header">
        <h2>24 Competition — Overview</h2>
        <p className="cs-sub">Live admin snapshot</p>
      </div>
      <div className="cs-stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="cs-stat-card" style={{ borderTop: `3px solid ${c.color}` }}>
            <div className="cs-stat-val" style={{ color: c.color }}>
              {stats.loading ? <span className="cs-skeleton" /> : c.value}
            </div>
            <div className="cs-stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Competition participants drill-down ──────────────────────────────────────
function CompetitionParticipants({ comp, onBack }) {
  const slug = (comp.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const guessedCol = `${slug}_24_competition`;

  const [colName, setColName] = useState(guessedCol);
  const [inputVal, setInputVal] = useState(guessedCol);
  const { data, loading, error, refetch } = useCollectionData(colName);

  return (
    <div>
      <div className="cs-page-header">
        <div className="cs-back-row">
          <button className="cs-back-btn" onClick={onBack}>← Back to Competitions</button>
          <h2>{comp.title} — Participants</h2>
        </div>
        <p className="cs-sub">Enrollment collection: <code>{colName}</code></p>
      </div>

      {/* Collection override (in case slug doesn't match) */}
      <div className="cs-col-override">
        <input
          className="cs-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enrollment collection name"
        />
        <button className="cs-btn-secondary" onClick={() => setColName(inputVal)}>Load</button>
      </div>

      {error && <div className="cs-error">{error} — try adjusting the collection name above.</div>}

      {loading ? (
        <div className="cs-loading">Loading participants…</div>
      ) : (
        <CSTable
          emptyMsg="No participants found in this collection."
          columns={[
            { label: 'Display Name', key: 'display_name' },
            { label: 'Gender',       key: 'gender' },
            { label: 'Score',        key: 'score' },
            { label: 'Time Elapsed', key: 'time_elapsed' },
            { label: 'Rank',         key: 'final_rank' },
            { label: 'Points Earned',render: (r) => fmtPts(r.points_earned) },
            { label: 'Joined',       render: (r) => fmtDateShort(r.joined_at) },
          ]}
          rows={data}
        />
      )}
    </div>
  );
}

// ─── Competitions list ────────────────────────────────────────────────────────
function CompetitionsTab() {
  const { data, loading, refetch } = useCollectionData('competitions');
  const [overrides, setOverrides] = useState({});
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <CompetitionParticipants
        comp={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  const cols = [
    { label: 'Title',    render: (r) => <span className="cs-link" onClick={() => setSelected(r)}>{r.title || '—'}</span> },
    { label: 'Sport',    key: 'sport_type' },
    { label: 'Status',   render: (r) => {
      const cur = (overrides[r.id] ?? r.status ?? '').toUpperCase();
      return (
        <StatusSelect
          value={cur}
          options={COMP_STATUSES}
          onSave={async (next) => {
            await updateDocument('competitions', r.id, { status: next });
            setOverrides((p) => ({ ...p, [r.id]: next }));
          }}
        />
      );
    }},
    { label: 'Start',     render: (r) => fmtDateShort(r.start_at) },
    { label: 'End',       render: (r) => fmtDateShort(r.end_at) },
    { label: 'Entry Fee', render: (r) => fmtAED(r.entry_fee) },
    { label: 'Cap',       key: 'participant_cap' },
    { label: 'Joined',    key: 'current_participants' },
    { label: 'Interested',key: 'interested_count' },
    { label: 'Participants', render: (r) => (
      <button className="cs-btn-sm" onClick={() => setSelected(r)}>View →</button>
    )},
  ];

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>All Competitions</h2>
          <p className="cs-sub">{data.length} total — click a title to view participants</p>
        </div>
        <button className="cs-btn-secondary" onClick={refetch}>Refresh</button>
      </div>
      {loading ? <div className="cs-loading">Loading…</div> : <CSTable columns={cols} rows={data} emptyMsg="No competitions found." />}
    </div>
  );
}

// ─── Room detail ──────────────────────────────────────────────────────────────
function RoomDetail({ room, onBack }) {
  const [subTab, setSubTab] = useState('participants');
  const { data: pax,  loading: paxLoading }  = useSubcollectionData('challenge_rooms', room.id, 'participants');
  const { data: reqs, loading: reqsLoading, refetch: refetchReqs } = useSubcollectionData('challenge_rooms', room.id, 'join_requests');
  const [reqOverrides, setReqOverrides] = useState({});

  async function resolveRequest(reqId, status) {
    await updateDocument(`challenge_rooms/${room.id}/join_requests`, reqId, { status, resolved_at: new Date().toISOString() });
    setReqOverrides((p) => ({ ...p, [reqId]: status }));
  }

  return (
    <div>
      <div className="cs-page-header">
        <div className="cs-back-row">
          <button className="cs-back-btn" onClick={onBack}>← Back to Rooms</button>
          <h2>{room.name || room.id}</h2>
        </div>
        <p className="cs-sub">
          {room.visibility} · {room.status} · {room.current_participants}/{room.max_participants} participants
        </p>
      </div>

      <div className="cs-sub-tabs">
        <button className={`cs-sub-tab ${subTab === 'participants' ? 'active' : ''}`} onClick={() => setSubTab('participants')}>
          Participants ({pax.length})
        </button>
        <button className={`cs-sub-tab ${subTab === 'requests' ? 'active' : ''}`} onClick={() => setSubTab('requests')}>
          Join Requests ({reqs.length})
        </button>
      </div>

      {subTab === 'participants' && (
        paxLoading ? <div className="cs-loading">Loading…</div> : (
          <CSTable
            emptyMsg="No participants."
            columns={[
              { label: 'Display Name', key: 'display_name' },
              { label: 'Rank',         key: 'rank' },
              { label: 'Calories',     key: 'calories' },
              { label: 'Duration',     key: 'duration' },
              { label: 'Distance',     key: 'distance' },
              { label: 'Pace',         key: 'pace' },
              { label: 'Heart Rate',   key: 'heart_rate' },
              { label: 'Pts Earned',   render: (r) => fmtPts(r.points_earned) },
              { label: 'Joined',       render: (r) => fmtDateShort(r.joined_at) },
            ]}
            rows={pax}
          />
        )
      )}

      {subTab === 'requests' && (
        reqsLoading ? <div className="cs-loading">Loading…</div> : (
          <CSTable
            emptyMsg="No join requests."
            columns={[
              { label: 'Display Name',  key: 'display_name' },
              { label: 'Status',        render: (r) => {
                const cur = reqOverrides[r.id] ?? r.status ?? 'PENDING';
                return <StatusBadge status={cur} />;
              }},
              { label: 'Requested At',  render: (r) => fmtDate(r.requested_at) },
              { label: 'Fee Charged',   render: (r) => fmtAED(r.fee_charged) },
              { label: 'Actions',       render: (r) => {
                const cur = reqOverrides[r.id] ?? r.status;
                if (cur !== 'PENDING') return <StatusBadge status={cur} />;
                return (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="cs-btn-approve" onClick={() => resolveRequest(r.id, 'APPROVED')}>Approve</button>
                    <button className="cs-btn-reject"  onClick={() => resolveRequest(r.id, 'REJECTED')}>Reject</button>
                  </div>
                );
              }},
            ]}
            rows={reqs}
          />
        )
      )}
    </div>
  );
}

// ─── Rooms list ───────────────────────────────────────────────────────────────
function RoomsTab() {
  const { data, loading, refetch } = useCollectionData('challenge_rooms');
  const [overrides, setOverrides] = useState({});
  const [selected, setSelected] = useState(null);

  if (selected) return <RoomDetail room={selected} onBack={() => setSelected(null)} />;

  const cols = [
    { label: 'Room Name', render: (r) => <span className="cs-link" onClick={() => setSelected(r)}>{r.name || r.id}</span> },
    { label: 'Visibility', key: 'visibility' },
    { label: 'Status', render: (r) => {
      const cur = (overrides[r.id] ?? r.status ?? '').toUpperCase();
      return (
        <StatusSelect
          value={cur}
          options={ROOM_STATUSES}
          onSave={async (next) => {
            await updateDocument('challenge_rooms', r.id, { status: next });
            setOverrides((p) => ({ ...p, [r.id]: next }));
          }}
        />
      );
    }},
    { label: 'Creator',    render: (r) => r.admin_display_name || '—' },
    { label: 'Participants', render: (r) => `${r.current_participants ?? 0} / ${r.max_participants ?? '∞'}` },
    { label: 'Entry Fee',  render: (r) => fmtAED(r.entry_fee) },
    { label: 'Created',    render: (r) => fmtDateShort(r.created_at) },
    { label: 'Detail',     render: (r) => <button className="cs-btn-sm" onClick={() => setSelected(r)}>View →</button> },
  ];

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>Challenge Rooms</h2>
          <p className="cs-sub">{data.length} rooms — click a room to view participants & join requests</p>
        </div>
        <button className="cs-btn-secondary" onClick={refetch}>Refresh</button>
      </div>
      {loading ? <div className="cs-loading">Loading…</div> : <CSTable columns={cols} rows={data} emptyMsg="No rooms found." />}
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardTab() {
  const { data, loading, refetch } = useCollectionData('global_leaderboard');
  const [sport, setSport] = useState('ALL');

  const sports = ['ALL', ...new Set(data.map((r) => r.sport_type).filter(Boolean))];
  const rows = sport === 'ALL' ? data : data.filter((r) => r.sport_type === sport);
  const sorted = [...rows].sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0));

  const cols = [
    { label: '#',           render: (_, i) => i + 1 },
    { label: 'User',        render: (r) => r.display_name || r.user_id || r.id },
    { label: 'Sport',       key: 'sport_type' },
    { label: 'Total Points',render: (r) => fmtPts(r.total_points) },
    { label: 'Competitions',key: 'competitions_joined' },
  ];

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>Global Leaderboard</h2>
          <p className="cs-sub">{sorted.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="cs-filter-select" value={sport} onChange={(e) => setSport(e.target.value)}>
            {sports.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="cs-btn-secondary" onClick={refetch}>Refresh</button>
        </div>
      </div>
      {loading ? <div className="cs-loading">Loading…</div> : (
        <CSTable
          columns={cols.map((c) => ({ ...c, render: c.render ? (r) => c.render(r, sorted.indexOf(r)) : undefined }))}
          rows={sorted}
          emptyMsg="No leaderboard data."
        />
      )}
    </div>
  );
}

// ─── Sponsor requests ─────────────────────────────────────────────────────────
function SponsorsTab() {
  const { data, loading, refetch } = useCollectionData('sponsor_requests');
  const [overrides, setOverrides] = useState({});
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL' ? data : data.filter((r) => (r.status || '').toUpperCase() === filter);

  async function setStatus(id, next) {
    await updateDocument('sponsor_requests', id, { status: next });
    setOverrides((p) => ({ ...p, [id]: next }));
  }

  const cols = [
    { label: 'Company',     key: 'company_name' },
    { label: 'Contact',     key: 'contact_name' },
    { label: 'Email',       key: 'email' },
    { label: 'Phone',       key: 'phone' },
    { label: 'Status',      render: (r) => <StatusBadge status={overrides[r.id] ?? r.status} /> },
    { label: 'Submitted',   render: (r) => fmtDateShort(r.submitted_at || r.created_at) },
    { label: 'Actions',     render: (r) => {
      const cur = ((overrides[r.id] ?? r.status) || '').toUpperCase();
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cur !== 'APPROVED'  && <button className="cs-btn-approve" onClick={() => setStatus(r.id, 'APPROVED')}>Approve</button>}
          {cur !== 'REJECTED'  && <button className="cs-btn-reject"  onClick={() => setStatus(r.id, 'REJECTED')}>Reject</button>}
          {cur !== 'CONTACTED' && <button className="cs-btn-sm"      onClick={() => setStatus(r.id, 'CONTACTED')}>Mark Contacted</button>}
        </div>
      );
    }},
  ];

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>Sponsor Requests</h2>
          <p className="cs-sub">{data.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length} pending</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="cs-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {['ALL', ...SPONSOR_STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="cs-btn-secondary" onClick={refetch}>Refresh</button>
        </div>
      </div>
      {loading ? <div className="cs-loading">Loading…</div> : <CSTable columns={cols} rows={filtered} emptyMsg="No sponsor requests." />}
    </div>
  );
}

// ─── App Config toggles ───────────────────────────────────────────────────────
const LOCK_KEYS = [
  { key: 'private_zone_locked',   label: 'Private Zone',    desc: 'Lock or unlock the Private Zone challenge area' },
  { key: 'ai_challenge_locked',   label: 'AI Challenge',    desc: 'Lock or unlock AI-powered challenges' },
  { key: 'adventure_zone_locked', label: 'Adventure Zone',  desc: 'Lock or unlock Adventure Zone challenges' },
];

function AppConfigTab() {
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await getDocument('app_config', 'challenge_locks');
      setLocks(doc || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(key) {
    const next = !locks[key];
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await setDocumentFields('app_config', 'challenge_locks', { [key]: next });
      setLocks((p) => ({ ...p, [key]: next }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>App Config — Feature Locks</h2>
          <p className="cs-sub">Toggle challenge zones without an app release</p>
        </div>
        <button className="cs-btn-secondary" onClick={load}>Refresh</button>
      </div>

      {error && <div className="cs-error">{error}</div>}

      {loading ? <div className="cs-loading">Loading config…</div> : (
        <div className="cs-config-list">
          {LOCK_KEYS.map(({ key, label, desc }) => {
            const isLocked = !!locks[key];
            const isSaving = !!saving[key];
            return (
              <div key={key} className={`cs-config-row ${isLocked ? 'locked' : 'unlocked'}`}>
                <div className="cs-config-info">
                  <span className="cs-config-label">{label}</span>
                  <span className="cs-config-desc">{desc}</span>
                </div>
                <div className="cs-config-right">
                  <span className={`cs-lock-badge ${isLocked ? 'locked' : 'unlocked'}`}>
                    {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                  <button
                    className={`cs-toggle-btn ${isLocked ? 'unlock' : 'lock'}`}
                    onClick={() => toggle(key)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Notifications (interested users) ─────────────────────────────────────────
function NotificationsTab() {
  const { data, loading, refetch } = useCollectionData('competition_notifications');

  const cols = [
    { label: 'Competition ID', key: 'competition_id' },
    { label: 'User ID',        key: 'user_id' },
    { label: 'Signed Up',      render: (r) => fmtDate(r.created_at) },
  ];

  return (
    <div>
      <div className="cs-page-header">
        <div>
          <h2>Competition Notifications</h2>
          <p className="cs-sub">{data.length} "Notify Me" signups</p>
        </div>
        <button className="cs-btn-secondary" onClick={refetch}>Refresh</button>
      </div>
      {loading ? <div className="cs-loading">Loading…</div> : <CSTable columns={cols} rows={data} emptyMsg="No signups yet." />}
    </div>
  );
}

// ─── Main ChallengeSection ────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Overview' },
  { id: 'competitions',   label: 'Competitions' },
  { id: 'rooms',          label: 'Challenge Rooms' },
  { id: 'leaderboard',    label: 'Leaderboard' },
  { id: 'notifications',  label: 'Notifications' },
  { id: 'sponsors',       label: 'Sponsors' },
  { id: 'config',         label: 'App Config' },
];

export default function ChallengeSection() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="cs-root">
      <div className="cs-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cs-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cs-content">
        {tab === 'overview'      && <ChallengeOverview />}
        {tab === 'competitions'  && <CompetitionsTab />}
        {tab === 'rooms'         && <RoomsTab />}
        {tab === 'leaderboard'   && <LeaderboardTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'sponsors'      && <SponsorsTab />}
        {tab === 'config'        && <AppConfigTab />}
      </div>
    </div>
  );
}
