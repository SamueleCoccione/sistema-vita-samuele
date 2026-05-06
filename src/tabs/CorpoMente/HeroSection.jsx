import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirebaseState }    from '../../hooks/useFirebaseState';
import BentoCard               from '../../components/primitives/BentoCard';
import DomainEyebrow           from '../../components/primitives/DomainEyebrow';
import ChipTag                 from '../../components/primitives/ChipTag';
import TrendPill               from '../../components/primitives/TrendPill';
import Sparkline               from '../../components/primitives/Sparkline';
import MiniStatRow             from '../../components/primitives/MiniStatRow';
import DetailDrawer            from '../../components/primitives/DetailDrawer';
import ObjectiveStatus         from '../../components/ObjectiveStatus';
import RuckingDrawer           from './drawers/RuckingDrawer';
import WeightDrawer            from './drawers/WeightDrawer';
import BooksDrawer             from './drawers/BooksDrawer';
import FilmsDrawer             from './drawers/FilmsDrawer';
import JournalDrawer           from './drawers/JournalDrawer';
import './HeroSection.css';

/* ════════════════ helpers ════════════════ */

function getISOWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function hoursAgoStr(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr + 'T12:00:00');
  const diff = Date.now() - d.getTime();
  const h    = Math.floor(diff / 3600000);
  if (h < 1)  return 'meno di un\'ora fa';
  if (h < 24) return `${h} or${h !== 1 ? 'e' : 'a'} fa`;
  const days = Math.floor(h / 24);
  return `${days} giorn${days !== 1 ? 'i' : 'o'} fa`;
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getMondayStr(offset = 0) {
  const d    = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff + offset * 7);
  return mon.toISOString().split('T')[0];
}

function getPeriodBounds(period) {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  if (period === 'week') {
    const cur  = getMondayStr(0);
    const prev = getMondayStr(-1);
    const prevEnd = new Date(new Date(cur + 'T00:00:00') - 1).toISOString().split('T')[0];
    return { cur: { s: cur, e: today }, prev: { s: prev, e: prevEnd } };
  }
  if (period === 'month') {
    const y = now.getFullYear(), m = now.getMonth();
    const cur  = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const prevStart = new Date(y, m - 1, 1).toISOString().split('T')[0];
    const prevEnd   = new Date(y, m, 0).toISOString().split('T')[0];
    return { cur: { s: cur, e: today }, prev: { s: prevStart, e: prevEnd } };
  }
  // quarter
  const q3 = new Date(now); q3.setMonth(now.getMonth() - 3);
  const q6 = new Date(now); q6.setMonth(now.getMonth() - 6);
  return {
    cur:  { s: q3.toISOString().split('T')[0], e: today },
    prev: { s: q6.toISOString().split('T')[0], e: q3.toISOString().split('T')[0] },
  };
}

function inRange(dateStr, bounds) {
  return dateStr >= bounds.s && dateStr <= bounds.e;
}

function scoreChip(score) {
  if (score === null || score === undefined) return { label: 'Nessuna valutazione', tone: 'neutral' };
  if (score >= 8) return { label: 'In forma',       tone: 'success'  };
  if (score >= 6) return { label: 'Nella norma',    tone: 'neutral'  };
  if (score >= 4) return { label: 'Cresce',         tone: 'warning'  };
  return              { label: 'In difficoltà',   tone: 'magenta'  };
}

function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }

function scoreTrend(entries) {
  const scores = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => e.score);
  if (scores.length < 4) return { direction: 'flat', tone: 'neutral' };
  const half = Math.ceil(scores.length / 2);
  const recent = avg(scores.slice(-3));
  const older  = avg(scores.slice(-6, -3));
  if (older === 0) return { direction: 'flat', tone: 'neutral' };
  if (recent > older + 0.3) return { direction: 'up',   tone: 'positive' };
  if (recent < older - 0.3) return { direction: 'down', tone: 'negative' };
  return { direction: 'flat', tone: 'neutral' };
}

