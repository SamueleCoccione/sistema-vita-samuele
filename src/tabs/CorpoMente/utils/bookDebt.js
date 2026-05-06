import { getCurrentWeekRange, isWithin, fmtWeekRange } from './periodCounters';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes the book debt state at `now`.
 *
 * @param {Array}  books  - array of book objects from Firebase (sv_books_v2)
 * @param {Object} config - { weeklyTarget: number, systemStartWeek: Date }
 * @param {Date}   now    - current time (injectable for tests)
 *
 * Debt logic:
 *   carriedDebt = max(0, weeks_passed × weeklyTarget − books_done_before_this_week)
 *   totalDue    = weeklyTarget + carriedDebt
 *   netRemaining = totalDue − completedThisWeek
 *
 * Books with missing/invalid endDate are skipped.
 * Abandoned books do NOT count as completed.
 * A book's completion counts in the week of its endDate.
 */
export function computeBookDebt(books, config, now = new Date()) {
  const currentWeek = getCurrentWeekRange(now);

  // Validate systemStartWeek: must be a valid date in the past
  let sysStart = config.systemStartWeek instanceof Date && !isNaN(config.systemStartWeek)
    ? config.systemStartWeek
    : new Date(currentWeek.start);

  if (sysStart > currentWeek.start) {
    // Future systemStartWeek is invalid — treat as "start now"
    sysStart = new Date(currentWeek.start);
  }

  const weeksPassed = Math.max(0, Math.floor(
    (currentWeek.start.getTime() - sysStart.getTime()) / MS_PER_WEEK
  ));

  const historicalTarget = weeksPassed * config.weeklyTarget;

  // Books completed from sysStart up to (but NOT including) this week
  const completedBeforeThisWeek = books.filter(b => {
    if (b.status !== 'done' || !b.endDate) return false;
    const d = new Date(b.endDate + 'T12:00:00');
    return d >= sysStart && d < currentWeek.start;
  }).length;

  const carriedDebt = Math.max(0, historicalTarget - completedBeforeThisWeek);

  // Books completed in the current week (including ones that reduce debt)
  const completedThisWeek = books.filter(b => {
    if (b.status !== 'done' || !b.endDate) return false;
    return isWithin(new Date(b.endDate + 'T12:00:00'), currentWeek);
  }).length;

  const totalDue     = config.weeklyTarget + carriedDebt;
  const netRemaining = totalDue - completedThisWeek;

  // Monday of the oldest unclosed week (for narrative UI)
  const oldestPendingWeek = carriedDebt > 0
    ? new Date(currentWeek.start.getTime() - carriedDebt * MS_PER_WEEK)
    : null;

  const oldestPendingWeekLabel = oldestPendingWeek
    ? fmtWeekRange(oldestPendingWeek)
    : null;

  return {
    weekStart:              currentWeek.start,
    weeklyTarget:           config.weeklyTarget,
    carriedDebt,
    totalDue,
    completedThisWeek,
    netRemaining,
    oldestPendingWeek,
    oldestPendingWeekLabel,
  };
}

/* ─── Inline tests (call runBookDebtTests() from browser console) ─── */
export function runBookDebtTests() {
  const pass = (name, cond) => console.log(cond ? `✅ ${name}` : `❌ ${name}`);

  const NOW = new Date('2026-05-05T10:00:00'); // Monday of test week
  const SYS_START = new Date('2026-05-05');    // same Monday → 0 weeks passed

  const cfg = { weeklyTarget: 1, systemStartWeek: SYS_START };

  // Test 1: sistema appena attivato → debito 0
  const r1 = computeBookDebt([], cfg, NOW);
  pass('Sistema appena attivato: carriedDebt=0', r1.carriedDebt === 0);
  pass('Sistema appena attivato: totalDue=1',    r1.totalDue === 1);

  // Test 2: una settimana passata senza libri → debito 1
  const sysStart2 = new Date('2026-04-28'); // lunedì scorso
  const cfg2 = { weeklyTarget: 1, systemStartWeek: sysStart2 };
  const r2 = computeBookDebt([], cfg2, NOW);
  pass('1 settimana passata, 0 libri: carriedDebt=1', r2.carriedDebt === 1);
  pass('1 settimana passata, 0 libri: totalDue=2',    r2.totalDue === 2);

  // Test 3: tre settimane passate, 1 libro completato → debito 2
  const sysStart3 = new Date('2026-04-14'); // 3 settimane fa
  const cfg3 = { weeklyTarget: 1, systemStartWeek: sysStart3 };
  const books3 = [{ status: 'done', endDate: '2026-04-20' }];
  const r3 = computeBookDebt(books3, cfg3, NOW);
  pass('3 sett. passate, 1 libro: carriedDebt=2', r3.carriedDebt === 2);

  // Test 4: vantaggio (completato questa settimana, debito 0)
  const books4 = [{ status: 'done', endDate: '2026-05-05' }];
  const r4 = computeBookDebt(books4, cfg, NOW);
  pass('Vantaggio: completedThisWeek=1', r4.completedThisWeek === 1);
  pass('Vantaggio: netRemaining=0',      r4.netRemaining === 0);
  pass('Vantaggio: carriedDebt=0',       r4.carriedDebt === 0);

  // Test 5: systemStartDate nel futuro → fallback a settimana corrente
  const cfgFuture = { weeklyTarget: 1, systemStartWeek: new Date('2026-12-01') };
  const r5 = computeBookDebt([], cfgFuture, NOW);
  pass('systemStart futuro: carriedDebt=0', r5.carriedDebt === 0);

  // Test 6: libro abbandonato NON conta
  const books6 = [{ status: 'abandoned', endDate: '2026-04-20' }];
  const r6 = computeBookDebt(books6, cfg2, NOW);
  pass('Abandoned non conta: carriedDebt=1', r6.carriedDebt === 1);

  // Test 7: libro done senza endDate → skippato
  const books7 = [{ status: 'done', endDate: null }];
  const r7 = computeBookDebt(books7, cfg2, NOW);
  pass('endDate nullo skippato: carriedDebt=1', r7.carriedDebt === 1);

  console.log('Book Debt Tests done.');
}
