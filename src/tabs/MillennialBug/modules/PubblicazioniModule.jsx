import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard          from '../../../components/primitives/BentoCard';
import DetailDrawer       from '../../../components/primitives/DetailDrawer';
import PubblicazioniDrawer from '../drawers/PubblicazioniDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function getMondayStr(weekOffset = 0) {
  const d    = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff + weekOffset * 7);
  return mon.toISOString().split('T')[0];
}

function getSundayStr(weekOffset = 0) {
  const mon = new Date(getMondayStr(weekOffset) + 'T00:00:00');
  mon.setDate(mon.getDate() + 6);
  return mon.toISOString().split('T')[0];
}

export default function PubblicazioniModule() {
  const [pubs] = useFirebaseState('pd_pubblicazioni', []);
  const [open, setOpen] = useState(false);

  const entries = Array.isArray(pubs) ? pubs : [];

  const stats = useMemo(() => {
    const now    = new Date();
    const y      = now.getFullYear();
    const m      = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}`;
    const today  = now.toISOString().split('T')[0];

    const thisMonth = entries.filter(p => p.date?.startsWith(prefix));

    // Week streak
    let streak = 0;
    let wOffset = 0;
    while (true) {
      const wMon = getMondayStr(wOffset);
      const wEnd = wOffset === 0 ? today : getSundayStr(wOffset);
      const hasPub = entries.some(p => p.date >= wMon && p.date <= wEnd);
      if (!hasPub) break;
      streak++;
      wOffset--;
      if (streak > 104) break;
    }

    const lastPub = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0] || null;

    return { monthCount: thisMonth.length, streak, lastPub };
  }, [entries]);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Pubblicazioni 📝</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Archivio
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
          {entries.length === 0 ? (
            <div className="mb-mod-empty">
              <p>Nessuna pubblicazione ancora. Inizia quando sei pronto.</p>
            </div>
          ) : (
            <>
              <div className="mb-mod-metric">
                <span className="mb-mod-metric__value">{stats.monthCount}</span>
                <span className="mb-mod-metric__unit">pezzi questo mese</span>
              </div>

              <div className="mb-mod-footer">
                <div className="mb-mod-footer-stat">
                  <span className="mb-mod-footer-val">{stats.streak}</span>
                  <span className="mb-mod-footer-lbl">sett. di streak</span>
                </div>
                {stats.lastPub && (
                  <>
                    <span className="mb-mod-sep">·</span>
                    <div className="mb-mod-footer-stat" style={{ flex: 1, minWidth: 0 }}>
                      <span className="mb-mod-footer-lbl">ultimo:</span>
                      <span
                        className="mb-mod-footer-val"
                        style={{
                          fontFamily: 'var(--font-ui)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 120,
                          display: 'inline-block',
                          verticalAlign: 'bottom',
                        }}
                      >
                        {stats.lastPub.titolo}
                      </span>
                      <span className="mb-mod-footer-lbl">{fmtDate(stats.lastPub.date)}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Pubblicazioni"
        headerStats={[
          { label: 'Questo mese', value: stats.monthCount },
          { label: 'Totale',      value: entries.length   },
          { label: 'Streak',      value: `${stats.streak} sett.` },
        ]}
        accentColor={MB_ACCENT}
      >
        <PubblicazioniDrawer />
      </DetailDrawer>
    </>
  );
}
