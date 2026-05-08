import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard     from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import MiniStatRow   from '../primitives/MiniStatRow';
import ChipTag       from '../primitives/ChipTag';
import EmptyState    from '../primitives/EmptyState';
import DetailDrawer  from '../primitives/DetailDrawer';

const KEY    = 'ml_esperimenti';
const ACCENT = '#C4873D';

const STATI = ['attivo', 'completato', 'abbandonato'];

const VALUTAZIONI = [
  { k: 'funziona',      label: 'Funziona',      tone: 'success',  dot: 'var(--color-success)' },
  { k: 'non_funziona',  label: 'Non funziona',  tone: 'magenta',  dot: 'var(--color-magenta)' },
  { k: 'troppo_presto', label: 'Troppo presto', tone: 'neutral',  dot: 'var(--color-ink-muted)' },
];

const STATO_TONE = { attivo: 'teal', completato: 'success', abbandonato: 'neutral' };

const EMPTY = { nome: '', stato: 'attivo', ore: '', ritorno_economico: '', valutazione: 'troppo_presto', note: '' };

const FlaskIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3h6M9 3v7l-4 9h14l-4-9V3M9 3H7M15 3h2"/>
  </svg>
);

export default function EsperimentiAttivi() {
  const [items, setItems] = useFirebaseState(KEY, []);
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ ...EMPTY });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.nome) return;
    const entry = { ...form, ore: parseFloat(form.ore) || 0, ritorno_economico: parseFloat(form.ritorno_economico) || 0 };
    setItems(editId
      ? items.map(i => i.id === editId ? { ...i, ...entry } : i)
      : [{ id: Date.now(), ...entry }, ...items]);
    setShowForm(false);
    setEditId(null);
    setForm({ ...EMPTY });
  };

  const openEdit = item => {
    setForm({ nome: item.nome, stato: item.stato, ore: item.ore, ritorno_economico: item.ritorno_economico, valutazione: item.valutazione, note: item.note || '' });
    setEditId(item.id);
    setShowForm(true);
  };

  const remove = id => setItems(items.filter(i => i.id !== id));

  const attivi    = items.filter(i => i.stato === 'attivo');
  const totalOre  = attivi.reduce((s, i) => s + (Number(i.ore) || 0), 0);
  const totalRit  = attivi.reduce((s, i) => s + (Number(i.ritorno_economico) || 0), 0);

  const eyebrow = (
    <DomainEyebrow domain="money" label="Tiny Experiments" icon={<FlaskIcon />} />
  );
  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Storico
    </button>
  );

  const headerStats = [
    { label: 'Attivi',      value: attivi.length        },
    { label: 'Ore invest.', value: `${totalOre}h`       },
    { label: 'Ritorno',     value: `€${totalRit}`       },
    { label: 'Totale',      value: items.length          },
  ];

  return (
    <>
      <BentoCard eyebrow={eyebrow} action={action} className="mod-card" onClick={() => setOpen(true)}>
        <div className="mod-body">
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span style={{ fontSize: 28 }}>🧪</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                Lancia il primo esperimento
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
                    {attivi.length}
                  </span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>attivi</span>
                </div>
                {attivi.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {attivi.slice(0, 2).map(i => {
                      const val = VALUTAZIONI.find(v => v.k === i.valutazione);
                      return (
                        <ChipTag key={i.id} tone={val?.tone || 'neutral'}>{i.nome}</ChipTag>
                      );
                    })}
                    {attivi.length > 2 && (
                      <ChipTag tone="neutral">+{attivi.length - 2}</ChipTag>
                    )}
                  </div>
                )}
              </div>
              <MiniStatRow stats={[
                { label: 'Ore invest.',  value: `${totalOre}h`       },
                { label: 'Ritorno',      value: totalRit > 0 ? `€${totalRit}` : '—' },
                { label: 'Completati',   value: items.filter(i => i.stato === 'completato').length },
              ]} />
            </div>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => { setOpen(false); setShowForm(false); setEditId(null); }}
        eyebrow="Money & Lavoro"
        title="Tiny Experiments"
        headerStats={headerStats}
        primaryAction={{ label: '+ Esperimento', onClick: () => { setShowForm(v => !v); setEditId(null); setForm({ ...EMPTY }); } }}
        accentColor={ACCENT}
      >
        <div className="dr-content">

          {/* ── Form ── */}
          {showForm && (
            <section className="dr-section">
              <h3 className="dr-section-title">{editId ? 'Modifica esperimento' : 'Nuovo esperimento'}</h3>
              <div className="ml-form-grid">
                <div className="cm-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="cm-label">Nome esperimento</label>
                  <input
                    type="text"
                    className="cm-input"
                    value={form.nome}
                    onChange={e => setF('nome', e.target.value)}
                    placeholder="es. Newsletter settimanale, Corso online, Consulenza B2B…"
                  />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Stato</label>
                  <select className="cm-input" value={form.stato} onChange={e => setF('stato', e.target.value)}>
                    {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Ore investite</label>
                  <input type="number" className="cm-input" value={form.ore} onChange={e => setF('ore', e.target.value)} min="0" step="0.5" />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Ritorno economico €</label>
                  <input type="number" className="cm-input" value={form.ritorno_economico} onChange={e => setF('ritorno_economico', e.target.value)} min="0" />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Valutazione</label>
                  <select className="cm-input" value={form.valutazione} onChange={e => setF('valutazione', e.target.value)}>
                    {VALUTAZIONI.map(v => <option key={v.k} value={v.k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="cm-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="cm-label">Note</label>
                  <textarea className="cm-input cm-textarea" value={form.note} onChange={e => setF('note', e.target.value)} rows={2} placeholder="Ipotesi, osservazioni, prossimi step…" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="cm-btn" onClick={save}>{editId ? 'Aggiorna' : 'Salva'}</button>
                <button className="cm-btn cm-btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Annulla</button>
              </div>
            </section>
          )}

          {/* ── Lista ── */}
          <section className="dr-section">
            {items.length === 0 ? (
              <EmptyState
                illustration="🧪"
                title="Nessun esperimento"
                description="Lancia il primo tiny experiment — qualcosa di piccolo e misurabile"
                cta="+ Aggiungi"
                onCta={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }); }}
              />
            ) : (
              <div className="ml-exp-list">
                {items.map(item => {
                  const val  = VALUTAZIONI.find(v => v.k === item.valutazione);
                  const euro = Number(item.ritorno_economico) || 0;
                  return (
                    <div
                      key={item.id}
                      className={`ml-exp-card ml-exp-${item.stato}`}
                      onClick={() => openEdit(item)}
                    >
                      <div className="ml-exp-top">
                        <div className="ml-exp-name-row">
                          <span className="ml-exp-dot" style={{ background: val?.dot || 'var(--color-ink-muted)' }} />
                          <strong className="ml-exp-name">{item.nome}</strong>
                        </div>
                        <ChipTag tone={val?.tone || 'neutral'}>{val?.label}</ChipTag>
                      </div>
                      <div className="ml-exp-meta">
                        <ChipTag tone={STATO_TONE[item.stato] || 'neutral'}>{item.stato}</ChipTag>
                        <span className="ml-exp-stat">{item.ore || 0}h investite</span>
                        {euro > 0 && (
                          <span className="ml-exp-stat" style={{ color: 'var(--color-success)' }}>€{euro} ritorno</span>
                        )}
                        <button className="cm-icon-btn" onClick={e => { e.stopPropagation(); remove(item.id); }}>×</button>
                      </div>
                      {item.note && <div className="ml-exp-note">{item.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </DetailDrawer>
    </>
  );
}