/* ════════════════ count-up hook ════════════════ */
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setValue(target); return; }
    const start   = performance.now();
    const animate = (now) => {
      const t   = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setValue(Math.round(ease * target));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

/* ════════════════ ScoreHero (card sinistra) ════════════════ */

function ReflectionText({ text, maxChars = 320 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > maxChars;
  const shown  = expanded || !isLong ? text : text.slice(0, maxChars);
  return (
    <div className="sh-reflection">
      <p className="sh-reflection__text">
        "{shown}{!expanded && isLong ? '…' : '"'}
      </p>
      {isLong && !expanded && (
        <button className="sh-expand-btn" onClick={() => setExpanded(true)}>
          Continua a leggere ›
        </button>
      )}
    </div>
  );
}

function ScoreHero({ onEdit }) {
  const [objStatus] = useFirebaseState('sv_obj_status', { score: null, entries: [] });

  const score   = objStatus?.score   ?? null;
  const entries = objStatus?.entries ?? [];
  const sorted  = useMemo(() =>
    [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );
  const lastEntry = entries[0] ?? null;
  const todayStr  = new Date().toISOString().split('T')[0];
  const hasToday  = lastEntry?.date === todayStr;

  const sparkScores = sorted.slice(-8).map(e => e.score);
  const trend       = scoreTrend(entries);
  const chip        = scoreChip(score);

  const last30 = entries.filter(e => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return e.date >= d.toISOString().split('T')[0];
  });
  const scores30 = last30.map(e => e.score);
  const media30  = scores30.length ? (avg(scores30)).toFixed(1) : '—';
  const picco    = scores30.length ? Math.max(...scores30) : '—';
  const minimo   = scores30.length ? Math.min(...scores30) : '—';

  const animScore = useCountUp(score ?? 0, 900);

  const hoursAgo = lastEntry ? hoursAgoStr(lastEntry.date) : null;
  const isLate   = lastEntry ? (Date.now() - new Date(lastEntry.date + 'T12:00:00').getTime()) > 48 * 3600000 : false;

  return (
    <div className="sh-card">
      {/* header */}
      <div className="sh-header">
        <DomainEyebrow domain="fitness" label="Corpo & Mente" />
        <button className="sh-action-btn" onClick={onEdit}>
          {hasToday ? 'Aggiorna' : 'Valuta oggi'}
        </button>
      </div>

      {/* number zone */}
      <div className="sh-number-zone">
        {/* left: giant number */}
        <div className="sh-number-left">
          <div className="sh-score-wrap">
            <span
              className="sh-score-num"
              aria-label={`Stato obiettivo: ${score ?? '—'} su 10, ${chip.label}`}
            >
              {score !== null ? animScore : '—'}
            </span>
            <span className="sh-score-denom">/10</span>
          </div>
          <ChipTag tone={chip.tone}>{chip.label}</ChipTag>
        </div>

        {/* right: sparkline + mini-stats */}
        <div className="sh-number-right">
          {sparkScores.length >= 2 && (
            <>
              <div className="sh-spark-header">
                <span className="sh-spark-label">
                  {sorted.length} valutazion{sorted.length !== 1 ? 'i' : 'e'}
                </span>
                <TrendPill
                  direction={trend.direction}
                  tone={trend.tone}
                  value={trend.direction === 'up' ? 'in salita' : trend.direction === 'down' ? 'in discesa' : 'stabile'}
                />
              </div>
              <div role="img" aria-label="Sparkline andamento valutazioni">
                <Sparkline data={sparkScores} accent="var(--color-flame)" variant="area" height={80} />
              </div>
              <MiniStatRow stats={[
                { label: 'Media 30g', value: media30 },
                { label: 'Picco',     value: picco   },
                { label: 'Min',       value: minimo  },
              ]} />
            </>
          )}
          {sparkScores.length < 2 && score === null && (
            <div className="sh-no-data-spark">
              <p>Aggiungi la prima valutazione per vedere il trend.</p>
            </div>
          )}
        </div>
      </div>

      {/* reflection zone */}
      {lastEntry ? (
        <div className="sh-blockquote">
          <div className="sh-blockquote__meta">
            <span className="sh-blockquote__date">{fmtDate(lastEntry.date)}</span>
          </div>
          <ReflectionText text={lastEntry.text} maxChars={320} />
        </div>
      ) : (
        <div className="sh-empty-state">
          <p className="sh-empty-state__text">
            Lo Stato Obiettivo è una valutazione quotidiana del tuo benessere fisico e mentale. Inizia ora.
          </p>
          <button className="sh-empty-state__cta" onClick={onEdit}>Prima valutazione</button>
        </div>
      )}

      {/* footer */}
      {lastEntry && (
        <div className={`sh-footer ${isLate ? 'sh-footer--late' : ''}`}>
          {hasToday
            ? 'Hai valutato oggi ✓'
            : isLate
              ? `Manca la valutazione — ultima ${hoursAgo} →`
              : `Ultima valutazione ${hoursAgo}`
          }
        </div>
      )}
    </div>
  );
}

/* ════════════════ InsightsHero (card destra) ════════════════ */

/* icon components */
const icons = {
  footprints: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 6C7 4.5 8 3 9.5 3S12 4.5 12 6c0 1.5-1 3-2.5 4L7 12" /><path d="M17 6C17 4.5 16 3 14.5 3S12 4.5 12 6c0 1.5 1 3 2.5 4L17 12" /><ellipse cx="8" cy="15" rx="2" ry="3" transform="rotate(-10 8 15)" /><ellipse cx="16" cy="15" rx="2" ry="3" transform="rotate(10 16 15)" />
    </svg>
  ),
  scale: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  camera: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  ),
  pen: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  book: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  target: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  film: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  ),
  list: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  smile: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
};

