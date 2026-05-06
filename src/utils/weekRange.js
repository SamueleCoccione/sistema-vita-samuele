/**
 * Restituisce lunedì e domenica della settimana corrente.
 * @param {number} weekOffset  0 = settimana corrente, -1 = settimana scorsa, ecc.
 */
export function getCurrentWeekBounds(weekOffset = 0) {
  const now  = new Date();
  const dow  = now.getDay(); // 0 = domenica
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diffToMon + weekOffset * 7);
  const sun  = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { monday: mon, sunday: sun };
}

/**
 * Stringa "Lun 27 apr – Dom 02 mag"
 */
export function weekRangeShort(weekOffset = 0) {
  const { monday, sunday } = getCurrentWeekBounds(weekOffset);
  const fmtDay = (d) =>
    d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  return `${fmtDay(monday)} – ${fmtDay(sunday)}`;
}

/**
 * Stringa "Lunedì 27 aprile – Domenica 02 maggio"
 */
export function weekRangeLong(weekOffset = 0) {
  const { monday, sunday } = getCurrentWeekBounds(weekOffset);
  const fmtDay = (d) =>
    d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });
  // Capitalizza il giorno
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(fmtDay(monday))} – ${cap(fmtDay(sunday))}`;
}

/**
 * Stringa ISO "YYYY-MM-DD" del lunedì corrente.
 */
export function getMondayStr(weekOffset = 0) {
  const { monday } = getCurrentWeekBounds(weekOffset);
  return monday.toISOString().split('T')[0];
}
