import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard     from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import MiniStatRow   from '../../../components/primitives/MiniStatRow';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import SleepDrawer   from '../drawers/SleepDrawer';
import './modules.css';

const ACCENT = '#6B5DD3';

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function fmtDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function sleepQuality(durationMinutes, deepSleep) {
  if (durationMinutes >= 420 && (deepSleep || 0) >= 0.20) return { label: 'Ottimo',        color: 'var(--color-success)' };
  if (durationMinutes >= 360 && (deepSleep || 0) >= 0.15) return { label: 'Buono',         color: 'var(--color-flame)' };
  return                                                           { label: 'Insufficiente', color: 'var(--color-magenta)' };
}

/* ── SizeS ── */
function SizeS({ last }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: last ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
        {last ? fmtDuration(last.durationMinutes) : '—'}
      </span>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
        {last ? `${Math.round((last.deepSleep || 0) * 100)}% profondo` : 'nessun dato'}
      </span>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ last }) {
  if (!last) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 28 }}>🌙</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic', textAlign: 'center' }}>
          Connetti Sleep as Android
        </span>
      </div>
    );
  }

  const q = sleepQuality(last.durationMinutes, last.deepSleep);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
            {fmtDuration(last.durationMinutes)}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginBottom: 2 }}>
            ultima notte
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: q.color, textTransform: 'uppercase' }}>
          {q.label}
        </span>
      </div>

      <MiniStatRow stats={[
        { label: 'Profondo', value: `${Math.round((last.deepSleep || 0) * 100)}%` },
        { label: 'Cicli',    value: last.cycles || '—' },
        { label: 'Rating',   value: last.rating ? `${last.rating.toFixed(1)}★` : '—' },
      ]} />
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ last }) {
  if (!last) return <SizeM last={null} />;

  const q = sleepQuality(last.durationMinutes, last.deepSleep);
  const noise = (last.noiseLevel || 0) < 20 ? 'Basso' : (last.noiseLevel || 0) <= 40 ? 'Medio' : 'Alto';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--color-ink)' }}>
            {fmtDuration(last.durationMinutes)}
          </span>
          <div style={{ marginTop: 3 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: q.color, textTransform: 'uppercase' }}>
              {q.label}
            </span>
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
          {new Date(last.toTime).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <MiniStatRow stats={[
        { label: 'Profondo', value: `${Math.round((last.deepSleep || 0) * 100)}%` },
        { label: 'Cicli',    value: last.cycles || '—' },
        { label: 'Rating',   value: last.rating ? `${last.rating.toFixed(1)}★` : '—' },
        { label: 'Rumore',   value: noise },
      ]} />
    </div>
  );
}

/* ── main export ── */
export default function SleepModule({ size = 'M' }) {
  const [log]    = useFirebaseState('sv_sonno_log', []);
  const [config] = useFirebaseState('sv_sonno_config', {});
  const [open, setOpen] = useState(false);

  const last = useMemo(() => {
    if (!log.length) return null;
    return [...log].sort((a, b) => (b.toTime || 0) - (a.toTime || 0))[0];
  }, [log]);

  // connesso se ha un user_token statico oppure dati già importati
  const hasData = !!(config?.user_token) || log.length > 0;

  const eyebrow = (
    <DomainEyebrow
      domain="rest"
      label="Sonno"
      icon={size !== 'S' ? <MoonIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Storico
    </button>
  );

  const headerStats = last
    ? [
        { label: 'Durata',   value: fmtDuration(last.durationMinutes) },
        { label: 'Profondo', value: `${Math.round((last.deepSleep || 0) * 100)}`, unit: '%' },
        { label: 'Rating',   value: last.rating ? last.rating.toFixed(1) : '—', unit: last.rating ? '★' : '' },
        { label: 'Cicli',    value: last.cycles || '—' },
      ]
    : [
        { label: 'Durata',   value: '—' },
        { label: 'Profondo', value: '—' },
        { label: 'Rating',   value: '—' },
        { label: 'Cicli',    value: '—' },
      ];

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        action={size !== 'S' ? action : undefined}
        className="mod-card"
        compact={size === 'S'}
        onClick={() => setOpen(true)}
      >
        <div className="mod-body">
          {size === 'S' && <SizeS last={last} />}
          {size === 'M' && <SizeM last={hasData ? last : null} />}
          {size === 'L' && <SizeL last={hasData ? last : null} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Sonno"
        headerStats={headerStats}
        accentColor={ACCENT}
      >
        <SleepDrawer />
      </DetailDrawer>
    </>
  );
}
