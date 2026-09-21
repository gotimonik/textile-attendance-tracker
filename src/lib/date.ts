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

/** YYYY-MM for the current month, in the browser's local timezone. */
export function currentMonthKey(): string {
  return todayKey().slice(0, 7);
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** Number of calendar days in a "YYYY-MM" month key. */
export function daysInMonthKey(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** First and last dateKey ("YYYY-MM-DD") of a "YYYY-MM" month key. */
export function monthKeyRange(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split("-").map(Number);
  const last = daysInMonthKey(monthKey);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` };
}

export function addMonthsToKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** Single-letter weekday label ("M", "T", ...) for a dateKey — pure function of the key itself, not the viewer's clock, so it's safe to call during SSR. */
export function weekdayShortOf(dateKey: string): string {
  const d = dateKeyToUTC(dateKey);
  return d.toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
}

/** All dateKeys ("YYYY-MM-DD") from `fromKey` to `toKey` inclusive. */
export function dateKeysInRange(fromKey: string, toKey: string): string[] {
  const keys: string[] = [];
  let cursor = fromKey;
  let guard = 0;
  while (cursor <= toKey && guard < 400) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
    guard++;
  }
  return keys;
}

/** All "YYYY-MM" month keys from `fromMonth` to `toMonth` inclusive, ascending. */
export function monthKeysBetween(fromMonth: string, toMonth: string): string[] {
  const keys: string[] = [];
  let cursor = fromMonth;
  let guard = 0;
  while (cursor <= toMonth && guard < 600) {
    keys.push(cursor);
    cursor = addMonthsToKey(cursor, 1);
    guard++;
  }
  return keys;
}
