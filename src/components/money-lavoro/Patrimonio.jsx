import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard     from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import MiniStatRow   from '../primitives/MiniStatRow';
import ChipTag       from '../primitives/ChipTag';
import DetailDrawer  from '../primitives/DetailDrawer';

const KEY = 'ml_patrimonio';
const ACCENT = '#C4873D';

const GROUPS = [
  {
    label: 'Circolante',
    accent: 'var(--color-teal)',
    voci: [
      { k: 'circ_cash',      label: 'Cash',            desc: 'Contanti + carte prepagate' },
      { k: 'circ_bbva',      label: 'BBVA',             desc: 'Saldo conto BBVA'           },
      { k: 'circ_unicredit', label: 'Unicredit',        desc: 'Saldo conto Unicredit'      },
      { k: 'circ_fideuram',  label: 'Fideuram',         desc: 'Saldo conto Fideuram'       },
    ],
  },
  {
    label: 'Fondo Emergenza',
    accent: 'var(--color-flame)',
    voci: [
      { k: 'em_revolut',     label: 'Revolut',          desc: 'Vault / saldo Revolut'        },
      { k: 'em_hype',        label: 'Hype',             desc: 'Saldo Hype'                   },
      { k: 'em_findomestic', label: 'Findomestic',      desc: 'Conto / fondo Findomestic'    },
      { k: 'em_directa',     label: 'Directa',          desc: 'Dossier Directa'              },
      { k: 'em_scalable',    label: 'Scalable Capital', desc: 'Portafoglio Scalable Capital' },
    ],
  },
  {
    label: 'Investimenti',
    accent: 'var(--color-success)',
    voci: [
      { k: 'obbligazioni',   label: 'Obbligazioni',   desc: 'Bond, BTP, fondi obbligazionari' },
      { k: 'pensione',       label: 'Pensione',        desc: 'Fondi pensione, TFR accumulato'  },
      { k: 'azioni_crypto',  label: 'Azioni / Crypto', desc: 'ETF, azioni singole, crypto'     },
    ],
  },
];

const ALL_VOCI  = GROUPS.flatMap(g => g.voci);
const DEFAULTS  = Object.fromEntries([...ALL_VOCI.map(v => [v.k, 0]), ['spese_mensili', 2000]]);
const CIRC_KEYS = ['circ_cash', 'circ_bbva', 'circ_unicredit', 'circ_fideuram'];
const INV_KEYS  = ['obbligazioni', 'pensione', 'azioni_crypto'];

const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);

function runwayTone(mesi) {
  const n = parseFloat(mesi);
  if (isNaN(n)) return 'neutral';
  if (n >= 6) return 'success';
  if (n >= 3) return 'warning';
  return 'magenta';
}

const EuroIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10h12M4 14h12M19.5 6a7 7 0 0 0-7-4 7 7 0 0 0-7 7 7 7 0 0 0 7 7 7 7 0 0 0 7-4" />
  </svg>
);

