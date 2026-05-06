import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard     from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import ChipTag       from '../../../components/primitives/ChipTag';
import EmptyState    from '../../../components/primitives/EmptyState';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import JournalDrawer from '../drawers/JournalDrawer';
import './modules.css';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

const TAG_TONE = {
  lavoro: 'teal',   relazioni: 'magenta', cibo: 'warning',
  alcol: 'warning', corpo: 'success',     soldi: 'neutral',
  famiglia: 'success', tribù: 'teal',     paura: 'magenta',
  gioia: 'success', rabbia: 'magenta',
};

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ── SizeS ── */
function SizeS({ latest, entriesCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}>
      {latest ? (
        <>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
            {fmtDate(latest.date)}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.4, color: 'var(--color-ink)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            "{latest.text}"
          </span>
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessuna entry ancora
        </span>
      )}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 'auto' }}>
        {entriesCount} entr{entriesCount !== 1 ? 'y' : 'y'}
      </span>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ recent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {recent.length > 0 ? (
        <div className="mod-journal-list">
          {recent.slice(0, 2).map(e => (
            <div key={e.id} className="mod-journal-entry" style={{ borderLeft: '2px solid var(--color-magenta)', paddingLeft: 8 }}>
              <p className="mod-journal-date">{fmtDate(e.date)}</p>
              <p className="mod-journal-text" style={{ WebkitLineClamp: 2 }}>"{e.text}"</p>
              {e.tags?.length > 0 && (
                <div className="mod-journal-tags">
                  {e.tags.slice(0, 3).map(t => (
                    <ChipTag key={t} tone={TAG_TONE[t] || 'neutral'}>{t}</ChipTag>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="✍️"
          title="Nessuna entry ancora"
          description="Inizia a scrivere: anche tre righe bastano."
        />
      )}
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ recent, tagFrequency }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {recent.length > 0 ? (
        <>
          <div className="mod-journal-list">
            {recent.map(e => (
              <div key={e.id} className="mod-journal-entry" style={{ borderLeft: '2px solid var(--color-magenta)', paddingLeft: 8 }}>
                <p className="mod-journal-date">{fmtDate(e.date)}</p>
                <p className="mod-journal-text">"{e.text}"</p>
                {e.tags?.length > 0 && (
                  <div className="mod-journal-tags">
                    {e.tags.slice(0, 4).map(t => (
                      <ChipTag key={t} tone={TAG_TONE[t] || 'neutral'}>{t}</ChipTag>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {tagFrequency.length > 0 && (
            <>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', margin: '4px 0 0' }}>
                Tag frequenti (30gg)
              </p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {tagFrequency.map(({ tag, count }) => (
                  <span key={tag} style={{
                    fontFamily: 'var(--font-ui)', fontSize: 11,
                    padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(180,103,214,0.12)',
                    color: 'var(--color-magenta)',
                  }}>
                    {tag} <span style={{ opacity: 0.6 }}>{count}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <EmptyState
          illustration="✍️"
          title="Nessuna entry ancora"
          description="Inizia a scrivere: anche tre righe bastano."
        />
      )}
    </div>
  );
}

/* ── main export ── */
export default function JournalModule({ size = 'M' }) {
  const [entries] = useFirebaseState('sv_daily_journal', []);
  const [open, setOpen] = useState(false);

  const recent = useMemo(() =>
    [...entries]
      .sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0))
      .slice(0, 3),
    [entries],
  );

  const tagFrequency = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutStr = cutoff.toISOString().split('T')[0];
    const freq = {};
    entries
      .filter(e => e.date >= cutStr)
      .forEach(e => (e.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
  }, [entries]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = entries.filter(e => e.date?.startsWith(monthKey)).length;

  const eyebrow = (
    <DomainEyebrow
      domain="mind"
      label="Journal"
      icon={size !== 'S' ? <PenIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Scrivi</button>
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
          {size === 'S' && <SizeS latest={recent[0]} entriesCount={entries.length} />}
          {size === 'M' && <SizeM recent={recent} />}
          {size === 'L' && <SizeL recent={recent} tagFrequency={tagFrequency} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Daily Journal"
        headerStats={[
          { label: 'Entry totali', value: entries.length },
          { label: 'Questo mese', value: thisMonth },
        ]}
        accentColor="var(--color-magenta)"
      >
        <JournalDrawer />
      </DetailDrawer>
    </>
  );
}
