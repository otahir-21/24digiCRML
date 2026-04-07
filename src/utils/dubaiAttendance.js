import { ATTENDANCE_TIMEZONE_LABEL } from '../constants';

const DUBAI = ATTENDANCE_TIMEZONE_LABEL;

/**
 * Calendar date in Dubai (YYYY-MM-DD) for the given instant.
 * @param {Date} [date]
 */
export function dubaiCalendarDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DUBAI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const mo = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${mo}-${d}`;
}

/**
 * Dubai uses UTC+4 all year (no DST). Interpret local wall time on dateKey as Dubai.
 * @param {string} dateKey YYYY-MM-DD
 * @param {string} hhmm HH:mm 24h
 * @returns {number} epoch ms
 */
export function dubaiLocalDateTimeToUtcMs(dateKey, hhmm) {
  const [hhRaw, mmRaw] = String(hhmm || '').split(':');
  const hh = parseInt(hhRaw, 10);
  const mm = parseInt(mmRaw, 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  const [Y, M, D] = String(dateKey).split('-').map((x) => parseInt(x, 10));
  if (!Number.isFinite(Y) || !Number.isFinite(M) || !Number.isFinite(D)) return NaN;
  const iso = `${String(Y).padStart(4, '0')}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+04:00`;
  return Date.parse(iso);
}

/**
 * @param {number} checkInUtcMs
 * @param {string} dateKey Dubai day of check-in
 * @param {string} workStartHhmm HH:mm Dubai
 * @param {number} graceMinutes
 */
export function isCheckInLate(checkInUtcMs, dateKey, workStartHhmm, graceMinutes) {
  const dayStart = dubaiLocalDateTimeToUtcMs(dateKey, workStartHhmm);
  if (Number.isNaN(dayStart) || Number.isNaN(checkInUtcMs)) return false;
  const threshold = dayStart + Math.max(0, graceMinutes) * 60 * 1000;
  return checkInUtcMs > threshold;
}

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function normalizeWorkdayStart(value, fallback = '09:00') {
  const s = String(value || '').trim();
  return HHMM_RE.test(s) ? s : fallback;
}

export function normalizeGraceMinutes(value, fallback = 15) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 24 * 60) return fallback;
  return Math.floor(n);
}

/**
 * Shift a Dubai calendar date by whole days (uses noon Dubai on dateKey to avoid edge cases).
 * @param {string} dateKey YYYY-MM-DD
 * @param {number} deltaDays negative = past
 */
export function dubaiShiftDateKey(dateKey, deltaDays) {
  const ms = dubaiLocalDateTimeToUtcMs(dateKey, '12:00');
  if (Number.isNaN(ms)) return dateKey;
  return dubaiCalendarDateKey(new Date(ms + deltaDays * 24 * 60 * 60 * 1000));
}

/**
 * Compare two YYYY-MM-DD strings (Dubai). Returns negative if a < b.
 */
export function compareDateKeys(a, b) {
  return String(a).localeCompare(String(b));
}

/**
 * Inclusive list of date keys from `fromKey` to `toKey` (Dubai), both ends included.
 * If from > to, returns [].
 */
export function dubaiDateKeysInclusiveRange(fromKey, toKey) {
  if (compareDateKeys(fromKey, toKey) > 0) return [];
  const keys = [];
  let k = fromKey;
  while (compareDateKeys(k, toKey) <= 0) {
    keys.push(k);
    k = dubaiShiftDateKey(k, 1);
    if (keys.length > 400) break;
  }
  return keys;
}
