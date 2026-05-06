import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import {
  getCurrentWeekRange, getCurrentMonthRange, getCurrentYearRange,
  isWithin, getMondayOf,
} from '../utils/periodCounters';
import BentoCard     from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import EmptyState    from '../../../components/primitives/EmptyState';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import FilmsDrawer   from '../drawers/FilmsDrawer';
import './modules.css';

/* ── icons ── */
const ClapperboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
    <path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 3.9" />
    <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const FilmStripIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
  </svg>
);

function fmtDate(s) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function fmtMonthYear(now = new Date()) {
  return now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

/* Returns 4 week buckets that span the current calendar month */
function getMonthWeeks(now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const firstMon   = getMondayOf(monthStart);
  const weeks = [];
  let cur = new Date(firstMon);
  while (weeks.length < 4) {
    const wStart = new Date(cur);
    const wEnd   = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 6, 23, 59, 59, 999);
    weeks.push({ start: wStart, end: wEnd, label: `S${weeks.length + 1}` });
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}

function PosterThumb({ film }) {
  if (film.poster) {
    return (
      <img src={film.poster} alt={film.title} className="mod-film-poster"
        crossOrigin={film.poster.startsWith('http') ? 'anonymous' : undefined}
        title={film.title} />
    );
  }
  return <div className="mod-film-poster-placeholder" title={film.title}>🎬</div>;
}

/* ── Doppio counter footer ── */
function FilmCounterFooter({ weekCount, weekGoal, monthCount, monthGoal, watchlistCount }) {
  const weekDone  = weekCount >= weekGoal  && weekGoal > 0;
  const monthDone = monthCount >= monthGoal && monthGoal > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-line)', marginTop: 'auto', flexWrap: 'wrap' }}>

      {/* Settimana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: weekDone ? 'var(--color-success)' : 'var(--color-ink-muted)', display: 'flex' }}>
          <ClapperboardIcon />
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: weekDone ? 'var(--color-success)' : 'var(--color-ink)' }}>
          {weekCount}/{weekGoal}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>sett.</span>
      </div>

      <span style={{ color: 'var(--color-line)', fontSize: 14 }}>·</span>

      {/* Mese */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'default' }}
        title={fmtMonthYear()}
      >
        <span style={{ color: monthDone ? 'var(--color-success)' : 'var(--color-ink-muted)', display: 'flex' }}>
          <FilmStripIcon />
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: monthDone ? 'var(--color-success)' : 'var(--color-ink)' }}>
          {monthCount}/{monthGoal}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>mese</span>
      </div>

      <span style={{ color: 'var(--color-line)', fontSize: 14 }}>·</span>

      {/* Watchlist */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
        +{watchlistCount} watchlist
      </span>
    </div>
  );
}

/* ── Stat narrativa (size L) ── */
function PaceNarrative({ monthCount, monthGoal }) {
  if (monthCount >= monthGoal) {
    const over = monthCount - monthGoal;
    const text = over > 0
      ? `Ritmo solido. Hai superato il target di ${over} film.`
      : 'Sei in linea con il ritmo del mese.';
    return (
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    );
  }
  const remaining = monthGoal - monthCount;
  return (
    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
      Stai sotto il ritmo. Servirebbero {remaining} film entro fine mese.
    </p>
  );
}

/* ── Bar chart tooltip ── */
function WeekTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dr-tooltip">
      <span className="dr-tooltip-val">{payload[0].value} film</span>
    </div>
  );
}

/* ── SizeS ── */
function SizeS({ recent, weekCount, weekGoal, monthCount, monthGoal, toWatch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}>
      {recent[0] ? (
        <>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-cinema, #C73E5C)' }}>
            Ultimo visto
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.3, color: 'var(--color-ink)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {recent[0].title}
          </span>
          {recent[0].watchedDate && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
              {fmtDate(recent[0].watchedDate)}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessun film visto
        </span>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: weekCount >= weekGoal ? 'var(--color-success)' : 'var(--color-ink-muted)' }}>
          🎬 {weekCount}/{weekGoal} sett.
        </span>
        <span>·</span>
        <span>📽 {monthCount}/{monthGoal} mese</span>
      </div>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ recent, weekCount, weekGoal, monthCount, monthGoal, yearCount, yearGoal, toWatch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {recent.length > 0 ? (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: 0 }}>
            Ultimi visti
          </p>
          <div className="mod-film-row">
            {recent.map(f => <PosterThumb key={f.id} film={f} />)}
            {recent.length < 3 && Array.from({ length: 3 - recent.length }).map((_, i) => (
              <div key={`ph-${i}`} className="mod-film-poster-placeholder">—</div>
            ))}
          </div>
          {recent[0] && (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', margin: 0 }}>
              Ultimo: <strong style={{ color: 'var(--color-ink)' }}>{recent[0].title}</strong>
              {recent[0].watchedDate ? ` — ${fmtDate(recent[0].watchedDate)}` : ''}
            </p>
          )}
        </>
      ) : (
        <EmptyState
          illustration="🎬"
          title="Nessun film visto ancora"
          description="Aggiungi il primo film alla lista."
        />
      )}

      <FilmCounterFooter
        weekCount={weekCount} weekGoal={weekGoal}
        monthCount={monthCount} monthGoal={monthGoal}
        watchlistCount={toWatch}
      />

      {/* Sub-info anno */}
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: -4 }}>
        Quest'anno: {yearCount}/{yearGoal}
      </div>
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ recent, weekCount, weekGoal, monthCount, monthGoal, yearCount, yearGoal, toWatch, watchlist, weekBarData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {recent.length > 0 ? (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: 0 }}>
            Ultimi visti
          </p>
          <div className="mod-film-row">
            {recent.map(f => <PosterThumb key={f.id} film={f} />)}
            {recent.length < 3 && Array.from({ length: 3 - recent.length }).map((_, i) => (
              <div key={`ph-${i}`} className="mod-film-poster-placeholder">—</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.title}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginLeft: 8, flexShrink: 0 }}>
                  {fmtDate(f.watchedDate)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState illustration="🎬" title="Nessun film visto ancora" description="Aggiungi il primo film." />
      )}

      {/* Mini bar chart — ritmo settimanale */}
      {weekBarData.some(w => w.count > 0) && (
        <>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: '4px 0 0' }}>
            Ritmo mese
          </p>
          <div style={{ height: 48 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekBarData} barSize={20} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<WeekTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <ReferenceLine
                  y={weekGoal}
                  stroke="rgba(199,62,92,0.4)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {weekBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isFuture
                        ? 'rgba(199,62,92,0.08)'
                        : entry.count >= weekGoal
                          ? 'rgba(199,62,92,0.9)'
                          : 'rgba(199,62,92,0.45)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <PaceNarrative monthCount={monthCount} monthGoal={monthGoal} />
        </>
      )}

      <FilmCounterFooter
        weekCount={weekCount} weekGoal={weekGoal}
        monthCount={monthCount} monthGoal={monthGoal}
        watchlistCount={toWatch}
      />

      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: -4 }}>
        Quest'anno: {yearCount}/{yearGoal}
      </div>
    </div>
  );
}

