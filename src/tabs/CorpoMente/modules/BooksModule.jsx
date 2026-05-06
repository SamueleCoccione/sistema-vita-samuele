import { useState, useEffect, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import { computeBookDebt } from '../utils/bookDebt';
import { getCurrentYearRange, isWithin } from '../utils/periodCounters';
import { getMondayStr } from '../../../utils/weekRange';
import BentoCard     from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import ChipTag       from '../../../components/primitives/ChipTag';
import EmptyState    from '../../../components/primitives/EmptyState';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import BooksDrawer   from '../drawers/BooksDrawer';
import './modules.css';

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ClockRewindIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 2v6h6" />
    <path d="M3 8A9 9 0 1 1 5.27 5.27" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function ReadingProgress({ book }) {
  const cur = Number(book.currentPages || 0);
  const tot = Number(book.totalPages   || 0);
  if (!tot) return null;
  const pct = Math.min(100, Math.round((cur / tot) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(180,103,214,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-magenta)', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
        {pct}% · {cur}/{tot} pag.
      </span>
    </div>
  );
}

/* Selects the active book (most pages read) and the next queued book */
function splitReadingBooks(books) {
  const reading    = books.filter(b => b.status === 'reading');
  const withPages  = reading.filter(b => Number(b.currentPages || 0) > 0);
  const active = withPages.length > 0
    ? withPages.sort((a, b) => Number(b.currentPages) - Number(a.currentPages))[0]
    : (reading[0] ?? null);
  const next = reading.find(b => b.id !== active?.id && Number(b.currentPages || 0) === 0) ?? null;
  return { active, next };
}

/* Oldest book in reading (by startDate), different from active */
function getOldestReading(books, activeId) {
  return books
    .filter(b => b.status === 'reading' && b.id !== activeId)
    .sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.localeCompare(b.startDate);
    })[0] ?? null;
}

/* ── Stat footer V7 ── */
function DebtFooter({ debt, doneThisYear, bookGoal, toReadCount }) {
  const weekDone  = debt.completedThisWeek;
  const weekTotal = debt.totalDue;
  const weekDone_pct = weekTotal > 0 ? weekDone / weekTotal : 0;
  const weekComplete = weekDone >= weekTotal && weekTotal > 0;

  const [debtTooltip, setDebtTooltip] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      paddingTop: 8, borderTop: '1px solid var(--color-line)',
      marginTop: 'auto',
    }}>

      {/* Stat 1: questa settimana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: '0 0 auto' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          color: weekComplete ? 'var(--color-success)' : 'var(--color-ink)',
        }}>
          {weekComplete ? '✓' : '○'} {weekDone}/{weekTotal}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
          sett.
        </span>
      </div>

      <span style={{ color: 'var(--color-line)', fontSize: 14 }}>·</span>

      {/* Stat 2: quest'anno */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: '0 0 auto' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink)' }}>
          📚 {doneThisYear}/{bookGoal}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
          anno
        </span>
      </div>

      <span style={{ color: 'var(--color-line)', fontSize: 14 }}>·</span>

      {/* Stat 3: debito o coda */}
      {debt.carriedDebt >= 1 ? (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative', cursor: 'default', flex: 1 }}
          onMouseEnter={() => setDebtTooltip(true)}
          onMouseLeave={() => setDebtTooltip(false)}
        >
          <span style={{ color: 'var(--color-ink-muted)', display: 'flex' }}><ClockRewindIcon /></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink)' }}>
            {debt.carriedDebt} da recuperare
          </span>
          {debtTooltip && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
              background: 'var(--color-ink)', color: '#fff',
              fontFamily: 'var(--font-ui)', fontSize: 11, lineHeight: 1.5,
              padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap',
              zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
              Hai accumulato {debt.carriedDebt} libr{debt.carriedDebt === 1 ? 'o' : 'i'} dalle settimane scorse.<br />
              {debt.oldestPendingWeekLabel && `Più vecchia: settimana ${debt.oldestPendingWeekLabel}.`}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
            +{toReadCount} in coda
          </span>
        </div>
      )}
    </div>
  );
}

