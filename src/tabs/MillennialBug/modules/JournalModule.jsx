import { useState, useMemo } from 'react';
import { useFirebaseState }    from '../../../hooks/useFirebaseState';
import BentoCard               from '../../../components/primitives/BentoCard';
import DetailDrawer            from '../../../components/primitives/DetailDrawer';
import JournalProgettoDrawer   from '../drawers/JournalProgettoDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function JournalModule() {
  const [journal] = useFirebaseState('pd_journal_progetto', []);
  const [open, setOpen] = useState(false);

  const entries = Array.isArray(journal) ? journal : [];

  const stats = useMemo(() => {
    const now    = new Date();
    const y      = now.getFullYear();
    const m      = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}`;

    const thisMonth = entries.filter(e => e.date?.startsWith(prefix));
    const sorted    = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const lastEntry = sorted[0] || null;

    // Top tags this week
    const today = now.toISOString().split('T')[0];
    const monDay = new Date(now);
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    monDay.setDate(now.getDate() - dow);
    const weekStart = monDay.toISOString().split('T')[0];

    const weekEntries = entries.filter(e => e.date >= weekStart && e.date <= today);
    const tagCounts   = {};
    weekEntries.forEach(e => (e.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }));
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    return { monthCount: thisMonth.length, lastEntry, topTags };
  }, [entries]);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Journal ✍️</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Leggi
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
              <p>Il journal è vuoto. Scrivi quando ti viene.</p>
            </div>
          ) : (
            <>
              <div className="mb-mod-metric">
                <span className="mb-mod-metric__value">{stats.monthCount}</span>
                <span className="mb-mod-metric__unit">entry questo mese</span>
              </div>

              {stats.lastEntry && (
                <div style={{
                  marginTop: 10,
                  flex: 1,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-ink-muted)',
                    marginBottom: 4,
                  }}>
                    {fmtDate(stats.lastEntry.date)}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 12,
                    color: 'var(--color-ink-muted)',
                    margin: 0,
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {stats.lastEntry.text}
                  </p>
                </div>
              )}

              {stats.topTags.length > 0 && (
                <div className="mb-mod-tags" style={{ marginTop: 8 }}>
                  {stats.topTags.map(t => (
                    <span key={t} className="mb-mod-tag">{t}</span>
                  ))}
                </div>
              )}

              <div className="mb-mod-footer">
                <span className="mb-mod-footer-val">{entries.length}</span>
                <span className="mb-mod-footer-lbl">entry totali</span>
              </div>
            </>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Journal Progetto"
        headerStats={[
          { label: 'Questo mese', value: stats.monthCount },
          { label: 'Totale',      value: entries.length   },
        ]}
        accentColor={MB_ACCENT}
      >
        <JournalProgettoDrawer />
      </DetailDrawer>
    </>
  );
}
