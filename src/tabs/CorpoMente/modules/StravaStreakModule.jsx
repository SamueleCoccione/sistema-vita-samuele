import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard     from '../../../components/primitives/BentoCard';
import ProgressRing  from '../../../components/primitives/ProgressRing';
import StreakCounter  from '../../../components/primitives/StreakCounter';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import Sparkline     from '../../../components/primitives/Sparkline';
import MiniStatRow   from '../../../components/primitives/MiniStatRow';
import TrendPill     from '../../../components/primitives/TrendPill';
import RuckingDrawer from '../drawers/RuckingDrawer';
import { getMondayStr, weekRangeShort } from '../../../utils/weekRange';
import './modules.css';

function calcStreak(activities) {
  const actSet = new Set(activities.map(a => a.date));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (actSet.has(d.toISOString().split('T')[0])) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function getLast7DayKm(activities) {
  const today = new Date();
  const actMap = {};
  activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0); });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return parseFloat((actMap[d.toISOString().split('T')[0]] || 0).toFixed(2));
  });
}

function buildMiniHeatmap28(activities) {
  const actMap = {};
  activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0); });
  const today = new Date();
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - todayDow));
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 27);
  const cells = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const s = cur.toISOString().split('T')[0];
    cells.push({ date: s, km: actMap[s] || 0, isFuture: cur > today });
    cur.setDate(cur.getDate() + 1);
  }
  return cells; // exactly 28
}

function getBestWeek(activities) {
  const weekMap = {};
  activities.forEach(a => {
    const d = new Date(a.date + 'T12:00:00');
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - dow);
    const key = mon.toISOString().split('T')[0];
    if (!weekMap[key]) weekMap[key] = { km: 0, sessions: 0 };
    weekMap[key].km += a.km || 0;
    weekMap[key].sessions++;
  });
  return Object.values(weekMap).reduce(
    (best, w) => w.km > best.km ? w : best,
    { km: 0, sessions: 0 }
  );
}

function miniHeatColor(km, isFuture) {
  if (isFuture) return 'transparent';
  if (km === 0)  return 'rgba(31,24,18,0.06)';
  if (km < 4)    return 'rgba(43,179,168,0.30)';
  if (km < 8)    return 'rgba(43,179,168,0.62)';
  return '#2BB3A8';
}

/* ── icons ── */
const FootprintsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 6C7 4.5 8 3 9.5 3S12 4.5 12 6c0 1.5-1 3-2.5 4L7 12" />
    <path d="M17 6C17 4.5 16 3 14.5 3S12 4.5 12 6c0 1.5 1 3 2.5 4L17 12" />
    <ellipse cx="8" cy="15" rx="2" ry="3" transform="rotate(-10 8 15)" />
    <ellipse cx="16" cy="15" rx="2" ry="3" transform="rotate(10 16 15)" />
  </svg>
);