/* ── SizeS ── */
function SizeS({ active, debt, doneThisYear, bookGoal }) {
  const weekComplete = debt.completedThisWeek >= debt.totalDue && debt.totalDue > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}>
      {active ? (
        <>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-magenta)' }}>
            In lettura
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.3, color: 'var(--color-ink)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {active.title}
          </span>
          {active.author && (
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
              {active.author}
            </span>
          )}
          <ReadingProgress book={active} />
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessun libro in corso
        </span>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 'auto', display: 'flex', gap: 6 }}>
        <span style={{ color: weekComplete ? 'var(--color-success)' : 'var(--color-ink-muted)' }}>
          {weekComplete ? '✓' : '○'} {debt.completedThisWeek}/{debt.totalDue} sett.
        </span>
        <span>·</span>
        <span>{doneThisYear}/{bookGoal} anno</span>
      </div>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ active, next, oldestReading, debt, doneThisYear, bookGoal, toReadCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {active ? (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: 0 }}>
            In lettura
          </p>
          {/* Active book */}
          <div className="mod-book-wrap">
            {active.cover
              ? <img src={active.cover} alt={active.title} className="mod-book-cover" />
              : <div className="mod-book-cover-placeholder">📖</div>
            }
            <div className="mod-book-info">
              <span className="mod-book-title">{active.title}</span>
              {active.author && <span className="mod-book-author">{active.author}</span>}
              <div style={{ marginTop: 6 }}>
                <ReadingProgress book={active} />
              </div>
              {daysSince(active.startDate) !== null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 3, display: 'block' }}>
                  Da {daysSince(active.startDate)} giorni
                </span>
              )}
            </div>
          </div>

          {/* Oldest unfinished book when debt ≥ 1 */}
          {debt.carriedDebt >= 1 && oldestReading && (
            <div className="mod-book-wrap" style={{ opacity: 0.78, borderTop: '1px solid var(--color-line)', paddingTop: 8 }}>
              {oldestReading.cover
                ? <img src={oldestReading.cover} alt={oldestReading.title} style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                : <div style={{ width: 36, height: 52, background: 'rgba(180,103,214,0.10)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📖</div>
              }
              <div className="mod-book-info" style={{ gap: 3 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>{oldestReading.title}</span>
                {oldestReading.author && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>{oldestReading.author}</span>}
                <ReadingProgress book={oldestReading} />
                {daysSince(oldestReading.startDate) !== null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Da {daysSince(oldestReading.startDate)} giorni <ClockRewindIcon />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Next book — only if no debt */}
          {debt.carriedDebt === 0 && next && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-line)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', flexShrink: 0 }}>
                Prossimo
              </span>
              {next.cover
                ? <img src={next.cover} alt={next.title} style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                : <div style={{ width: 28, height: 40, background: 'rgba(180,103,214,0.12)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📖</div>
              }
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {next.title}
              </span>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          illustration="📚"
          title="Nessun libro in corso"
          description="Aggiungi un libro in lettura."
        />
      )}

      <DebtFooter debt={debt} doneThisYear={doneThisYear} bookGoal={bookGoal} toReadCount={toReadCount} />
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ active, next, oldestReading, debt, doneThisYear, bookGoal, toReadCount, shelf }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {active ? (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: 0 }}>
            In lettura
          </p>
          {/* Active book */}
          <div className="mod-book-wrap">
            {active.cover
              ? <img src={active.cover} alt={active.title} className="mod-book-cover" />
              : <div className="mod-book-cover-placeholder">📖</div>
            }
            <div className="mod-book-info">
              <span className="mod-book-title">{active.title}</span>
              {active.author && <span className="mod-book-author">{active.author}</span>}
              {active.rating > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 4, display: 'block' }}>
                  {'★'.repeat(active.rating)}{'☆'.repeat(5 - active.rating)}
                </span>
              )}
              <div style={{ marginTop: 8 }}>
                <ReadingProgress book={active} />
              </div>
              {daysSince(active.startDate) !== null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 3, display: 'block' }}>
                  Da {daysSince(active.startDate)} giorni
                </span>
              )}
            </div>
          </div>

          {/* Oldest unfinished book when debt ≥ 1 */}
          {debt.carriedDebt >= 1 && oldestReading && (
            <div className="mod-book-wrap" style={{ opacity: 0.78 }}>
              {oldestReading.cover
                ? <img src={oldestReading.cover} alt={oldestReading.title} style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                : <div style={{ width: 36, height: 52, background: 'rgba(180,103,214,0.10)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📖</div>
              }
              <div className="mod-book-info" style={{ gap: 3 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>{oldestReading.title}</span>
                {oldestReading.author && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>{oldestReading.author}</span>}
                <ReadingProgress book={oldestReading} />
                {daysSince(oldestReading.startDate) !== null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Da {daysSince(oldestReading.startDate)} giorni · <ClockRewindIcon /> {debt.oldestPendingWeekLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Next book — only if no debt */}
          {debt.carriedDebt === 0 && next && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-line)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', flexShrink: 0 }}>
                Prossimo
              </span>
              {next.cover
                ? <img src={next.cover} alt={next.title} style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                : <div style={{ width: 28, height: 40, background: 'rgba(180,103,214,0.12)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📖</div>
              }
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {next.title}
              </span>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          illustration="📚"
          title="Nessun libro in corso"
          description="Aggiungi un libro in lettura."
        />
      )}

      {/* Da leggere list */}
      {shelf.length > 0 && debt.carriedDebt === 0 && (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: '4px 0 0' }}>
            Da leggere
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {shelf.slice(0, 3).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-ink-muted)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.title}
                </span>
              </div>
            ))}
            {shelf.length > 3 && (
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
                +{shelf.length - 3} altri
              </span>
            )}
          </div>
        </>
      )}

      {/* Sezione DEBITO estesa — solo in size L */}
      {debt.carriedDebt >= 1 && (
        <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 10, marginTop: 4 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: '0 0 6px' }}>
            Debito
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
            <ClockRewindIconInline /> {debt.carriedDebt} libr{debt.carriedDebt === 1 ? 'o' : 'i'} da recuperare.
            {debt.oldestPendingWeekLabel && ` La settimana più vecchia non chiusa: ${debt.oldestPendingWeekLabel}.`}
          </p>
        </div>
      )}

      {/* Vantaggio */}
      {debt.carriedDebt === 0 && debt.netRemaining < 0 && (
        <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 10, marginTop: 4 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-success)', lineHeight: 1.5, margin: 0 }}>
            ⌃ {Math.abs(debt.netRemaining)} libr{Math.abs(debt.netRemaining) === 1 ? 'o' : 'i'} di vantaggio. Hai chiuso una settimana futura in anticipo.
          </p>
        </div>
      )}

      <DebtFooter debt={debt} doneThisYear={doneThisYear} bookGoal={bookGoal} toReadCount={toReadCount} />
    </div>
  );
}

