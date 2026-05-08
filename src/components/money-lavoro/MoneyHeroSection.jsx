import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard   from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import ChipTag     from '../primitives/ChipTag';
import TrendPill   from '../primitives/TrendPill';
import Sparkline   from '../primitives/Sparkline';
import MiniStatRow from '../primitives/MiniStatRow';
import DetailDrawer from '../primitives/DetailDrawer';
import ObjectiveStatus from '../ObjectiveStatus';

/* ── helpers ── */

const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function hoursAgoStr(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr + 'T12:00:00').getTime();
  const h    = Math.floor(diff / 3600000);
  if (h < 1)  return 'meno di un\'ora fa';
  if (h < 24) return `${h} or${h !== 1 ? 'e' : 'a'} fa`;
  return `${Math.floor(h / 24)} giorn${Math.floor(h / 24) !== 1 ? 'i' : 'o'} fa`;
}

function getPeriodBounds(period) {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  if (period === 'week') {
    const diff   = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const mon    = new Date(now); mon.setDate(now.getDate() + diff);
    const monStr = mon.toISOString().split('T')[0];
    const prevMon = new Date(mon); prevMon.setDate(mon.getDate() - 7);
    return {
      cur:  { s: monStr, e: today },
      prev: { s: prevMon.toISOString().split('T')[0], e: new Date(mon.getTime() - 86400000).toISOString().split('T')[0] },
    };
  }
  // month
  const y = now.getFullYear(), m = now.getMonth();
  return {
    cur:  { s: `${y}-${String(m + 1).padStart(2, '0')}-01`, e: today },
    prev: { s: new Date(y, m - 1, 1).toISOString().split('T')[0], e: new Date(y, m, 0).toISOString().split('T')[0] },
  };
}

function inRange(d, b) { return d >= b.s && d <= b.e; }
function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }

function scoreChip(score) {
  if (score === null || score === undefined) return { label: 'Nessuna valutazione', tone: 'neutral' };
  if (score >= 8) return { label: 'In controllo',    tone: 'success' };
  if (score >= 6) return { label: 'Nella norma',     tone: 'neutral' };
  if (score >= 4) return { label: 'Sotto pressione', tone: 'warning' };
  return              { label: 'In difficoltà',    tone: 'magenta' };
}

function scoreTrend(entries) {
  const scores = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => e.score);
  if (scores.length < 4) return { direction: 'flat', tone: 'neutral' };
  const recent = avg(scores.slice(-3));
  const older  = avg(scores.slice(-6, -3));
  if (older === 0) return { direction: 'flat', tone: 'neutral' };
  if (recent > older + 0.3) return { direction: 'up',   tone: 'positive' };
  if (recent < older - 0.3) return { direction: 'down', tone: 'negative' };
  return { direction: 'flat', tone: 'neutral' };
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (target === null || target === undefined) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    const start   = performance.now();
    const animate = (now) => {
      const t    = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

/* ── Icons ── */
const icons = {
  euro: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M4 14h12M19.5 6a7 7 0 0 0-7-4 7 7 0 0 0-7 7 7 7 0 0 0 7 7 7 7 0 0 0 7-4"/>
    </svg>
  ),
  target: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  people: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  flask: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M9 3v7l-4 9h14l-4-9V3M9 3H7M15 3h2"/>
    </svg>
  ),
  heart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

/* ── InsightRow (reuses ih-* CSS from HeroSection.css, bundlato globalmente) ── */
function InsightRow({ icon, title, value, trend, subInfo, onClick }) {
  const IconComp = icons[icon];
  return (
    <div
      className="ih-row"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => e.key === 'Enter' && onClick()) : undefined}
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

function InsightGroup({ color, label, groupTrend, rows }) {
  return (
    <div className="ih-group">
      <div className="ih-group__header">
        <span className="ih-group__dot" style={{ background: color }} />
        <span className="ih-group__label">{label}</span>
        {groupTrend && <TrendPill direction={groupTrend.direction} tone={groupTrend.tone} value="" />}
      </div>
      <div className="ih-group__rows">
        {rows.map((row, i) => <InsightRow key={i} {...row} />)}
      </div>
    </div>
  );
}