function InsightRow({ icon, title, value, trend, subInfo, onClick }) {
  const IconComp = icons[icon];
  return (
    <div
      className="ih-row"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => e.key === 'Enter' && onClick()) : undefined}
      aria-label={`${title}: ${value}`}
    >
      <span className="ih-row__icon" aria-hidden="true">
        {IconComp && <IconComp />}
      </span>
      <div className="ih-row__body">
        <div className="ih-row__main">
          <span className="ih-row__title">{title}</span>
          <span className="ih-row__value">{value}</span>
          {trend && <TrendPill direction={trend.direction} tone={trend.tone} value={trend.delta} />}
        </div>
        {subInfo && <span className="ih-row__sub">{subInfo}</span>}
      </div>
    </div>
  );
}

function InsightGroup({ domain, color, label, groupTrend, rows }) {
  return (
    <div className="ih-group">
      <div className="ih-group__header">
        <span className="ih-group__dot" style={{ background: color }} />
        <span className="ih-group__label">{label}</span>
        {groupTrend && (
          <TrendPill direction={groupTrend.direction} tone={groupTrend.tone} value="" />
        )}
      </div>
      <div className="ih-group__rows">
        {rows.map((row, i) => <InsightRow key={i} {...row} />)}
      </div>
    </div>
  );
}

const PERIOD_LABELS = { week: 'Settimana', month: 'Mese', quarter: 'Trimestre' };

