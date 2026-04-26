import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'ml_patrimonio';

const GROUPS = [
  {
    label: 'Circolante',
    voci: [
      { k: 'circ_cash',      label: 'Cash',      desc: 'Contanti + carte prepagate varie' },
      { k: 'circ_bbva',      label: 'BBVA',       desc: 'Saldo conto BBVA'                },
      { k: 'circ_unicredit', label: 'Unicredit',  desc: 'Saldo conto Unicredit'           },
      { k: 'circ_fideuram',  label: 'Fideuram',   desc: 'Saldo conto Fideuram'            },
    ],
  },
  {
    label: 'Fondo Emergenza',
    voci: [
      { k: 'em_revolut',   label: 'Revolut',         desc: 'Vault / saldo Revolut'       },
      { k: 'em_hype',      label: 'Hype',             desc: 'Saldo Hype'                  },
      { k: 'em_findomestic', label: 'Findomestic',     desc: 'Conto / fondo Findomestic'   },
      { k: 'em_directa',   label: 'Directa',          desc: 'Dossier Directa'             },
      { k: 'em_scalable',  label: 'Scalable Capital', desc: 'Portafoglio Scalable Capital'},
    ],
  },
  {
    label: 'Investimenti',
    voci: [
      { k: 'obbligazioni',  label: 'Obbligazioni',  desc: 'Bond, BTP, fondi obbligazionari' },
      { k: 'pensione',      label: 'Pensione',       desc: 'Fondi pensione, TFR accumulato'  },
      { k: 'azioni_crypto', label: 'Azioni / Crypto', desc: 'ETF, azioni singole, crypto'    },
    ],
  },
];

const ALL_VOCI = GROUPS.flatMap(g => g.voci);

const DEFAULTS = Object.fromEntries([...ALL_VOCI.map(v => [v.k, 0]), ['spese_mensili', 2000]]);

const ACCENT_PER_GROUP = ['var(--accent)', '#4a7ab5', '#c87030'];

const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function Patrimonio() {
  const [data, setData]   = useFirebaseState(KEY, DEFAULTS);
  const [draft,   setDraft]   = useState(DEFAULTS);
  const [editing, setEditing] = useState(false);

  const totale      = ALL_VOCI.reduce((s, v) => s + (Number(data[v.k]) || 0), 0);
  const circolante  = ['circ_cash', 'circ_bbva', 'circ_unicredit', 'circ_fideuram'].reduce((s, k) => s + (Number(data[k]) || 0), 0);
  const runway      = data.spese_mensili > 0 ? (circolante / data.spese_mensili).toFixed(1) : '∞';

  const openEdit   = () => { setDraft({ ...data }); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const save = () => {
    setData({ ...draft });
    setEditing(false);
  };

  return (
    <div>
      {/* Hero stats */}
      <div className="ml-hero">
        <div className="ml-hero-left">
          <div className="ml-stat-label">Patrimonio netto</div>
          <div className="ml-stat-big">{eur(totale)}</div>
        </div>
        <div>
          <div className="ml-stat-label">Circolante totale</div>
          <div className="ml-stat-mid">{eur(circolante)}</div>
        </div>
        <div className="ml-runway-box">
          <div className="ml-stat-label">Runway</div>
          <div className="ml-stat-big ml-lime">{runway}</div>
          <div className="ml-stat-sub">mesi · {eur(data.spese_mensili)}/m</div>
        </div>
        <button className="cm-btn cm-btn-ghost" onClick={editing ? cancelEdit : openEdit}>
          {editing ? 'Annulla' : 'Aggiorna valori'}
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="ml-edit-panel">
          <div className="ml-edit-grid">
            {GROUPS.map((g, gi) => (
              <div key={g.label}>
                {gi > 0 && <div style={{ height: 8 }} />}
                <div className="ml-edit-group-label">{g.label}</div>
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
          <button className="cm-btn" onClick={save}>Salva</button>
        </div>
      )}

      {/* Breakdown bars per gruppo */}
      {GROUPS.map((g, gi) => {
        const groupTotal = g.voci.reduce((s, v) => s + (Number(data[v.k]) || 0), 0);
        const accent     = ACCENT_PER_GROUP[gi];
        return (
          <div key={g.label} className="ml-breakdown" style={{ marginBottom: 8 }}>
            <div className="ml-bkd-group-head">
              <span className="ml-bkd-group-label">{g.label}</span>
              <span className="ml-bkd-group-tot">{eur(groupTotal)}</span>
            </div>
            {g.voci.map(v => {
              const val = Number(data[v.k]) || 0;
              const pct = totale > 0 ? (val / totale) * 100 : 0;
              return (
                <div key={v.k} className="ml-bkd-row ml-bkd-sub">
                  <span className="ml-bkd-label">{v.label}</span>
                  <div className="ml-bkd-bar-wrap">
                    <div className="ml-bkd-bar" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                  <span className="ml-bkd-val">{eur(val)}</span>
                  <span className="ml-bkd-pct">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
