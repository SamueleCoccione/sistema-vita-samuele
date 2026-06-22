import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard    from '../../../components/primitives/BentoCard';
import DetailDrawer from '../../../components/primitives/DetailDrawer';
import WritingDrawer from '../drawers/WritingDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';
const TEAL      = '#2BB3A8';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtMin(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export default function WritingModule() {
  const [sessions] = useFirebaseState('pd_writing_sessions', {});
  const [active]   = useFirebaseState('pd_writing_active', null);
  const [open, setOpen] = useState(false);

  const td = todayStr();
  const todayMin  = sessions[td]?.totalMin || 0;
  const isRunning = !!(active?.startTime);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasData = (sessions[k]?.totalMin || 0) > 0 || (i === 0 && isRunning);
      if (hasData) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [sessions, isRunning]);

  const thisWeekDone = useMemo(() => {
    const today = new Date();
    const dow = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow - 1));
    monday.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < dow; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if ((sessions[k]?.totalMin || 0) > 0) count++;
    }
    return count;
  }, [sessions]);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" style={{ background: TEAL }} />
      <span className="mb-mod-eyebrow-label">Scrittura ✍️</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      {isRunning ? '⏱ In corso' : 'Apri'}
    </button>
  );

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        action={action}
        className="mb-mod-card"
        onClick={() => setOpen(true)}
      >
        <div className="mb-mod-body" style={{ justifyContent: 'space-between' }}>

          {/* Minuti oggi */}
          <div>
            {isRunning ? (
              <div style={{
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
                color: TEAL, letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL, display: 'inline-block', animation: 'mb-pulse 1.4s ease-in-out infinite' }} />
                Timer attivo
              </div>
            ) : (
              <div className="mb-mod-metric">
                <span className="mb-mod-metric__value" style={{ color: todayMin >= 60 ? TEAL : 'var(--color-ink)' }}>
                  {fmtMin(todayMin)}
                </span>
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4 }}>
              {todayMin >= 60
                ? 'Obiettivo raggiunto oggi ✓'
                : todayMin > 0
                  ? `${60 - todayMin} min all'obiettivo`
                  : 'Oggi ancora nessuna sessione'}
            </div>
          </div>

          {/* Footer stats */}
          <div className="mb-mod-footer">
            <div className="mb-mod-footer-stat">
              <span className="mb-mod-footer-val" style={{ color: TEAL }}>{streak}</span>
              <span className="mb-mod-footer-lbl">giorni streak</span>
            </div>
            <span className="mb-mod-sep">·</span>
            <div className="mb-mod-footer-stat">
              <span className="mb-mod-footer-val">{thisWeekDone}/7</span>
              <span className="mb-mod-footer-lbl">questa settimana</span>
            </div>
          </div>
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Scrittura quotidiana"
        headerStats={[
          { label: 'Oggi',        value: fmtMin(todayMin) },
          { label: 'Streak',      value: `${streak}gg` },
          { label: 'Settimana',   value: `${thisWeekDone}/7` },
        ]}
        accentColor={TEAL}
      >
        <WritingDrawer />
      </DetailDrawer>

      <style>{`
        @keyframes mb-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