/* Inline icon for use in text flow */
function ClockRewindIconInline() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} aria-hidden="true">
      <path d="M3 2v6h6" /><path d="M3 8A9 9 0 1 1 5.27 5.27" /><path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/* ── main export ── */
export default function BooksModule({ size = 'M' }) {
  const [books]        = useFirebaseState('sv_books_v2',            []);
  const [bookGoal]     = useFirebaseState('sv_book_goal',           12);
  const [weeklyTarget] = useFirebaseState('sv_book_weekly_target',  1);
  const [systemStart, setSystemStart, systemStartLoaded] = useFirebaseState('sv_book_system_start', null);
  const [open, setOpen] = useState(false);

  // Initialize systemStartDate on first load if not set
  useEffect(() => {
    if (systemStartLoaded && systemStart === null) {
      setSystemStart(getMondayStr(0));
    }
  }, [systemStartLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const { active, next } = splitReadingBooks(books);
  const oldestReading    = getOldestReading(books, active?.id);
  const toReadCount      = books.filter(b => b.status === 'to-read').length;
  const shelf            = books.filter(b => b.status === 'to-read');

  const debt = useMemo(() => {
    const sysDate = systemStart ? new Date(systemStart + 'T00:00:00') : new Date();
    return computeBookDebt(books, { weeklyTarget, systemStartWeek: sysDate });
  }, [books, weeklyTarget, systemStart]);

  const doneThisYear = useMemo(() => {
    const yr = getCurrentYearRange();
    return books.filter(b =>
      b.status === 'done' && b.endDate &&
      isWithin(new Date(b.endDate + 'T12:00:00'), yr)
    ).length;
  }, [books]);

  const eyebrow = (
    <DomainEyebrow
      domain="mind"
      label="Libri"
      icon={size !== 'S' ? <BookIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Libreria</button>
  );

  const doneCount = books.filter(b => b.status === 'done').length;

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        action={action}
        className="mod-card"
        compact={size === 'S'}
        onClick={() => setOpen(true)}
      >
        <div className="mod-body">
          {size === 'S' && <SizeS active={active} debt={debt} doneThisYear={doneThisYear} bookGoal={bookGoal} />}
          {size === 'M' && <SizeM active={active} next={next} oldestReading={oldestReading} debt={debt} doneThisYear={doneThisYear} bookGoal={bookGoal} toReadCount={toReadCount} />}
          {size === 'L' && <SizeL active={active} next={next} oldestReading={oldestReading} debt={debt} doneThisYear={doneThisYear} bookGoal={bookGoal} toReadCount={toReadCount} shelf={shelf} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Book Tracker"
        headerStats={[
          { label: 'Questa sett.',  value: `${debt.completedThisWeek}/${debt.totalDue}` },
          { label: 'Quest\'anno',   value: `${doneThisYear}/${bookGoal}` },
          { label: 'In lettura',    value: books.filter(b => b.status === 'reading').length },
          { label: 'Da leggere',    value: toReadCount },
        ]}
        accentColor="var(--color-magenta)"
      >
        <BooksDrawer />
      </DetailDrawer>
    </>
  );
}
