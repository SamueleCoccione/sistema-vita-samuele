/** Returns {start, end} Date objects for the ISO week containing `now`. */
export function getCurrentWeekRange(now = new Date()) {
  const dow = now.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
  const end   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
  return { start, end };
}

/** Returns {start, end} for the calendar month containing `now`. */
export function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Returns {start, end} for the calendar year containing `now`. */
export function getCurrentYearRange(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1);
  const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

/** True if `date` falls within [range.start, range.end]. */
export function isWithin(date, range) {
  return date >= range.start && date <= range.end;
}

/** Formats a week range as "22–28 apr 2026". */
export function fmtWeekRange(monday) {
  const s = new Date(monday);
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
  const fmt = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const fmtY = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${fmt(e)}`
    : `${fmt(s)} – ${fmt(e)}`;
}

/** Returns the Monday of the week containing `date` as a Date (local time). */
export function getMondayOf(date) {
  const d = new Date(date);
  const dow = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (dow === 0 ? -6 : 1 - dow));
}