export default function Patrimonio() {
  const [data, setData] = useFirebaseState(KEY, DEFAULTS);
  const [open, setOpen] = useState(false);
  const [draft,   setDraft]   = useState(DEFAULTS);
  const [editing, setEditing] = useState(false);

  const totale      = ALL_VOCI.reduce((s, v) => s + (Number(data[v.k]) || 0), 0);
  const circolante  = CIRC_KEYS.reduce((s, k) => s + (Number(data[k]) || 0), 0);
  const investimenti = INV_KEYS.reduce((s, k) => s + (Number(data[k]) || 0), 0);
  const spese       = Number(data.spese_mensili) || 2000;
  const runway      = spese > 0 ? (circolante / spese).toFixed(1) : '∞';
  const hasData     = totale > 0;

  const openEdit   = () => { setDraft({ ...data }); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const save       = () => { setData({ ...draft }); setEditing(false); };

  const eyebrow = (
    <DomainEyebrow domain="money" label="Patrimonio" icon={<EuroIcon />} />
  );
  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Dettaglio
    </button>
  );

  const headerStats = [
    { label: 'Totale',       value: eur(totale)       },
    { label: 'Circolante',   value: eur(circolante)   },
    { label: 'Investimenti', value: eur(investimenti) },
    { label: 'Runway',       value: `${runway} mesi`  },
  ];

  return (
    <>
      <BentoCard eyebrow={eyebrow} action={action} className="mod-card" onClick={() => setOpen(true)}>
        <div className="mod-body">
          {!hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span style={{ fontSize: 28 }}>💰</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                Inserisci il tuo patrimonio
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
                  {eur(totale)}
                </span>
                <div style={{ marginTop: 8 }}>
                  <ChipTag tone={runwayTone(runway)}>
                    {runway === '∞' ? 'Runway ∞' : `${runway} mesi runway`}
                  </ChipTag>
                </div>
              </div>
              <MiniStatRow stats={[
                { label: 'Circolante',   value: eur(circolante)   },
                { label: 'Investimenti', value: eur(investimenti) },
                { label: 'Spese/mese',   value: eur(spese)        },
              ]} />
            </div>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => { setOpen(false); setEditing(false); }}
        eyebrow="Money & Lavoro"
        title="Patrimonio"
        headerStats={headerStats}
        primaryAction={editing ? { label: 'Salva', onClick: save } : { label: 'Aggiorna valori', onClick: openEdit }}
        secondaryAction={editing ? { label: 'Annulla', onClick: cancelEdit } : undefined}
        accentColor={ACCENT}
      >
        <div className="dr-content">

          {/* ── Edit form ── */}
          {editing && (
            <section className="dr-section">
              <h3 className="dr-section-title">Aggiorna valori</h3>
              <div className="ml-edit-grid">
                {GROUPS.map(g => (
                  <div key={g.label} style={{ marginBottom: 16 }}>
                    <div className="ml-edit-group-label" style={{ color: g.accent }}>{g.label}</div>
                    {g.voci.map(v => (
                      <div key={v.k} className="ml-edit-row">
                        <div>
                          <div className="cm-label">{v.label}</div>
                          <div className="ml-edit-desc">{v.desc}</div>
                        </div>
                        <input
                          type="number"
                          className="cm-input ml-num-input"
                          value={draft[v.k]}
                          onChange={e => setDraft(d => ({ ...d, [v.k]: e.target.value }))}
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="ml-edit-row ml-edit-sep">
                  <div>
                    <div className="cm-label">Spese mensili €</div>
                    <div className="ml-edit-desc">Usate per calcolare il runway</div>
                  </div>
                  <input
                    type="number"
                    className="cm-input ml-num-input"
                    value={draft.spese_mensili}
                    onChange={e => setDraft(d => ({ ...d, spese_mensili: e.target.value }))}
                    min="0"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── Breakdown per gruppo ── */}
          {GROUPS.map(g => {
            const groupTotal = g.voci.reduce((s, v) => s + (Number(data[v.k]) || 0), 0);
            return (
              <section key={g.label} className="dr-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="dr-section-title" style={{ margin: 0 }}>{g.label}</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                    {eur(groupTotal)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.voci.map(v => {
                    const val = Number(data[v.k]) || 0;
                    const pct = totale > 0 ? (val / totale) * 100 : 0;
                    return (
                      <div key={v.k} className="ml-bkd-row">
                        <span className="ml-bkd-label">{v.label}</span>
                        <div className="ml-bkd-bar-wrap">
                          <div className="ml-bkd-bar" style={{ width: `${pct}%`, background: g.accent }} />
                        </div>
                        <span className="ml-bkd-val">{eur(val)}</span>
                        <span className="ml-bkd-pct">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* ── Runway detail ── */}
          <section className="dr-section">
            <h3 className="dr-section-title">Runway</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--color-ink)' }}>
                {runway}
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)' }}>mesi</span>
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', margin: '8px 0 0' }}>
              Circolante {eur(circolante)} ÷ spese mensili {eur(spese)}
            </p>
          </section>

        </div>
      </DetailDrawer>
    </>
  );
}
