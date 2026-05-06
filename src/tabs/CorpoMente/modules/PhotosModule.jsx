import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard            from '../../../components/primitives/BentoCard';
import DomainEyebrow        from '../../../components/primitives/DomainEyebrow';
import EmptyState           from '../../../components/primitives/EmptyState';
import DetailDrawer         from '../../../components/primitives/DetailDrawer';
import ProgressiCorpoDrawer from '../drawers/ProgressiCorpoDrawer';
import './modules.css';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
}

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/* ── SizeS ── */
function SizeS({ last, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}>
      {last ? (
        <>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--color-ink)' }}>
            {count}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
            session{count !== 1 ? 'i' : 'e'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 'auto' }}>
            Ultima: {fmtDate(last.date)}
          </span>
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessuna foto ancora
        </span>
      )}
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ last, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {last ? (
        <>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)', margin: 0 }}>
            Ultima sessione: {fmtDate(last.date)} · {count} session{count !== 1 ? 'i' : 'e'}
          </p>
          <div className="mod-photo-row">
            {last.front
              ? <img src={last.front} alt="Frontale" className="mod-photo-thumb" />
              : <div className="mod-photo-placeholder">📷</div>
            }
            {last.side
              ? <img src={last.side} alt="Laterale" className="mod-photo-thumb" />
              : null
            }
          </div>
        </>
      ) : (
        <EmptyState
          illustration="📷"
          title="Nessuna foto ancora"
          description="Documenta i tuoi progressi ogni lunedì."
        />
      )}
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ sorted, count }) {
  const recent = sorted.slice(0, 3);
  const last   = sorted[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {last ? (
        <>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)', margin: 0 }}>
            {count} session{count !== 1 ? 'i' : 'e'} totali
          </p>
          <div className="mod-photo-row">
            {recent.flatMap(p => [
              p.front ? <img key={`${p.id}-f`} src={p.front} alt="Frontale" className="mod-photo-thumb" /> : <div key={`${p.id}-f`} className="mod-photo-placeholder">📷</div>,
              p.side  ? <img key={`${p.id}-s`} src={p.side}  alt="Laterale" className="mod-photo-thumb" /> : null,
            ]).filter(Boolean).slice(0, 4)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? 'var(--color-teal)' : 'rgba(43,179,168,0.3)',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === 0 ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                  {fmtDate(p.date)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          illustration="📷"
          title="Nessuna foto ancora"
          description="Documenta i tuoi progressi ogni lunedì."
        />
      )}
    </div>
  );
}

/* ── main export ── */
export default function PhotosModule({ size = 'M' }) {
  const [photos] = useFirebaseState('sv_progressi_photos', []);
  const [open, setOpen] = useState(false);

  const sorted = [...photos].sort((a, b) => b.date.localeCompare(a.date));
  const last   = sorted[0];
  const count  = sorted.length;

  const eyebrow = (
    <DomainEyebrow
      domain="fitness"
      label="Foto progressi"
      icon={size !== 'S' ? <CameraIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      + Sessione
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
          {size === 'S' && <SizeS last={last} count={count} />}
          {size === 'M' && <SizeM last={last} count={count} />}
          {size === 'L' && <SizeL sorted={sorted} count={count} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Foto progressi"
        headerStats={[
          { label: 'Sessioni totali', value: count },
          { label: 'Ultima sessione', value: last ? new Date(last.date + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—' },
        ]}
        accentColor="var(--color-teal)"
      >
        <ProgressiCorpoDrawer />
      </DetailDrawer>
    </>
  );
}