function InsightsHero({ onOpenDrawer }) {
  const [activities] = useFirebaseState('sv_strava_activities', []);
  const [weight]     = useFirebaseState('sv_weight',            []);
  const [journal]    = useFirebaseState('sv_daily_journal',     []);
  const [books]      = useFirebaseState('sv_books_v2',          []);
  const [films]      = useFirebaseState('sv_films_v1',          []);
  const [photos]     = useFirebaseState('sv_progressi_photos',  []);
  const [objStatus]  = useFirebaseState('sv_obj_status',        { score: null, entries: [] });

  const [period, setPeriod]         = useState('week');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [syncKey, setSyncKey]       = useState(0);
  const [lastSync, setLastSync]     = useState(Date.now());

  const handleSync = () => { setSyncKey(k => k + 1); setLastSync(Date.now()); };

  const insights = useMemo(() => {
    const bounds = getPeriodBounds(period);
    const { cur, prev } = bounds;

    /* ── MOVIMENTO ── */
    const ruckCur  = activities.filter(a => inRange(a.date, cur));
    const ruckPrev = activities.filter(a => inRange(a.date, prev));
    const ruckKm   = ruckCur.reduce((s, a) => s + (a.km || 0), 0);
    const ruckPrevKm = ruckPrev.reduce((s, a) => s + (a.km || 0), 0);
    const ruckKmDelta = +(ruckKm - ruckPrevKm).toFixed(1);

    const sortedW  = [...weight].sort((a, b) => a.date.localeCompare(b.date));
    const latestW  = sortedW.at(-1);
    const prevW    = sortedW.at(-2);
    const wDelta   = latestW && prevW ? +(latestW.weight - prevW.weight).toFixed(1) : null;

    const sortedPh  = [...photos].sort((a, b) => b.date.localeCompare(a.date));
    const lastPhoto = sortedPh[0];
    const photoDays = lastPhoto
      ? Math.floor((Date.now() - new Date(lastPhoto.date + 'T12:00:00').getTime()) / 86400000)
      : null;

    /* ── MENTE ── */
    const journalCur  = journal.filter(e => inRange(e.date, cur));
    const journalPrev = journal.filter(e => inRange(e.date, prev));
    const tagCounts   = {};
    journalCur.forEach(e => (e.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const jDelta = journalCur.length - journalPrev.length;

    const reading  = books.find(b => b.status === 'reading');
    const doneBooks = books.filter(b => b.status === 'done').length;

    const entries  = objStatus?.entries ?? [];
    const lastScore = entries[0]?.score ?? null;
    const entriesCur  = entries.filter(e => inRange(e.date, cur));
    const entriesPrev = entries.filter(e => inRange(e.date, prev));
    const scoreDir = (() => {
      if (!entriesCur.length || !entriesPrev.length) return null;
      const a = avg(entriesCur.map(e => e.score));
      const b = avg(entriesPrev.map(e => e.score));
      if (a > b + 0.5) return { direction: 'up', tone: 'positive', delta: `+${(a - b).toFixed(1)}` };
      if (a < b - 0.5) return { direction: 'down', tone: 'negative', delta: `${(a - b).toFixed(1)}` };
      return { direction: 'flat', tone: 'neutral', delta: 'stabile' };
    })();

    /* ── CINEMA ── */
    const watchedCur  = films.filter(f => f.status === 'watched' && inRange(f.watchedDate || '', cur));
    const watchedPrev = films.filter(f => f.status === 'watched' && inRange(f.watchedDate || '', prev));
    const wlTotal     = films.filter(f => f.status === 'to-watch').length;
    const wlNew       = films.filter(f => f.status === 'to-watch' && inRange(f.addedDate || f.watchedDate || '', cur)).length;

    const genreCounts = {};
    watchedCur.forEach(f => { if (f.genre) { genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; } });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const moodCounts = {};
    watchedCur.forEach(f => { if (f.mood) { moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1; } });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const filmDelta = watchedCur.length - watchedPrev.length;

    return {
      movement: {
        ruckCount: ruckCur.length, ruckKm, ruckKmDelta,
        latestW, wDelta, photoDays,
      },
      mind: {
        journalCount: journalCur.length, topTag, jDelta,
        reading, doneBooks,
        lastScore, scoreDir,
      },
      cinema: {
        filmCount: watchedCur.length, topGenre, filmDelta,
        wlTotal, wlNew, topMood,
      },
    };
  }, [activities, weight, journal, books, films, photos, objStatus, period, syncKey]);

  const { movement, mind, cinema } = insights;

  const syncMinsAgo = Math.floor((Date.now() - lastSync) / 60000);
  const syncLabel   = syncMinsAgo < 1 ? 'adesso' : `${syncMinsAgo} min fa`;

  const movementRows = [
    {
      icon: 'footprints',
      title: 'Rucking',
      value: `${movement.ruckCount} uscit${movement.ruckCount !== 1 ? 'e' : 'a'} · ${movement.ruckKm.toFixed(1)} km`,
      trend: movement.ruckKm > 0 || movement.ruckKmDelta !== 0
        ? { direction: movement.ruckKmDelta >= 0 ? 'up' : 'down', tone: movement.ruckKmDelta >= 0 ? 'positive' : 'negative', delta: `${movement.ruckKmDelta >= 0 ? '+' : ''}${movement.ruckKmDelta} km` }
        : null,
      onClick: () => onOpenDrawer('rucking'),
    },
    {
      icon: 'scale',
      title: 'Peso',
      value: movement.latestW ? `${movement.latestW.weight} kg` : '—',
      trend: movement.wDelta !== null
        ? { direction: movement.wDelta < 0 ? 'down' : movement.wDelta > 0 ? 'up' : 'flat', tone: movement.wDelta < 0 ? 'positive' : movement.wDelta > 0 ? 'negative' : 'neutral', delta: `${movement.wDelta >= 0 ? '+' : ''}${movement.wDelta} kg` }
        : null,
      subInfo: movement.latestW ? `Ultima: ${fmtDate(movement.latestW.date)}` : null,
      onClick: () => onOpenDrawer('weight'),
    },
    {
      icon: 'camera',
      title: 'Foto',
      value: movement.photoDays === null
        ? 'Nessuna sessione'
        : movement.photoDays <= 7
          ? `Sessione recente: ${movement.photoDays} giorni fa`
          : `Ultima sessione ${movement.photoDays} giorni fa`,
      trend: null,
    },
  ];

  const mindRows = [
    {
      icon: 'pen',
      title: 'Journal',
      value: `${mind.journalCount} entr${mind.journalCount !== 1 ? 'y' : 'y'}`,
      trend: mind.jDelta !== 0
        ? { direction: mind.jDelta > 0 ? 'up' : 'down', tone: 'neutral', delta: `${mind.jDelta > 0 ? '+' : ''}${mind.jDelta}` }
        : null,
      subInfo: mind.topTag ? `Prevalente: ${mind.topTag}` : null,
      onClick: () => onOpenDrawer('journal'),
    },
    {
      icon: 'book',
      title: 'Libri',
      value: mind.reading
        ? mind.reading.title
        : `${mind.doneBooks} completat${mind.doneBooks !== 1 ? 'i' : 'o'}`,
      subInfo: mind.reading ? 'In lettura' : null,
      trend: null,
      onClick: () => onOpenDrawer('books'),
    },
    {
      icon: 'target',
      title: 'Riflessione',
      value: mind.lastScore !== null ? `${mind.lastScore}/10` : '—',
      trend: mind.scoreDir,
    },
  ];

  const cinemaRows = [
    {
      icon: 'film',
      title: 'Film visti',
      value: `${cinema.filmCount} film${cinema.topGenre ? ` · ${cinema.topGenre}` : ''}`,
      trend: cinema.filmDelta !== 0
        ? { direction: cinema.filmDelta > 0 ? 'up' : 'down', tone: 'neutral', delta: `${cinema.filmDelta > 0 ? '+' : ''}${cinema.filmDelta}` }
        : null,
      onClick: () => onOpenDrawer('films'),
    },
    {
      icon: 'list',
      title: 'Watchlist',
      value: `${cinema.wlTotal} da vedere`,
      subInfo: cinema.wlNew > 0 ? `+${cinema.wlNew} questa settimana` : null,
      trend: null,
      onClick: () => onOpenDrawer('films'),
    },
    {
      icon: 'smile',
      title: 'Mood',
      value: cinema.topMood ? `Prevalente: ${cinema.topMood}` : '—',
      trend: null,
    },
  ];

  const movGroupTrend = movement.ruckKmDelta > 0
    ? { direction: 'up', tone: 'positive' }
    : movement.ruckKmDelta < 0
      ? { direction: 'down', tone: 'negative' }
      : null;

  const mindGroupTrend = mind.jDelta > 0
    ? { direction: 'up', tone: 'positive' }
    : null;

  return (
    <div className="ih-card">
      {/* header */}
      <div className="ih-header">
        <span className="ih-eyebrow">
          INSIGHT · SETTIMANA {getISOWeek()}
        </span>
        <div className="ih-period-wrap">
          <button
            className="ih-period-btn"
            onClick={() => setPeriodOpen(p => !p)}
            aria-expanded={periodOpen}
          >
            {PERIOD_LABELS[period]} ▾
          </button>
          {periodOpen && (
            <div className="ih-period-dropdown">
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`ih-period-option ${period === key ? 'ih-period-option--active' : ''}`}
                  onClick={() => { setPeriod(key); setPeriodOpen(false); }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* groups */}
      <div className="ih-groups">
        <InsightGroup
          domain="movement"
          color="var(--color-teal)"
          label="MOVIMENTO"
          groupTrend={movGroupTrend}
          rows={movementRows}
        />
        <div className="ih-separator" />
        <InsightGroup
          domain="mind"
          color="var(--color-magenta)"
          label="MENTE"
          groupTrend={mindGroupTrend}
          rows={mindRows}
        />
        <div className="ih-separator" />
        <InsightGroup
          domain="cinema"
          color="#C73E5C"
          label="CINEMA"
          groupTrend={null}
          rows={cinemaRows}
        />
      </div>

      {/* footer */}
      <div className="ih-footer">
        <span>Aggiornato {syncLabel}</span>
        <button className="ih-sync-btn" onClick={handleSync} aria-label="Sincronizza">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Sincronizza
        </button>
      </div>
    </div>
  );
}

/* ════════════════ Drawer orchestrator ════════════════ */

const DRAWER_CONFIG = {
  rucking: {
    title: 'Rucking — Strava',
    headerStats: [{ label: 'Attività', value: '—' }],
    accent: 'var(--color-teal)',
    Content: RuckingDrawer,
  },
  weight: {
    title: 'Peso corporeo',
    headerStats: [{ label: 'Ultimo', value: '—' }],
    accent: 'var(--color-teal)',
    Content: WeightDrawer,
  },
  books: {
    title: 'Book Tracker',
    headerStats: [{ label: 'In lettura', value: '—' }],
    accent: 'var(--color-magenta)',
    Content: BooksDrawer,
  },
  films: {
    title: 'Film Tracker',
    headerStats: [{ label: 'Visti', value: '—' }],
    accent: '#C73E5C',
    Content: FilmsDrawer,
  },
  journal: {
    title: 'Daily Journal',
    headerStats: [{ label: 'Entry', value: '—' }],
    accent: 'var(--color-magenta)',
    Content: JournalDrawer,
  },
};

/* ════════════════ main export ════════════════ */

export default function HeroSection() {
  const [showEdit,   setShowEdit]   = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null); // null | 'rucking' | 'weight' | ...

  const drawerCfg = openDrawer ? DRAWER_CONFIG[openDrawer] : null;

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-left">
          <BentoCard className="hero-bento-card" style={{ height: '100%' }}>
            <ScoreHero onEdit={() => setShowEdit(true)} />
          </BentoCard>
        </div>
        <div className="hero-right">
          <BentoCard className="hero-bento-card" style={{ height: '100%' }}>
            <InsightsHero onOpenDrawer={setOpenDrawer} />
          </BentoCard>
        </div>
      </div>

      {/* edit drawer — stesso stile di tutti gli altri */}
      <DetailDrawer
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        eyebrow="Corpo & Mente"
        title="Stato Obiettivo"
        headerStats={[]}
        accentColor="var(--color-flame)"
      >
        <div style={{ padding: '0 8px' }}>
          <ObjectiveStatus
            tabKey="sv_obj_status"
            placeholder="Come stai nel corpo e nella mente oggi?"
          />
        </div>
      </DetailDrawer>

      {/* insight drawers */}
      {drawerCfg && (
        <DetailDrawer
          isOpen={!!openDrawer}
          onClose={() => setOpenDrawer(null)}
          eyebrow="Corpo & Mente"
          title={drawerCfg.title}
          headerStats={drawerCfg.headerStats}
          accentColor={drawerCfg.accent}
        >
          <drawerCfg.Content />
        </DetailDrawer>
      )}
    </section>
  );
}
