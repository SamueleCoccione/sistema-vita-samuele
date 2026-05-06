import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard         from '../../../components/primitives/BentoCard';
import DomainEyebrow     from '../../../components/primitives/DomainEyebrow';
import ProgressRing      from '../../../components/primitives/ProgressRing';
import DetailDrawer      from '../../../components/primitives/DetailDrawer';
import WeeklyGoalsDrawer from '../drawers/WeeklyGoalsDrawer';
import { getMondayStr, weekRangeShort } from '../../../utils/weekRange';
import './modules.css';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 7l3 3 6-6" />
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

function GoalRow({ goal, done }) {
  return (
    <div className="mod-goal-item">
      <div className={`mod-goal-check ${done ? 'mod-goal-check--done' : ''}`}>
        {done && <CheckIcon />}
      </div>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: done ? 'var(--color-ink-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none' }}>
        {goal.text}
      </span>
    </div>
  );
}

/* ── SizeS ── */
function SizeS({ stats }) {
  const { doneCount, total, pct } = stats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <ProgressRing value={pct} size={52} thickness={6} gradient="teal" />
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1, color: 'var(--color-ink)' }}>
            {doneCount}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)', margin: '0 2px' }}>/</span>{total}
          </span>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 2 }}>
            obiettivi
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {weekRangeShort()}
      </div>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ stats }) {
  const { doneCount, total, pct, preview } = stats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ProgressRing value={pct} size={60} thickness={7} gradient="teal" />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--color-ink)' }}>
            {doneCount}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--color-ink-muted)', margin: '0 3px' }}>/</span>{total}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 3 }}>
            {pct}% completato
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', opacity: 0.7, marginTop: 2 }}>
            {weekRangeShort()}
          </div>
        </div>
      </div>
      <div className="mod-goals-list">
        {preview.map(g => <GoalRow key={g.id} goal={g} done={g._done} />)}
        {total > 3 && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
            +{total - 3} altri
          </span>
        )}
      </div>
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ stats }) {
  const { doneCount, total, pct, allGoals } = stats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ProgressRing value={pct} size={60} thickness={7} gradient="teal" />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--color-ink)' }}>
            {doneCount}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--color-ink-muted)', margin: '0 3px' }}>/</span>{total}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 3 }}>
            {pct}% completato questa settimana
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', opacity: 0.7, marginTop: 2 }}>
            {weekRangeShort()}
          </div>
        </div>
      </div>
      <div className="mod-goals-list" style={{ flex: 1 }}>
        {allGoals.map(g => <GoalRow key={g.id} goal={g} done={g._done} />)}
        {total === 0 && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
            Nessun obiettivo impostato.
          </span>
        )}
      </div>
    </div>
  );
}

/* ── main export ── */
export default function WeeklyGoalsModule({ size = 'M' }) {
  const [goals]      = useFirebaseState('sv_weekly_goals',      []);
  const [activities] = useFirebaseState('sv_strava_activities', []);
  const [open, setOpen] = useState(false);

  const monday   = getMondayStr();
  const ruckCount = activities.filter(a => a.date >= monday).length;

  const stats = useMemo(() => {
    function isDone(g) {
      if (g.type === 'rucking') return ruckCount >= (g.target || 6);
      if (g.type === 'numeric') return (g.current || 0) >= (g.target || 1);
      return !!g.done;
    }
    const allGoals = goals.map(g => ({ ...g, _done: isDone(g) }));
    const done = allGoals.filter(g => g._done).length;
    const pct  = goals.length > 0 ? Math.round((done / goals.length) * 100) : 0;
    return {
      doneCount: done,
      total:     goals.length,
      pct,
      preview:   allGoals.slice(0, 3),
      allGoals,
    };
  }, [goals, ruckCount]);

  const eyebrow = (
    <DomainEyebrow
      domain="goal"
      label="Obiettivi"
      icon={size !== 'S' ? <TargetIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Modifica</button>
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
        title="Obiettivi settimana"
        headerStats={[
          { label: 'Completati',   value: `${stats.doneCount}/${stats.total}` },
          { label: 'Progressione', value: stats.pct, unit: '%' },
        ]}
        accentColor="var(--color-success)"
      >
        <WeeklyGoalsDrawer />
      </DetailDrawer>
    </>
  );
}
