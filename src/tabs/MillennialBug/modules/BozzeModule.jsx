import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard    from '../../../components/primitives/BentoCard';
import DetailDrawer from '../../../components/primitives/DetailDrawer';
import BozzeDrawer  from '../drawers/BozzeDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';

const STATUS_COLORS = {
  idea:       { bg: 'rgba(31,24,18,0.06)',   color: 'var(--color-ink-muted)' },
  bozza:      { bg: 'var(--mb-accent-soft)', color: 'var(--mb-accent)'       },
  pronta:     { bg: 'rgba(43,179,168,0.15)', color: 'var(--color-teal)'      },
  archiviata: { bg: 'rgba(31,24,18,0.04)',   color: 'var(--color-ink-muted)' },
};

export default function BozzeModule() {
  const [bozze] = useFirebaseState('pd_bozze', []);
  const [open, setOpen] = useState(false);

  const entries = Array.isArray(bozze) ? bozze : [];
  const active  = entries.filter(e => e.status !== 'archiviata');
  const preview = active.slice(0, 3);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Bozze & Idee 💡</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Tutte
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
          {active.length === 0 ? (
            <div className="mb-mod-empty">
              <p>Nessuna idea ancora. Buttane dentro una quando ti viene.</p>
            </div>
          ) : (
            <>
              <div className="mb-mod-metric">
                <span className="mb-mod-metric__value">{active.length}</span>
                <span className="mb-mod-metric__unit">in lavorazione</span>
              </div>

              <div className="mb-mod-list" style={{ flex: 1, marginTop: 10 }}>
                {preview.map(e => {
                  const sc = STATUS_COLORS[e.status] || STATUS_COLORS.idea;
                  return (
                    <div key={e.id} className="mb-mod-list-item">
                      <span className="mb-mod-list-dot" />
                      <span className="mb-mod-list-text">{e.titolo || '—'}</span>
                      <span
                        className="mb-mod-list-badge"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {e.status}
                      </span>
                    </div>
                  );
                })}
                {active.length > 3 && (
                  <span style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                    color: 'var(--color-ink-muted)',
                    marginLeft: 10,
                  }}>
                    +{active.length - 3} altre
                  </span>
                )}
              </div>

              <div className="mb-mod-footer">
                <span className="mb-mod-footer-val">
                  {entries.filter(e => e.status === 'pronta').length}
                </span>
                <span className="mb-mod-footer-lbl">pronte a pubblicare</span>
              </div>
            </>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Bozze e Idee"
        headerStats={[
          { label: 'Attive',   value: active.length },
          { label: 'Pronte',   value: entries.filter(e => e.status === 'pronta').length },
          { label: 'Archivio', value: entries.filter(e => e.status === 'archiviata').length },
        ]}
        accentColor={MB_ACCENT}
      >
        <BozzeDrawer />
      </DetailDrawer>
    </>
  );
}
