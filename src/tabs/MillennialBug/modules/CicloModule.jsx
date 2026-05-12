import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard           from '../../../components/primitives/BentoCard';
import DetailDrawer        from '../../../components/primitives/DetailDrawer';
import CheckCicloDrawer    from '../drawers/CheckCicloDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
}

export default function CicloModule() {
  const [checks] = useFirebaseState('pd_check_ciclo', []);
  const [open, setOpen] = useState(false);

  const checks_arr = Array.isArray(checks) ? checks : [];

  const { lastCheck, daysToNext, isAvailable, lastSentiment } = useMemo(() => {
    const lastCheck   = checks_arr[0] || null;
    const elapsed     = lastCheck ? daysSince(lastCheck.data) : 999;
    const daysToNext  = lastCheck ? Math.max(0, 30 - elapsed) : 0;
    const isAvailable = elapsed >= 25;
    const lastSentiment = lastCheck?.compassione_check?.tono_sostenibile ?? null;
    return { lastCheck, daysToNext, isAvailable, lastSentiment };
  }, [checks_arr]);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Ciclo 🔄</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Check
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
        <div className="mb-mod-body">
          {/* Countdown */}
          {!lastCheck ? (
            <>
              <div className="mb-mod-now-badge">PRIMO CHECK DISPONIBILE</div>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                margin: '6px 0 0',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}>
                Nessun check ancora. Avvia il primo quando sei pronto.
              </p>
            </>
          ) : isAvailable ? (
            <>
              <div className="mb-mod-now-badge">DISPONIBILE ORA</div>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                margin: '6px 0 0',
                lineHeight: 1.55,
              }}>
                Sono passati {daysSince(lastCheck.data)} giorni dall'ultimo check.
              </p>
            </>
          ) : (
            <>
              <div className="mb-mod-countdown">
                <span className="mb-mod-countdown-num">{daysToNext}</span>
                <span className="mb-mod-countdown-lbl">giorni al prossimo check</span>
              </div>
            </>
          )}

          {/* Last check summary */}
          {lastCheck && (
            <div style={{
              marginTop: 'auto',
              paddingTop: 10,
              borderTop: '1px solid var(--color-line)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-ink-muted)',
              }}>
                Ultimo check — {fmtDate(lastCheck.data)}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: lastSentiment === true
                    ? 'var(--color-success)'
                    : lastSentiment === false
                      ? 'var(--color-magenta)'
                      : 'var(--color-ink-muted)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  color: 'var(--color-ink-muted)',
                }}>
                  Tono {lastSentiment === true
                    ? 'sostenibile ✓'
                    : lastSentiment === false
                      ? 'da monitorare'
                      : '—'
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Check di Ciclo"
        headerStats={[
          { label: 'Check totali', value: checks_arr.length },
          { label: 'Prossimo',     value: isAvailable ? 'Ora' : `${daysToNext}gg` },
        ]}
        accentColor={MB_ACCENT}
      >
        <CheckCicloDrawer />
      </DetailDrawer>
    </>
  );
}
