/**
 * Pattern-based activity suggestions (phase 1 — no external ML).
 * After the same activity is logged manually ≥ {@link MIN_MANUAL_FOR_PREDICTION} times in the lookback window,
 * we surface a “smart” pick + optional typical local time from recent entries.
 * Replace `engine` / this module later with API-backed inference.
 */

export const MIN_MANUAL_FOR_PREDICTION = 3;
export const LOOKBACK_DAYS = 90;

/** @param {unknown} ts Firestore Timestamp | Date | undefined */
export function selectionCreatedToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  const d = new Date(ts);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

/**
 * @param {Array<Record<string, unknown>>} selections rows from Firestore (newest first or any order)
 * @param {number} [nowMs]
 */
export function computeActivitySuggestion(selections, nowMs = Date.now()) {
  const windowMs = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const manual = (selections || []).filter((r) => {
    const src = String(r.source || 'manual').toLowerCase();
    return src === 'manual' && r.activityKey;
  });

  const recent = manual.filter((r) => {
    const t = selectionCreatedToMillis(r.createdAt);
    return t && nowMs - t <= windowMs;
  });

  if (recent.length < MIN_MANUAL_FOR_PREDICTION) {
    return {
      ready: false,
      engine: 'pattern_v1',
      countInWindow: recent.length,
      needed: MIN_MANUAL_FOR_PREDICTION,
    };
  }

  const counts = new Map();
  for (const r of recent) {
    const k = String(r.activityKey).toLowerCase().trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }

  let bestKey = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      bestKey = k;
      bestCount = c;
    }
  }

  if (!bestKey || bestCount < MIN_MANUAL_FOR_PREDICTION) {
    return {
      ready: false,
      engine: 'pattern_v1',
      countInWindow: recent.length,
      needed: MIN_MANUAL_FOR_PREDICTION,
    };
  }

  const forKey = recent
    .filter((r) => String(r.activityKey).toLowerCase().trim() === bestKey)
    .sort((a, b) => selectionCreatedToMillis(b.createdAt) - selectionCreatedToMillis(a.createdAt));

  const labelRow = forKey.find((r) => r.activityLabel) || forKey[0];
  const label = String(labelRow?.activityLabel || bestKey).trim() || bestKey;

  const withTime = forKey.filter(
    (r) => typeof r.hourLocal === 'number' && r.hourLocal >= 0 && r.hourLocal <= 23,
  );
  const sample = withTime.slice(0, MIN_MANUAL_FOR_PREDICTION);

  let suggestedHourLocal = null;
  let suggestedMinuteLocal = null;
  if (sample.length >= 1) {
    const hAvg =
      sample.reduce((s, r) => s + Number(r.hourLocal), 0) / sample.length;
    const mAvg =
      sample.reduce((s, r) => s + (typeof r.minuteLocal === 'number' ? Number(r.minuteLocal) : 0), 0) /
      sample.length;
    suggestedHourLocal = Math.min(23, Math.max(0, Math.round(hAvg)));
    suggestedMinuteLocal = Math.min(59, Math.max(0, Math.round(mAvg)));
  }

  return {
    ready: true,
    engine: 'pattern_v1',
    activityKey: bestKey,
    activityLabel: label,
    sameActivityPickCount: bestCount,
    totalManualInWindow: recent.length,
    suggestedHourLocal,
    suggestedMinuteLocal,
  };
}

export function formatLocalTime(hour, minute) {
  if (typeof hour !== 'number') return null;
  const m = typeof minute === 'number' ? minute : 0;
  const d = new Date();
  d.setHours(hour, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
