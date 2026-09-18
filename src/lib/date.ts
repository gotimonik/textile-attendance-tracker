/** YYYY-MM-DD in the browser's local timezone (used as the canonical date key everywhere). */
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a UTC-midnight Date, used as the DB storage key. */
export function dateKeyToUTC(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/** Format a Date (as stored, UTC-midnight) back into YYYY-MM-DD. */
export function utcToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToKey(dateKey: string, delta: number): string {
  const d = dateKeyToUTC(dateKey);
  d.setUTCDate(d.getUTCDate() + delta);
  return utcToDateKey(d);
}

/** Local (non-UTC) Date object for use with browser-side date pickers. */
export function dateKeyToLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function localDateToDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateKey: string): string {
  const d = dateKeyToUTC(dateKey);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