/* ── mini heatmap ── */
function MiniHeatmap({ cells }) {
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 3 }}>
        {['L','M','M','G','V','S','D'].map((d, i) => (
          <span key={i} style={{
            flex: 1, textAlign: 'center',
            fontFamily: 'var(--font-ui)', fontSize: 8, fontWeight: 600,
            color: 'var(--color-ink-muted)', letterSpacing: '0.04em',
          }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              height: 10, borderRadius: 2,
              background: miniHeatColor(cell.km, cell.isFuture),
              border: (!cell.isFuture && cell.km === 0) ? '1px solid rgba(31,24,18,0.10)' : 'none',
            }}
            title={cell.isFuture ? '' : `${cell.date}: ${cell.km > 0 ? cell.km.toFixed(1) + ' km' : 'riposo'}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── size S ── */
function SizeS({ stats }) {
  const { weekCount, ruckTarget, pct, weekKm, streak } = stats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <ProgressRing value={pct} size={52} thickness={6} gradient="teal" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1, color: 'var(--color-ink)' }}>
            {weekCount}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)', margin: '0 2px' }}>/</span>{ruckTarget}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
            sessioni
          </span>
          {streak > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-flame)', marginTop: 2 }}>
              🔥 {streak}gg
            </span>
          )}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {weekRangeShort()}
      </div>
    </div>
  );
}

/* ── size M ── */
function SizeM({ stats }) {
  const { weekCount, ruckTarget, pct, weekKm, deltaKm, last7DayKm, streak, avgKm } = stats;
  const deltaDir  = deltaKm >= 0 ? 'up' : 'down';
  const deltaTone = deltaKm >= 0 ? 'positive' : 'negative';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ProgressRing value={pct} size={68} thickness={7} gradient="teal" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: 'var(--color-ink)' }}>
              {weekKm.toFixed(1)}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>km</span>
            <TrendPill direction={deltaDir} tone={deltaTone} value={`${deltaKm >= 0 ? '+' : ''}${deltaKm.toFixed(1)} km`} />
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4, display: 'block' }}>
            {weekCount}/{ruckTarget} sessioni · {pct}%
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', opacity: 0.7, marginTop: 2, display: 'block' }}>
            {weekRangeShort()}
          </span>
        </div>
      </div>

      {last7DayKm.some(v => v > 0) && (
        <Sparkline data={last7DayKm} accent="var(--color-teal)" variant="area" height={34} />
      )}

      <MiniStatRow stats={[
        { label: 'Streak',   value: streak,            unit: 'gg' },
        { label: 'Media',    value: avgKm.toFixed(1),  unit: 'km' },
        { label: 'Zaino',   value: 10,                 unit: 'kg' },
      ]} />
    </div>
  );
}

/* ── size L ── */
function SizeL({ stats }) {
  const { weekCount, ruckTarget, pct, weekKm, deltaKm, last7DayKm, streak, avgKm, miniHeatmap, bestWeek } = stats;
  const deltaDir  = deltaKm >= 0 ? 'up' : 'down';
  const deltaTone = deltaKm >= 0 ? 'positive' : 'negative';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ProgressRing value={pct} size={68} thickness={7} gradient="teal" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: 'var(--color-ink)' }}>
              {weekKm.toFixed(1)}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>km</span>
            <TrendPill direction={deltaDir} tone={deltaTone} value={`${deltaKm >= 0 ? '+' : ''}${deltaKm.toFixed(1)} km`} />
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4, display: 'block' }}>
            {weekCount}/{ruckTarget} sessioni · {pct}%
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', opacity: 0.7, marginTop: 2, display: 'block' }}>
            {weekRangeShort()}
          </span>
        </div>
      </div>

      {last7DayKm.some(v => v > 0) && (
        <Sparkline data={last7DayKm} accent="var(--color-teal)" variant="area" height={34} />
      )}

      <MiniStatRow stats={[
        { label: 'Streak',  value: streak,           unit: 'gg' },
        { label: 'Media',   value: avgKm.toFixed(1), unit: 'km' },
        { label: 'Zaino',  value: 10,                unit: 'kg' },
      ]} />

      <MiniHeatmap cells={miniHeatmap} />

      {bestWeek.km > 0 && (
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5,
        }}>
          Settimana migliore: {bestWeek.km.toFixed(1)} km · {bestWeek.sessions} session{bestWeek.sessions !== 1 ? 'i' : 'e'}
        </p>
      )}
    </div>
  );
}

/* ── main export ── */
export default function StravaStreakModule({ size = 'M' }) {
  const [activities] = useFirebaseState('sv_strava_activities', []);
  const [goals]      = useFirebaseState('sv_weekly_goals',      []);
  const [open, setOpen] = useState(false);

  const monday     = getMondayStr(0);
  const prevMonday = getMondayStr(-1);

  const stats = useMemo(() => {
    const week       = activities.filter(a => a.date >= monday);
    const lastWeek   = activities.filter(a => a.date >= prevMonday && a.date < monday);
    const weekCount  = week.length;
    const weekKm     = week.reduce((s, a)  => s + (a.km || 0), 0);
    const lastWeekKm = lastWeek.reduce((s, a) => s + (a.km || 0), 0);
    const deltaKm    = weekKm - lastWeekKm;
    const ruckTarget = goals.find(g => g.type === 'rucking')?.target ?? 6;
    const pct        = Math.min(100, Math.round((weekCount / ruckTarget) * 100));
    const totalKm    = activities.reduce((s, a) => s + (a.km || 0), 0);
    const totalElev  = activities.reduce((s, a) => s + (a.elevation || 0), 0);
    const streak     = calcStreak(activities);
    const last7DayKm = getLast7DayKm(activities);
    const avgKm      = activities.length > 0 ? totalKm / activities.length : 0;
    const miniHeatmap = buildMiniHeatmap28(activities);
    const bestWeek   = getBestWeek(activities);
    return { weekCount, weekKm, lastWeekKm, deltaKm, ruckTarget, pct, totalKm, totalElev, streak, last7DayKm, avgKm, miniHeatmap, bestWeek };
  }, [activities, goals, monday, prevMonday]);

  const eyebrow = (
    <DomainEyebrow
      domain="fitness"
      label="Rucking"
      icon={size !== 'S' ? <FootprintsIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Dettagli
    </button>
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
          {size === 'S' && <SizeS stats={stats} />}
          {size === 'M' && <SizeM stats={stats} />}
          {size === 'L' && <SizeL stats={stats} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Rucking — Strava"
        headerStats={[
          { label: 'Attività totali', value: activities.length },
          { label: 'Km totali',       value: stats.totalKm.toFixed(1), unit: ' km' },
          { label: 'Dislivello',      value: stats.totalElev,           unit: ' m'  },
          { label: 'Zaino fisso',     value: 10,                        unit: ' kg' },
        ]}
        accentColor="#2BB3A8"
      >
        <RuckingDrawer />
      </DetailDrawer>
    </>
  );
}
