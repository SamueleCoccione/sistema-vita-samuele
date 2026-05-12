import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirebaseState }   from '../../hooks/useFirebaseState';
import BentoCard              from '../../components/primitives/BentoCard';
import ChipTag                from '../../components/primitives/ChipTag';
import TrendPill              from '../../components/primitives/TrendPill';
import Sparkline              from '../../components/primitives/Sparkline';
import MiniStatRow            from '../../components/primitives/MiniStatRow';
import DetailDrawer           from '../../components/primitives/DetailDrawer';
import ObjectiveStatus        from '../../components/ObjectiveStatus';
import PubblicazioniDrawer    from './drawers/PubblicazioniDrawer';
import BozzeDrawer            from './drawers/BozzeDrawer';
import CalendarioDrawer       from './drawers/CalendarioDrawer';
import JournalProgettoDrawer  from './drawers/JournalProgettoDrawer';
import CheckCicloDrawer       from './drawers/CheckCicloDrawer';
import ApprendimentiDrawer    from './drawers/ApprendimentiDrawer';
import RadiciDrawer           from './drawers/RadiciDrawer';
import NordStellaDrawer       from './drawers/NordStellaDrawer';
import './HeroSection.css';

const MB_ACCENT = '#5C50CC';

/* ── helpers ── */

function getISOWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getMondayStr(offset = 0) {
  const d    = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff + offset * 7);
  return mon.toISOString().split('T')[0];
}

function getSundayStr(offset = 0) {
  const mon = getMondayStr(offset);
  const sun = new Date(mon + 'T00:00:00');
  sun.setDate(sun.getDate() + 6);
  return sun.toISOString().split('T')[0];
}

function getWeekStr(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const y     = date.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const wk    = Math.ceil((((date - start) / 86400000) + 1) / 7);
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
}

function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }

function scoreChip(score) {
  if (score === null || score === undefined) return { label: 'Nessuna valutazione', tone: 'neutral' };
  if (score >= 8) return { label: 'In flusso',       tone: 'success' };
  if (score >= 6) return { label: 'Nella norma',     tone: 'neutral' };
  if (score >= 4) return { label: 'In esplorazione', tone: 'warning' };
  if (score >= 2) return { label: 'Sotto pressione', tone: 'magenta' };
  return              { label: 'Recidiva',          tone: 'magenta' };
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
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setValue(target); return; }
    const start = performance.now();
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

/* ── Score Hero (card sinistra) ── */