/* ── main export ── */
export default function FilmsModule({ size = 'M' }) {
  const [films]     = useFirebaseState('sv_films_v1',        []);
  const [weekGoal]  = useFirebaseState('sv_film_goal_week',  2);
  const [monthGoal] = useFirebaseState('sv_film_goal',       8);
  const [open, setOpen] = useState(false);

  const yearGoal = 12 * monthGoal;

  const watched = useMemo(() =>
    [...films].filter(f => f.status === 'watched')
      .sort((a, b) => (b.watchedDate || '').localeCompare(a.watchedDate || '')),
    [films]
  );

  const watchlist = films.filter(f => f.status === 'to-watch');
  const toWatch   = watchlist.length;
  const recent    = watched.slice(0, 3);

  const weekRange  = useMemo(() => getCurrentWeekRange(),  []);
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const yearRange  = useMemo(() => getCurrentYearRange(),  []);

  const watchedThisWeek  = useMemo(() => watched.filter(f => f.watchedDate && isWithin(new Date(f.watchedDate + 'T12:00:00'), weekRange)).length,  [watched, weekRange]);
  const watchedThisMonth = useMemo(() => watched.filter(f => f.watchedDate && isWithin(new Date(f.watchedDate + 'T12:00:00'), monthRange)).length, [watched, monthRange]);
  const watchedThisYear  = useMemo(() => watched.filter(f => f.watchedDate && isWithin(new Date(f.watchedDate + 'T12:00:00'), yearRange)).length,  [watched, yearRange]);

  /* Week bar chart for size L */
  const weekBarData = useMemo(() => {
    const now = new Date();
    const weeks = getMonthWeeks(now);
    return weeks.map(w => ({
      label:    w.label,
      count:    watched.filter(f => f.watchedDate && isWithin(new Date(f.watchedDate + 'T12:00:00'), w)).length,
      isFuture: w.start > now,
    }));
  }, [watched]);

  /* Top mood this month for drawer */
  const topMoodThisMonth = useMemo(() => {
    const counts = {};
    watched.forEach(f => {
      if (!f.mood || !f.watchedDate) return;
      if (!isWithin(new Date(f.watchedDate + 'T12:00:00'), monthRange)) return;
      counts[f.mood] = (counts[f.mood] || 0) + 1;
    });
    const entries = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return entries.length > 0 ? entries[0][0] : '—';
  }, [watched, monthRange]);

  const eyebrow = (
    <DomainEyebrow
      domain="cinema"
      label="Film"
      icon={size !== 'S' ? <FilmStripIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Tutti</button>
  );

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
          {size === 'S' && <SizeS recent={recent} weekCount={watchedThisWeek} weekGoal={weekGoal} monthCount={watchedThisMonth} monthGoal={monthGoal} toWatch={toWatch} />}
          {size === 'M' && <SizeM recent={recent} weekCount={watchedThisWeek} weekGoal={weekGoal} monthCount={watchedThisMonth} monthGoal={monthGoal} yearCount={watchedThisYear} yearGoal={yearGoal} toWatch={toWatch} />}
          {size === 'L' && <SizeL recent={recent} weekCount={watchedThisWeek} weekGoal={weekGoal} monthCount={watchedThisMonth} monthGoal={monthGoal} yearCount={watchedThisYear} yearGoal={yearGoal} toWatch={toWatch} watchlist={watchlist} weekBarData={weekBarData} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Cinema"
        headerStats={[
          { label: 'Settimana', value: `${watchedThisWeek}/${weekGoal}` },
          { label: 'Mese',      value: `${watchedThisMonth}/${monthGoal}` },
          { label: 'Anno',      value: `${watchedThisYear}/${yearGoal}` },
          { label: 'Mood top',  value: topMoodThisMonth },
        ]}
        accentColor="#C73E5C"
      >
        <FilmsDrawer />
      </DetailDrawer>
    </>
  );
}