/* ── Reflection text con expand ── */
function ReflectionText({ text, maxChars = 280 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > maxChars;
  const shown  = expanded || !isLong ? text : text.slice(0, maxChars);
  return (
    <div className="sh-reflection">
      <p className="sh-reflection__text ml-reflection__text">
        "{shown}{!expanded && isLong ? '…' : '"'}
      </p>
      {isLong && !expanded && (
        <button className="sh-expand-btn ml-expand-btn" onClick={() => setExpanded(true)}>
          Continua a leggere ›
        </button>
      )}
    </div>
  );
}

/* ════════════════ MoneyScoreHero — card sinistra ════════════════ */
function MoneyScoreHero({ onEdit }) {
  const [objStatus] = useFirebaseState('ml_obj_status', { score: null, entries: [] });

  const score     = objStatus?.score   ?? null;
  const entries   = objStatus?.entries ?? [];
  const sorted    = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const lastEntry = entries[0] ?? null;
  const todayStr  = new Date().toISOString().split('T')[0];
  const hasToday  = lastEntry?.date === todayStr;

  const sparkScores = sorted.slice(-8).map(e => e.score);
  const trend       = scoreTrend(entries);
  const chip        = scoreChip(score);
  const animScore   = useCountUp(score ?? 0, 900);

  const last30    = entries.filter(e => { const d = new Date(); d.setDate(d.getDate() - 30); return e.date >= d.toISOString().split('T')[0]; });
  const scores30  = last30.map(e => e.score);
  const media30   = scores30.length ? avg(scores30).toFixed(1) : '—';
  const picco     = scores30.length ? Math.max(...scores30) : '—';
  const minimo    = scores30.length ? Math.min(...scores30) : '—';

  const hoursAgo = lastEntry ? hoursAgoStr(lastEntry.date) : null;
  const isLate   = lastEntry ? (Date.now() - new Date(lastEntry.date + 'T12:00:00').getTime()) > 48 * 3600000 : false;

  return (
    <div className="sh-card">
      <div className="sh-header">
        <DomainEyebrow domain="money" label="Money & Lavoro" />
        <button className="ml-sh-action-btn" onClick={onEdit}>
          {hasToday ? 'Aggiorna' : 'Valuta oggi'}
        </button>
      </div>

      <div className="sh-number-zone">
        <div className="sh-number-left">
          <div className="sh-score-wrap">
            <span className="sh-score-num ml-score-num" aria-label={`Stato obiettivo: ${score ?? '—'} su 10`}>
              {score !== null ? animScore : '—'}
            </span>
            <span className="sh-score-denom">/10</span>
          </div>
          <ChipTag tone={chip.tone}>{chip.label}</ChipTag>
        </div>

        <div className="sh-number-right">
          {sparkScores.length >= 2 ? (
            <>
              <div className="sh-spark-header">
                <span className="sh-spark-label">{sorted.length} valutazion{sorted.length !== 1 ? 'i' : 'e'}</span>
                <TrendPill
                  direction={trend.direction}
                  tone={trend.tone}
                  value={trend.direction === 'up' ? 'in salita' : trend.direction === 'down' ? 'in discesa' : 'stabile'}
                />
              </div>
              <Sparkline data={sparkScores} accent="var(--accent-money)" variant="area" height={80} />
              <MiniStatRow stats={[
                { label: 'Media 30g', value: media30 },
                { label: 'Picco',     value: picco   },
                { label: 'Min',       value: minimo  },
              ]} />
            </>
          ) : (
            <div className="sh-no-data-spark">
              <p>Aggiungi la prima valutazione per vedere il trend.</p>
            </div>
          )}
        </div>
      </div>

      {lastEntry ? (
        <div className="sh-blockquote ml-blockquote">
          <div className="sh-blockquote__meta">
            <span className="sh-blockquote__date">{fmtDate(lastEntry.date)}</span>
          </div>
          <ReflectionText text={lastEntry.text} maxChars={280} />
        </div>
      ) : (
        <div className="sh-empty-state">
          <p className="sh-empty-state__text">
            Valuta periodicamente il tuo obiettivo su Money & Lavoro — entrate, clienti, benessere economico.
          </p>
          <button className="sh-empty-state__cta" style={{ background: 'var(--accent-money)' }} onClick={onEdit}>
            Prima valutazione
          </button>
        </div>
      )}

      {lastEntry && (
        <div className={`sh-footer ${isLate ? 'sh-footer--late' : ''}`}>
          {hasToday ? 'Hai valutato oggi ✓' : isLate ? `Manca la valutazione — ultima ${hoursAgo} →` : `Ultima valutazione ${hoursAgo}`}
        </div>
      )}
    </div>
  );
}

/* ════════════════ MoneyInsightsHero — card destra ════════════════ */
const PERIOD_LABELS = { week: 'Settimana', month: 'Mese' };

function MoneyInsightsHero() {
  const [transazioni] = useFirebaseState('ml_transazioni',  []);
  const [entrateGoal] = useFirebaseState('ml_entrate_goal', { val: 1500, history: [] });
  const [crm]         = useFirebaseState('ml_crm',          []);
  const [outData]     = useFirebaseState('ml_crm_outreach', {});
  const [esperimenti] = useFirebaseState('ml_esperimenti',  []);
  const [benessere]   = useFirebaseState('ml_benessere',    []);

  const [period, setPeriod]         = useState('week');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [syncKey, setSyncKey]       = useState(0);
  const [lastSync, setLastSync]     = useState(Date.now());

  const handleSync = () => { setSyncKey(k => k + 1); setLastSync(Date.now()); };

  const insights = useMemo(() => {
    const bounds = getPeriodBounds(period);
    const { cur, prev } = bounds;

    /* ── ENTRATE ── */
    const entrateCur  = transazioni.filter(t => t.tipo === 'entrata' && inRange(t.date, cur));
    const entratePrev = transazioni.filter(t => t.tipo === 'entrata' && inRange(t.date, prev));
    const sumCur      = entrateCur.reduce((s, t) => s + (t.importo || 0), 0);
    const sumPrev     = entratePrev.reduce((s, t) => s + (t.importo || 0), 0);
    const deltaEnt    = +(sumCur - sumPrev).toFixed(0);

    const thisM     = new Date().toISOString().split('T')[0].slice(0, 7);
    const cmEntrate = transazioni.filter(t => t.tipo === 'entrata' && t.date.slice(0, 7) === thisM).reduce((s, t) => s + (t.importo || 0), 0);
    const goalVal   = typeof entrateGoal === 'number' ? entrateGoal : (entrateGoal?.val || 1500);
    const goalPct   = goalVal > 0 ? Math.min(100, Math.round((cmEntrate / goalVal) * 100)) : 0;

    /* ── CLIENTI ── */
    const outCur = Object.keys(outData)
      .filter(k => inRange(k, cur))
      .reduce((s, k) => s + (outData[k] || 0), 0);
    const outPrev = Object.keys(outData)
      .filter(k => inRange(k, prev))
      .reduce((s, k) => s + (outData[k] || 0), 0);
    const deltaOut = outCur - outPrev;

    const inProposta = crm.filter(c => c.stato === 'proposta').length;
    const acquisiti  = crm.filter(c => c.stato === 'acquisito').length;

    /* ── LAVORO ── */
    const attivi    = esperimenti.filter(e => e.stato === 'attivo');
    const lastCheck = benessere.length ? benessere[benessere.length - 1] : null;

    return { sumCur, deltaEnt, goalPct, cmEntrate, goalVal, outCur, deltaOut, inProposta, acquisiti, attivi: attivi.length, lastCheck, entrateCount: entrateCur.length };
  }, [transazioni, entrateGoal, crm, outData, esperimenti, benessere, period, syncKey]);

  const {
    sumCur, deltaEnt, goalPct, cmEntrate, goalVal, outCur, deltaOut,
    inProposta, acquisiti, attivi, lastCheck, entrateCount,
  } = insights;

  const syncMinsAgo = Math.floor((Date.now() - lastSync) / 60000);
  const syncLabel   = syncMinsAgo < 1 ? 'adesso' : `${syncMinsAgo} min fa`;

  function burnoutTone(v) { return v >= 8 ? 'magenta' : v >= 6 ? 'warning' : 'success'; }
  function purposeTone(v) { return v >= 7 ? 'success' : v >= 4 ? 'neutral' : 'magenta'; }

  const entrateRows = [
    {
      icon: 'euro',
      title: 'Entrate',
      value: eur(sumCur),
      trend: deltaEnt !== 0 ? { direction: deltaEnt > 0 ? 'up' : 'down', tone: deltaEnt > 0 ? 'positive' : 'negative', delta: `${deltaEnt > 0 ? '+' : ''}${eur(deltaEnt)}` } : null,
      subInfo: `${entrateCount} transazion${entrateCount !== 1 ? 'i' : 'e'}`,
    },
    {
      icon: 'target',
      title: 'Obiettivo mese',
      value: `${goalPct}%`,
      subInfo: `${eur(cmEntrate)} su ${eur(goalVal)}`,
      trend: goalPct >= 100 ? { direction: 'up', tone: 'positive', delta: '✓ raggiunto' } : null,
    },
  ];

  const clientiRows = [
    {
      icon: 'send',
      title: 'Outreach',
      value: `${outCur} contatti`,
      trend: deltaOut !== 0 ? { direction: deltaOut > 0 ? 'up' : 'down', tone: 'neutral', delta: `${deltaOut > 0 ? '+' : ''}${deltaOut}` } : null,
    },
    {
      icon: 'people',
      title: 'Pipeline',
      value: `${inProposta} proposta · ${acquisiti} acquisiti`,
      subInfo: `${crm.length} contatti totali`,
    },
  ];

  const lavoroRows = [
    {
      icon: 'flask',
      title: 'Esperimenti attivi',
      value: `${attivi}`,
      subInfo: attivi === 0 ? 'Nessuno in corso' : `${attivi} tiny experiment${attivi !== 1 ? 's' : ''}`,
    },
    lastCheck ? {
      icon: 'heart',
      title: 'Burnout',
      value: `${lastCheck.burnout}/10`,
      trend: null,
      subInfo: `Purpose ${lastCheck.purpose}/10 · Carico ${lastCheck.carico}/10`,
    } : {
      icon: 'heart',
      title: 'Benessere',
      value: '—',
      subInfo: 'Nessun check registrato',
    },
  ].filter(Boolean);

  const entrateTrend = deltaEnt > 0 ? { direction: 'up', tone: 'positive' } : deltaEnt < 0 ? { direction: 'down', tone: 'negative' } : null;
  const outreachTrend = deltaOut > 0 ? { direction: 'up', tone: 'positive' } : null;

  return (
    <div className="ih-card">
      <div className="ih-header">
        <span className="ih-eyebrow">INSIGHT · {PERIOD_LABELS[period].toUpperCase()}</span>
        <div className="ih-period-wrap">
          <button className="ih-period-btn" onClick={() => setPeriodOpen(p => !p)} aria-expanded={periodOpen}>
            {PERIOD_LABELS[period]} ▾
          </button>
          {periodOpen && (
            <div className="ih-period-dropdown">
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`ih-period-option${period === key ? ' ih-period-option--active' : ''}`}
                  onClick={() => { setPeriod(key); setPeriodOpen(false); }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ih-groups">
        <InsightGroup color="var(--accent-money)" label="ENTRATE" groupTrend={entrateTrend} rows={entrateRows} />
        <div className="ih-separator" />
        <InsightGroup color="var(--color-teal)" label="CLIENTI" groupTrend={outreachTrend} rows={clientiRows} />
        <div className="ih-separator" />
        <InsightGroup color="var(--color-success)" label="LAVORO" groupTrend={null} rows={lavoroRows} />
      </div>

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

/* ════════════════ export principale ════════════════ */
export default function MoneyHeroSection() {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-left">
          <BentoCard className="hero-bento-card" style={{ height: '100%' }}>
            <MoneyScoreHero onEdit={() => setShowEdit(true)} />
          </BentoCard>
        </div>
        <div className="hero-right">
          <BentoCard className="hero-bento-card" style={{ height: '100%' }}>
            <MoneyInsightsHero />
          </BentoCard>
        </div>
      </div>

      <DetailDrawer
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        eyebrow="Money & Lavoro"
        title="Stato Obiettivo"
        headerStats={[]}
        accentColor="var(--accent-money)"
      >
        <div style={{ padding: '0 8px' }}>
          <ObjectiveStatus
            tabKey="ml_obj_status"
            placeholder="Come stai con i soldi e il lavoro oggi?"
          />
        </div>
      </DetailDrawer>
    </section>
  );
}
