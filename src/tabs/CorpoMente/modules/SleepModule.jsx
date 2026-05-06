import { useState } from 'react';
import BentoCard    from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import DetailDrawer from '../../../components/primitives/DetailDrawer';
import SleepDrawer  from '../drawers/SleepDrawer';
import './modules.css';

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const PLACEHOLDER_STATS = [
  { label: 'Ore / notte', icon: '🕐' },
  { label: 'HRV medio',   icon: '💓' },
  { label: 'Profondo',    icon: '🌊' },
  { label: 'Svegli',      icon: '⚡' },
];

/* ── SizeS ── */
function SizeS() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, color: 'var(--color-ink-muted)' }}>
        —
      </span>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
        Import Apple Health
      </span>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PLACEHOLDER_STATS.map(s => (
          <div key={s.label} style={{
            padding: '10px 12px',
            background: 'rgba(107,93,211,0.06)',
            borderRadius: 8,
            border: '1px solid rgba(107,93,211,0.12)',
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-ink-muted)' }}>—</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onOpen(); }}
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
          padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(107,93,211,0.3)',
          background: 'rgba(107,93,211,0.08)', color: 'var(--color-rest, #6B5DD3)',
          cursor: 'pointer', textAlign: 'center',
        }}
      >
        Importa Apple Health XML
      </button>
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
        Il tracking del sonno non è ancora attivo. Importa l'export XML da Apple Health per vedere le tue statistiche.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PLACEHOLDER_STATS.map(s => (
          <div key={s.label} style={{
            padding: '10px 12px',
            background: 'rgba(107,93,211,0.06)',
            borderRadius: 8,
            border: '1px solid rgba(107,93,211,0.12)',
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-ink-muted)' }}>—</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onOpen(); }}
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
          padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(107,93,211,0.3)',
          background: 'rgba(107,93,211,0.08)', color: 'var(--color-rest, #6B5DD3)',
          cursor: 'pointer', textAlign: 'center',
        }}
      >
        Importa Apple Health XML
      </button>
    </div>
  );
}

/* ── main export ── */
export default function SleepModule({ size = 'M' }) {
  const [open, setOpen] = useState(false);

  const eyebrow = (
    <DomainEyebrow
      domain="rest"
      label="Sonno"
      icon={size !== 'S' ? <MoonIcon /> : undefined}
    />
  );

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        className="mod-card"
        compact={size === 'S'}
        onClick={() => setOpen(true)}
      >
        <div className="mod-body">
          {size === 'S' && <SizeS />}
          {size === 'M' && <SizeM onOpen={() => setOpen(true)} />}
          {size === 'L' && <SizeL onOpen={() => setOpen(true)} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Sonno"
        headerStats={[
          { label: 'Ore / notte', value: '—' },
          { label: 'HRV medio',   value: '—' },
          { label: 'Profondo',    value: '—' },
        ]}
        accentColor="#6B5DD3"
      >
        <SleepDrawer />
      </DetailDrawer>
    </>
  );
}
