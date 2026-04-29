import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import { JOURNAL_TAGS } from './DailyJournal';

const WEIGHT_TARGET    = 75;
const ANNUAL_BOOK_GOAL = 52;
const WEEKLY_FILM_GOAL  = 2;
const MONTHLY_FILM_GOAL = 8;
const TOTAL_FILM_GOAL   = 96;

function getMondayStr() {
  const d   = new Date();
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return mon.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtWeekShort(monday) {
  const start = new Date(monday + 'T12:00:00');
  const end   = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = dt => dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function WeeklyInsights() {
  const [open, setOpen] = useState(false);

  const [activities]    = useFirebaseState('sv_strava_activities', []);
  const [journal]       = useFirebaseState('sv_daily_journal',     []);
  const [goals]         = useFirebaseState('sv_weekly_goals',      []);
  const [weightEntries] = useFirebaseState('sv_weight',            []);
  const [books]         = useFirebaseState('sv_books_v2',          []);
  const [films]         = useFirebaseState('sv_films_v1',          []);

  const isSunday    = new Date().getDay() === 0;
  const currentYear = String(new Date().getFullYear());

  const data = useMemo(() => {
    const monday = getMondayStr();
    const sunday = addDays(monday, 6);

    /* ── Rucking ── */
    const ruckingCount  = activities.filter(a => a.date >= monday && a.date <= sunday).length;
    const ruckingGoal   = goals.find(g => g.type === 'rucking');
    const ruckingTarget = ruckingGoal?.target || 6;

    /* ── Journal tags ── */
    const weekEntries = journal.filter(e => e.date >= monday && e.date <= sunday);
    const tagCounts   = Object.fromEntries(JOURNAL_TAGS.map(t => [t, 0]));
    weekEntries.forEach(e =>
      (e.tags || []).forEach(t => { if (tagCounts[t] !== undefined) tagCounts[t]++; })
    );
    const topTags = Object.entries(tagCounts)
      .filter(([, n]) => n > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    /* ── Peso ── */
    const sortedW       = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const currentWeight = sortedW.at(-1)?.weight ?? null;
    const refStart      = sortedW[0]?.weight ?? null;
    const remaining     = currentWeight != null ? +(currentWeight - WEIGHT_TARGET).toFixed(1) : null;
    const weightPct     = refStart != null && refStart > WEIGHT_TARGET && currentWeight != null
      ? Math.min(100, Math.max(0, Math.round(((refStart - currentWeight) / (refStart - WEIGHT_TARGET)) * 100)))
      : 0;

    /* ── Libri ── */
    const readingBooks      = books.filter(b =>
      b.status === 'reading' && (parseInt(b.currentPages, 10) || 0) > 0
    );
    const completedThisWeek = books.filter(b =>
      b.status === 'done' && b.endDate && b.endDate >= monday && b.endDate <= sunday
    );
    /* ── Film ── */
    const nowMonth       = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const watchedFilms   = films.filter(f => f.status === 'watched');
    const filmWeekCount  = watchedFilms.filter(f => (f.watchedDate || '') >= monday && (f.watchedDate || '') <= sunday).length;
    const filmMonthCount = watchedFilms.filter(f => (f.watchedDate || '').startsWith(nowMonth)).length;
    const filmsTotal     = watchedFilms.length;

    const doneBooks  = books.filter(b => b.status === 'done');
    const booksTotal = doneBooks.length;

    /* Proiezione al ritmo attuale fino a fine anno */
    let bookProjection = null;
    const sortedDone = [...doneBooks]
      .filter(b => b.endDate)
      .sort((a, b) => a.endDate.localeCompare(b.endDate));
    const firstBookDate = sortedDone[0]?.endDate;
    if (firstBookDate && booksTotal > 0) {
      const today       = new Date();
      const first       = new Date(firstBookDate + 'T12:00:00');
      const daysElapsed = Math.max(1, Math.round((today - first) / 86400000));
      const ratePerDay  = booksTotal / daysElapsed;
      const dec31       = new Date(today.getFullYear(), 11, 31);
      const daysLeft    = Math.max(0, Math.round((dec31 - today) / 86400000));
      bookProjection    = Math.round(booksTotal + ratePerDay * daysLeft);
    }

    return {
      monday, sunday,
      ruckingCount, ruckingTarget,
      topTags, weekEntries,
      currentWeight, remaining, weightPct, refStart,
      readingBooks, completedThisWeek,
      booksTotal, bookProjection,
      filmWeekCount, filmMonthCount, filmsTotal,
    };
  }, [activities, journal, goals, weightEntries, books, films, currentYear]);

  const {
    monday,
    ruckingCount, ruckingTarget,
    topTags, weekEntries,
    currentWeight, remaining, weightPct, refStart,
    readingBooks, completedThisWeek,
    booksTotal, bookProjection,
    filmWeekCount, filmMonthCount, filmsTotal,
  } = data;

  const topTagMax = topTags[0]?.[1] || 1;

  /* Collapsed summary */
  const summaryParts = [`${ruckingCount}/${ruckingTarget} rucking`];
  if (currentWeight != null)      summaryParts.push(`${currentWeight} kg`);
  if (completedThisWeek.length)   summaryParts.push(`libro finito ✓`);
  else if (readingBooks.length)   summaryParts.push(`${readingBooks.length} in lettura`);
  if (booksTotal > 0)             summaryParts.push(`${booksTotal} libri letti`);
  summaryParts.push(`${filmWeekCount}/${WEEKLY_FILM_GOAL} film`);
  if (filmMonthCount > 0)         summaryParts.push(`${filmMonthCount}/${MONTHLY_FILM_GOAL} film mese`);

  /* Pattern text */
  let patternText = null;
  if (topTags.length >= 2) {
    const [[t1, n1], [t2, n2]] = topTags;
    patternText = `Hai usato "${t1}" ${n1} ${n1 === 1 ? 'volta' : 'volte'} e "${t2}" ${n2} ${n2 === 1 ? 'volta' : 'volte'} questa settimana.`;
  } else if (topTags.length === 1) {
    const [[t1, n1]] = topTags;
    patternText = `Tag più usato: "${t1}" — ${n1} ${n1 === 1 ? 'volta' : 'volte'}.`;
  }

  return (
    <div className={`ins-box${isSunday ? ' ins-box-sunday' : ''}`}>
      <button className="ins-box-head" onClick={() => setOpen(o => !o)}>
        <span className="ins-box-title">
          {isSunday ? 'Insight settimana — Domenica' : 'Insight settimana corrente'}
        </span>
        <span className="ins-box-summary">{summaryParts.join(' · ')}</span>
        <span className="ins-box-chev">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ins-box-body">

          {/* ══ COLONNA SINISTRA ══ */}
          <div className="ins-col">

            {/* Rucking */}
            <div className="ins-metric">
              <div className="cm-label" style={{ marginBottom: 8 }}>Rucking questa settimana</div>
              <div className="ins-metric-num-row">
                <span className="ins-metric-val">{ruckingCount}</span>
                <span className="ins-metric-den">/ {ruckingTarget} sessioni</span>
              </div>
              <div className="ins-prog-bar" style={{ marginTop: 8 }}>
                <div className="ins-prog-fill" style={{ width: `${Math.min(100, (ruckingCount / ruckingTarget) * 100)}%` }} />
              </div>
            </div>

            {/* Peso */}
            <div className="ins-metric">
              <div className="cm-label" style={{ marginBottom: 8 }}>Peso → {WEIGHT_TARGET} kg</div>
              {currentWeight != null ? (
                <>
                  <div className="ins-weight-row">
                    <span className="ins-weight-val">{currentWeight}</span>
                    <span className="ins-weight-unit">kg</span>
                    <span className="ins-weight-sep">·</span>
                    {remaining !== null && remaining > 0 && (
                      <span className="ins-weight-rem">mancano <strong>{remaining} kg</strong></span>
                    )}
                    {remaining !== null && remaining <= 0 && (
                      <span className="ins-weight-reached">target raggiunto</span>
                    )}
                    <span className="ins-weight-target">target {WEIGHT_TARGET} kg</span>
                  </div>
                  {refStart != null && refStart > WEIGHT_TARGET && (
                    <div style={{ marginTop: 8 }}>
                      <div className="ins-weight-bar-labels">
                        <span>{refStart} kg</span>
                        <span>{WEIGHT_TARGET} kg</span>
                      </div>
                      <div className="ins-prog-bar ins-prog-bar-thick">
                        <div className="ins-prog-fill" style={{ width: `${weightPct}%` }} />
                        <div className="ins-weight-marker" style={{ left: `${weightPct}%` }} />
                      </div>
                      <div style={{ textAlign: 'right', marginTop: 4 }}>
                        <span className="ins-meta">{weightPct}% del percorso</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="ins-meta">Nessuna pesatura — aggiungi il peso nella sezione Peso</span>
              )}
            </div>

            {/* Tag journal */}
            {topTags.length > 0 && (
              <div className="ins-metric">
                <div className="cm-label" style={{ marginBottom: 10 }}>Tag più usati nel journal</div>
                <div className="ins-tag-rows">
                  {topTags.map(([tag, n]) => (
                    <div key={tag} className="ins-tag-row">
                      <span className="ins-tag-name">{tag}</span>
                      <div className="ins-prog-bar" style={{ flex: 1 }}>
                        <div className="ins-prog-fill" style={{ width: `${(n / topTagMax) * 100}%` }} />
                      </div>
                      <span className="ins-tag-count">{n}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patternText && <div className="ins-pattern">{patternText}</div>}

            <div className="ins-meta">
              {weekEntries.length > 0
                ? `${weekEntries.length} ${weekEntries.length === 1 ? 'nota' : 'note'} nel journal questa settimana`
                : 'Nessuna nota nel journal questa settimana'}
            </div>
          </div>

          {/* ══ COLONNA DESTRA ══ */}
          <div className="ins-col ins-col-right">

            {/* Lettura settimana */}
            <div className="ins-metric">
              <div className="cm-label" style={{ marginBottom: 12 }}>
                Lettura — {fmtWeekShort(monday)}
              </div>

              {/* Libri finiti questa settimana */}
              {completedThisWeek.map(b => (
                <div key={b.id ?? b.title} className="ins-book-done">
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M1 4L4 7.5L10 1" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{b.title}</span>
                </div>
              ))}

              {/* Libri in lettura */}
              {readingBooks.length > 0 ? (
                <div className="ins-reading-list">
                  {completedThisWeek.length > 0 && (
                    <div className="ins-next-week-label">
                      {fmtWeekShort(addDays(monday, 7))}
                    </div>
                  )}
                  {readingBooks.map(b => {
                    const curr  = parseInt(b.currentPages, 10) || 0;
                    const total = parseInt(b.totalPages,   10) || 0;
                    const pct   = total > 0 ? Math.round((curr / total) * 100) : 0;
                    return (
                      <div key={b.id ?? b.title} className="ins-book-reading">
                        <div className="ins-book-reading-title">{b.title}</div>
                        {total > 0 ? (
                          <>
                            <div className="ins-prog-bar" style={{ marginTop: 6 }}>
                              <div className="ins-prog-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="ins-book-reading-meta">
                              {curr} / {total} pag. · {pct}%
                            </div>
                          </>
                        ) : (
                          <div className="ins-book-reading-meta">pagine non impostate</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : completedThisWeek.length === 0 && (
                <div className="ins-meta">Nessun libro in lettura questa settimana</div>
              )}
            </div>

            {/* Totale libri letti */}
            <div className="ins-metric">
              <div className="cm-label" style={{ marginBottom: 12 }}>Libri letti</div>
              <div className="ins-books-big">
                <span className="ins-books-num">{booksTotal}</span>
                <span className="ins-books-label">letti</span>
              </div>
              <div className="ins-books-bar-wrap">
                <div className="ins-books-bar-track">
                  <div
                    className="ins-books-bar-fill"
                    style={{ width: `${Math.min(100, Math.round((booksTotal / ANNUAL_BOOK_GOAL) * 100))}%` }}
                  />
                </div>
                <div className="ins-books-bar-label">
                  obiettivo annuo — {booksTotal} / {ANNUAL_BOOK_GOAL}
                </div>
                {bookProjection !== null && (
                  <div className="ins-books-bar-projection">
                    al ritmo attuale: {bookProjection} libri entro dicembre
                  </div>
                )}
              </div>
            </div>

            {/* Film */}
            <div className="ins-metric">
              <div className="cm-label" style={{ marginBottom: 12 }}>Film</div>

              <div className="ins-film-sublabel">questa settimana</div>
              <div className="ins-metric-num-row">
                <span className="ins-metric-val">{filmWeekCount}</span>
                <span className="ins-metric-den">/ {WEEKLY_FILM_GOAL} film</span>
              </div>
              <div className="ins-books-bar-track" style={{ marginTop: 6 }}>
                <div className="ins-books-bar-fill" style={{ width: `${Math.min(100, Math.round((filmWeekCount / WEEKLY_FILM_GOAL) * 100))}%` }} />
              </div>

              <div className="ins-film-sublabel" style={{ marginTop: 14 }}>questo mese</div>
              <div className="ins-metric-num-row">
                <span className="ins-metric-val">{filmMonthCount}</span>
                <span className="ins-metric-den">/ {MONTHLY_FILM_GOAL} film</span>
              </div>
              <div className="ins-books-bar-track" style={{ marginTop: 6 }}>
                <div className="ins-books-bar-fill" style={{ width: `${Math.min(100, Math.round((filmMonthCount / MONTHLY_FILM_GOAL) * 100))}%` }} />
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="ins-books-big" style={{ marginBottom: 4 }}>
                  <span className="ins-books-num">{filmsTotal}</span>
                  <span className="ins-books-label">visti</span>
                </div>
                <div className="ins-books-bar-track">
                  <div className="ins-books-bar-fill" style={{ width: `${Math.min(100, Math.round((filmsTotal / TOTAL_FILM_GOAL) * 100))}%` }} />
                </div>
                <div className="ins-books-bar-label" style={{ marginTop: 6 }}>
                  obiettivo — {filmsTotal} / {TOTAL_FILM_GOAL}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
