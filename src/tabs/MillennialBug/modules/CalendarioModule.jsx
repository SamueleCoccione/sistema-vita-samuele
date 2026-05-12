import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard        from '../../../components/primitives/BentoCard';
import DetailDrawer     from '../../../components/primitives/DetailDrawer';
import CalendarioDrawer from '../drawers/CalendarioDrawer';
import './modules.css';

const MB_ACCENT  = '#5C50CC';
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

function getWeekDays() {
  const today = new Date();
  const dow   = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon
  const days  = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function CalendarioModule() {
  const [calendario] = useFirebaseState('pd_calendario', []);
  const [open, setOpen] = useState(false);

  const entries = Array.isArray(calendario) ? calendario : [];

  const { weekDays, nextPub, today } = useMemo(() => {
    const today    = new Date().toISOString().split('T')[0];
    const weekDays = getWeekDays();

    const nextPub = [...entries]
      .filter(c => c.data_prevista >= today && !['pubblicato', 'saltato'].includes(c.status))
      .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista))[0] || null;

    return { weekDays, nextPub, today };
  }, [entries]);

  const scheduledDates = new Set(
    entries
      .filter(c => !['pubblicato', 'saltato'].includes(c.status))
      .map(c => c.data_prevista)
  );

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Calendario 📅</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Vista mese
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
          {/* 7-day strip */}
          <div className="mb-mod-week-strip">
            {weekDays.map((date, i) => {
              const isToday   = date === today;
              const isPast    = date < today;
              const hasEvent  = scheduledDates.has(date);
              const dayNum    = new Date(date + 'T12:00:00').getDate();

              let dotClass = 'mb-mod-week-dot--empty';
              if (isToday)        dotClass = 'mb-mod-week-dot--today';
              else if (hasEvent)  dotClass = 'mb-mod-week-dot--has';
              else if (isPast)    dotClass = 'mb-mod-week-dot--past';

              return (
                <div key={date} className="mb-mod-week-day">
                  <span className="mb-mod-week-day-label">{DAYS_SHORT[i]}</span>
                  <span className={`mb-mod-week-dot ${dotClass}`}>{dayNum}</span>
                </div>
              );
            })}
          </div>

          {/* Next pub */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: 6,
            }}>
              Prossima pubblicazione
            </div>

            {nextPub ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {nextPub.titolo || '—'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-ink-muted)',
                }}>
                  {fmtDate(nextPub.data_prevista)}
                </div>
              </>
            ) : (
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                fontStyle: 'italic',
              }}>
                Nessuna in calendario
              </span>
            )}
          </div>

          <div className="mb-mod-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-ink-muted)',
            }}>
              {entries.filter(c => !['pubblicato','saltato'].includes(c.status)).length} programmate
            </span>
          </div>
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Calendario Editoriale"
        headerStats={[
          { label: 'In arrivo', value: entries.filter(c => !['pubblicato','saltato'].includes(c.status)).length },
          { label: 'Pubblicate', value: entries.filter(c => c.status === 'pubblicato').length },
        ]}
        accentColor={MB_ACCENT}
      >
        <CalendarioDrawer />
      </DetailDrawer>
    </>
  );
}