function ReflectionText({ text, maxChars = 320 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > maxChars;
  const shown  = expanded || !isLong ? text : text.slice(0, maxChars);
  return (
    <div className="mb-sh-reflection">
      <p className="mb-sh-reflection__text">
        "{shown}{!expanded && isLong ? '…' : '"'}
      </p>
      {isLong && !expanded && (
        <button className="mb-sh-expand-btn" onClick={() => setExpanded(true)}>
          Continua a leggere ›
        </button>
      )}
    </div>
  );
}

function ScoreHero({ onEdit }) {
  const [objStatus] = useFirebaseState('pd_obj_status', { score: null, entries: [] });

  const score   = objStatus?.score   ?? null;
  const entries = objStatus?.entries ?? [];
  const sorted  = useMemo(() =>
    [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]
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
  const media30  = scores30.length ? avg(scores30).toFixed(1) : '—';
  const picco    = scores30.length ? Math.max(...scores30) : '—';
  const minimo   = scores30.length ? Math.min(...scores30) : '—';

  const animScore = useCountUp(score ?? 0, 900);

  const hoursAgo = lastEntry
    ? (() => {
        const diff = Date.now() - new Date(lastEntry.date + 'T12:00:00').getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1)  return 'meno di un\'ora fa';
        if (h < 24) return `${h} or${h !== 1 ? 'e' : 'a'} fa`;
        const days = Math.floor(h / 24);
        return `${days} giorn${days !== 1 ? 'i' : 'o'} fa`;
      })()
    : null;
  const isLate = lastEntry
    ? (Date.now() - new Date(lastEntry.date + 'T12:00:00').getTime()) > 48 * 3600000
    : false;

  return (
    <div className="mb-sh-card">
      <div className="mb-sh-header">
        <div className="mb-domain-eyebrow">
          <span className="mb-domain-eyebrow__dot" />
          <span className="mb-domain-eyebrow__label">MILLENNIAL BUG</span>
        </div>
        <button className="mb-sh-action-btn" onClick={onEdit}>
          {hasToday ? 'Aggiorna' : 'Valuta oggi'}
        </button>
      </div>

      <div className="mb-sh-number-zone">
        <div className="mb-sh-number-left">
          <div className="mb-sh-score-wrap">
            <span className="mb-sh-score-num" aria-label={`${score ?? '—'} su 10`}>
              {score !== null ? animScore : '—'}
            </span>
            <span className="mb-sh-score-denom">/10</span>
          </div>
          <ChipTag tone={chip.tone}>{chip.label}</ChipTag>
        </div>
        <div className="mb-sh-number-right">
          {sparkScores.length >= 2 ? (
            <>
              <div className="mb-sh-spark-header">
                <span className="mb-sh-spark-label">
                  {sorted.length} valutazion{sorted.length !== 1 ? 'i' : 'e'}
                </span>
                <TrendPill
                  direction={trend.direction}
                  tone={trend.tone}
                  value={trend.direction === 'up' ? 'in salita' : trend.direction === 'down' ? 'in discesa' : 'stabile'}
                />
              </div>
              <Sparkline data={sparkScores} accent={MB_ACCENT} variant="area" height={80} />
              <MiniStatRow stats={[
                { label: 'Media 30g', value: media30 },
                { label: 'Picco',     value: picco   },
                { label: 'Min',       value: minimo  },
              ]} />
            </>
          ) : (
            <div className="mb-sh-no-data">
              <p>Aggiungi la prima valutazione per vedere il trend.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-sh-valuta-desc">
        <em>Il voto misura come ti stai trattando nel rapporto con il progetto — non i numeri.</em>
      </div>

      {lastEntry ? (
        <div className="mb-sh-blockquote">
          <div className="mb-sh-blockquote__meta">
            <span className="mb-sh-blockquote__date">{fmtDate(lastEntry.date)}</span>
          </div>
          <ReflectionText text={lastEntry.text} maxChars={320} />
        </div>
      ) : (
        <div className="mb-sh-empty-state">
          <p className="mb-sh-empty-state__text">
            Come ti stai trattando nel fare questo progetto?
            Scrivi la prima valutazione.
          </p>
          <button className="mb-sh-empty-state__cta" onClick={onEdit}>Prima valutazione</button>
        </div>
      )}

      {lastEntry && (
        <div className={`mb-sh-footer${isLate ? ' mb-sh-footer--late' : ''}`}>
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

/* ── Insight row / group (card destra) ── */

function InsightRow({ icon, title, value, trend, subInfo, onClick }) {
  return (
    <div
      className="mb-ih-row"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => e.key === 'Enter' && onClick()) : undefined}
      aria-label={`${title}: ${value}`}
    >
      <span className="mb-ih-row__icon" aria-hidden="true">{icon}</span>
      <div className="mb-ih-row__body">
        <div className="mb-ih-row__main">
          <span className="mb-ih-row__title">{title}</span>
          <span className="mb-ih-row__value">{value}</span>
          {trend && <TrendPill direction={trend.direction} tone={trend.tone} value={trend.delta} />}
        </div>
        {subInfo && <span className="mb-ih-row__sub">{subInfo}</span>}
      </div>
    </div>
  );
}

function InsightGroup({ color, label, rows }) {
  return (
    <div className="mb-ih-group">
      <div className="mb-ih-group__header">
        <span className="mb-ih-group__dot" style={{ background: color }} />
        <span className="mb-ih-group__label">{label}</span>
      </div>
      <div className="mb-ih-group__rows">
        {rows.map((row, i) => <InsightRow key={i} {...row} />)}
      </div>
    </div>
  );
}

const StreakIcon   = () => <span style={{ fontSize: 13 }}>🔥</span>;
const PipelineIcon = () => <span style={{ fontSize: 13 }}>📋</span>;
const JournalIcon  = () => <span style={{ fontSize: 13 }}>✍️</span>;
const CycleIcon    = () => <span style={{ fontSize: 13 }}>🔄</span>;
const CompassIcon  = () => <span style={{ fontSize: 13 }}>🧭</span>;
const VoiceIcon    = () => <span style={{ fontSize: 13 }}>🎙</span>;
const RootIcon     = () => <span style={{ fontSize: 13 }}>🌱</span>;
const CalIcon      = () => <span style={{ fontSize: 13 }}>📅</span>;

function InsightsHero({ onOpenDrawer }) {
  const [pubs]        = useFirebaseState('pd_pubblicazioni',      []);
  const [bozze]       = useFirebaseState('pd_bozze',              []);
  const [calendario]  = useFirebaseState('pd_calendario',          []);
  const [journal]     = useFirebaseState('pd_journal_progetto',    []);
  const [checks]      = useFirebaseState('pd_check_ciclo',         []);
  const [apprendim]   = useFirebaseState('pd_apprendimenti_voce',  []);
  const [radici]      = useFirebaseState('pd_radici_settimanali',  []);

  const insights = useMemo(() => {
    const pub_arr  = Array.isArray(pubs)       ? pubs       : [];
    const boz_arr  = Array.isArray(bozze)      ? bozze      : [];
    const cal_arr  = Array.isArray(calendario)  ? calendario  : [];
    const jou_arr  = Array.isArray(journal)    ? journal    : [];
    const chk_arr  = Array.isArray(checks)     ? checks     : [];
    const app_arr  = Array.isArray(apprendim)  ? apprendim  : [];
    const rad_arr  = Array.isArray(radici)     ? radici     : [];

    const today     = new Date().toISOString().split('T')[0];
    const monCur    = getMondayStr(0);
    const sunCur    = getSundayStr(0);
    const monPrev   = getMondayStr(-1);
    const sunPrev   = getSundayStr(-1);

    // ── PUBBLICAZIONI ──
    const pubCur    = pub_arr.filter(p => p.date >= monCur && p.date <= today);
    const pubPrev   = pub_arr.filter(p => p.date >= monPrev && p.date <= sunPrev);
    const pubDelta  = pubCur.length - pubPrev.length;

    // Streak: consecutive weeks with ≥1 pub (going back from current week)
    let streak = 0;
    let wOffset = 0;
    while (true) {
      const wMon = getMondayStr(wOffset);
      const wSun = getSundayStr(wOffset);
      const wEnd = wOffset === 0 ? today : wSun;
      const hasPub = pub_arr.some(p => p.date >= wMon && p.date <= wEnd);
      if (!hasPub) break;
      streak++;
      wOffset--;
      if (streak > 104) break; // safety
    }

    // ── PIPELINE ──
    const bozzeAttive = boz_arr.filter(b => b.status !== 'archiviata').length;
    const nextCal = [...cal_arr]
      .filter(c => c.data_prevista >= today && !['pubblicato','saltato'].includes(c.status))
      .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista))[0] || null;

    // ── VOCE ──
    const journalCur = jou_arr.filter(j => j.date >= monCur && j.date <= today);
    const lastApp    = app_arr.length ? app_arr[0] : null;
    const thisWeek   = getWeekStr();
    const radiceThisWeek = rad_arr.find(r => r.settimana === thisWeek);

    // ── CICLO ──
    const lastCheck  = chk_arr[0] || null;
    const daysToCheck = lastCheck
      ? Math.max(0, 30 - daysSince(lastCheck.data))
      : 0;
    const lastSentiment = lastCheck?.compassione_check?.tono_sostenibile ?? null;

    return {
      pubCur: pubCur.length, pubPrev: pubPrev.length, pubDelta, streak,
      bozzeAttive, nextCal,
      journalCur: journalCur.length, lastApp, radiceThisWeek,
      lastCheck, daysToCheck, lastSentiment,
    };
  }, [pubs, bozze, calendario, journal, checks, apprendim, radici]);

  const pubRows = [
    {
      icon: <StreakIcon />,
      title: 'Pubblicazioni',
      value: `${insights.pubCur} questa settimana`,
      trend: insights.pubDelta !== 0
        ? { direction: insights.pubDelta > 0 ? 'up' : 'down', tone: 'neutral', delta: `${insights.pubDelta > 0 ? '+' : ''}${insights.pubDelta}` }
        : null,
      subInfo: insights.streak > 0 ? `${insights.streak} settiman${insights.streak !== 1 ? 'e' : 'a'} di streak` : null,
      onClick: () => onOpenDrawer('pubblicazioni'),
    },
  ];

  const pipelineRows = [
    {
      icon: <PipelineIcon />,
      title: 'Bozze attive',
      value: `${insights.bozzeAttive} in lavorazione`,
      onClick: () => onOpenDrawer('bozze'),
    },
    {
      icon: <CalIcon />,
      title: 'Prossima pubblicazione',
      value: insights.nextCal ? insights.nextCal.titolo || fmtDate(insights.nextCal.data_prevista) : '—',
      subInfo: insights.nextCal ? fmtDate(insights.nextCal.data_prevista) : 'Nessuna in calendario',
      onClick: () => onOpenDrawer('calendario'),
    },
  ];

  const voceRows = [
    {
      icon: <JournalIcon />,
      title: 'Journal progetto',
      value: `${insights.journalCur} entr${insights.journalCur !== 1 ? 'y' : 'y'} questa settimana`,
      onClick: () => onOpenDrawer('journal'),
    },
    {
      icon: <VoiceIcon />,
      title: 'Apprendimenti voce',
      value: insights.lastApp ? `Ultimo: ${fmtDate(insights.lastApp.date)}` : '—',
      onClick: () => onOpenDrawer('apprendimenti'),
    },
    {
      icon: <RootIcon />,
      title: 'Radice della settimana',
      value: insights.radiceThisWeek
        ? insights.radiceThisWeek.cosa_non_strumentale.slice(0, 40) + (insights.radiceThisWeek.cosa_non_strumentale.length > 40 ? '…' : '')
        : '—',
      onClick: () => onOpenDrawer('radici'),
    },
  ];

  const cicloRows = [
    {
      icon: <CycleIcon />,
      title: 'Check di ciclo',
      value: insights.daysToCheck === 0
        ? 'Disponibile ora'
        : `In ${insights.daysToCheck} giorni`,
      subInfo: insights.lastSentiment !== null
        ? `Ultimo: tono ${insights.lastSentiment ? 'sostenibile ✓' : 'da monitorare'}`
        : null,
      onClick: () => onOpenDrawer('check'),
    },
    {
      icon: <CompassIcon />,
      title: 'Nord Stella',
      value: 'Decisioni strategiche',
      onClick: () => onOpenDrawer('nordstella'),
    },
  ];

  return (
    <div className="mb-ih-card">
      <div className="mb-ih-header">
        <span className="mb-ih-eyebrow">INSIGHT · SETTIMANA {getISOWeek()}</span>
      </div>

      <div className="mb-ih-groups">
        <InsightGroup color={MB_ACCENT}               label="PUBBLICAZIONI" rows={pubRows}      />
        <div className="mb-ih-separator" />
        <InsightGroup color="var(--color-teal)"        label="PIPELINE"      rows={pipelineRows} />
        <div className="mb-ih-separator" />
        <InsightGroup color="var(--color-magenta)"     label="VOCE"          rows={voceRows}     />
        <div className="mb-ih-separator" />
        <InsightGroup color="#C4873D"                  label="CICLO"         rows={cicloRows}    />
      </div>

      <div className="mb-ih-footer">
        <span>Settimana {getISOWeek()}</span>
      </div>
    </div>
  );
}

/* ── Drawer config ── */
const DRAWER_CONFIG = {
  pubblicazioni: { title: 'Pubblicazioni',   accent: MB_ACCENT,                     Content: PubblicazioniDrawer   },
  bozze:         { title: 'Bozze e Idee',    accent: MB_ACCENT,                     Content: BozzeDrawer           },
  calendario:    { title: 'Calendario',       accent: '#C4873D',                     Content: CalendarioDrawer      },
  journal:       { title: 'Journal Progetto', accent: 'var(--color-magenta)',        Content: JournalProgettoDrawer },
  check:         { title: 'Check di Ciclo',   accent: MB_ACCENT,                     Content: CheckCicloDrawer      },
  apprendimenti: { title: 'Apprendimenti Voce', accent: 'var(--color-magenta)',      Content: ApprendimentiDrawer   },
  radici:        { title: 'Radici Settimanali', accent: 'var(--color-teal)',         Content: RadiciDrawer          },
  nordstella:    { title: 'Nord Stella',      accent: MB_ACCENT,                     Content: NordStellaDrawer      },
};

/* ── main export ── */
export default function HeroSection() {
  const [showEdit,   setShowEdit]   = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null);

  const drawerCfg = openDrawer ? DRAWER_CONFIG[openDrawer] : null;

  return (
    <section className="mb-hero-section">
      <div className="mb-hero-content">
        <div className="mb-hero-left">
          <BentoCard className="mb-hero-bento-card" style={{ height: '100%' }}>
            <ScoreHero onEdit={() => setShowEdit(true)} />
          </BentoCard>
        </div>
        <div className="mb-hero-right">
          <BentoCard className="mb-hero-bento-card" style={{ height: '100%' }}>
            <InsightsHero onOpenDrawer={setOpenDrawer} />
          </BentoCard>
        </div>
      </div>

      <DetailDrawer
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        eyebrow="Millennial Bug"
        title="Stato Obiettivo"
        headerStats={[]}
        accentColor={MB_ACCENT}
      >
        <div style={{ padding: '0 8px' }}>
          <ObjectiveStatus
            tabKey="pd_obj_status"
            placeholder="Come ti stai trattando nel fare questo progetto?"
          />
        </div>
      </DetailDrawer>

      {drawerCfg && (
        <DetailDrawer
          isOpen={!!openDrawer}
          onClose={() => setOpenDrawer(null)}
          eyebrow="Millennial Bug"
          title={drawerCfg.title}
          headerStats={[]}
          accentColor={drawerCfg.accent}
        >
          <drawerCfg.Content />
        </DetailDrawer>
      )}
    </section>
  );
}
