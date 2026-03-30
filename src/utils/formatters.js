export function formatObject(obj) {
  const parts = Object.entries(obj).map(([key, val]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (typeof val === 'boolean') return `${label}: ${val ? 'Yes' : 'No'}`;
    return `${label}: ${val}`;
  });
  return parts.join(', ');
}

export function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object' && value?.toDate) return value.toDate().toLocaleString();
  if (typeof value === 'object' && value?.latitude !== undefined) {
    return `(${value.latitude}, ${value.longitude})`;
  }
  if (typeof value === 'object' && !Array.isArray(value)) return formatObject(value);
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function getTableColumns(items) {
  if (!items?.length) return [];
  const keys = new Set();
  items.forEach((item) => {
    Object.keys(item)
      .filter((k) => k !== 'id')
      .forEach((k) => keys.add(k));
  });
  return Array.from(keys);
}
