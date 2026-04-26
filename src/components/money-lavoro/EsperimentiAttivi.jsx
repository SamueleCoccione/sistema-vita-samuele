import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'ml_esperimenti';

const STATI = ['attivo', 'completato', 'abbandonato'];
const VALUTAZIONI = [
  { k: 'funziona',       label: 'Funziona',      dot: 'var(--accent)'  },
  { k: 'non_funziona',   label: 'Non funziona',  dot: '#b94040'        },
  { k: 'troppo_presto',  label: 'Troppo presto', dot: 'var(--text3)'   },
];

const EMPTY = { nome: '', stato: 'attivo', ore: '', ritorno_economico: '', valutazione: 'troppo_presto', note: '' };

export default function EsperimentiAttivi() {
  const [items, setItems] = useFirebaseState(KEY, []);
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

  return (
    <div>
      <div className="ml-stat-strip">
        <div><div className="ml-stat-label">Attivi</div><div className="ml-stat-mid">{attivi.length}</div></div>
        <div><div className="ml-stat-label">Ore investite</div><div className="ml-stat-mid">{totalOre}h</div></div>
        <div><div className="ml-stat-label">Ritorno economico</div><div className="ml-stat-mid ml-lime">€{totalRit}</div></div>
        <button className="cm-btn" onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ ...EMPTY }); }}>
          {showForm && !editId ? 'Annulla' : '+ Esperimento'}
        </button>
      </div>

      {showForm && (
        <div className="ml-form-panel">
          <div className="ml-form-grid">
            <div className="cm-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="cm-label">Nome esperimento</label>
              <input
                type="text"
                className="cm-input"
                value={form.nome}
                onChange={e => setF('nome', e.target.value)}
                placeholder="es. Newsletter settimanale, Corso online, Consulenza B2B..."
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
              <textarea className="cm-input cm-textarea" value={form.note} onChange={e => setF('note', e.target.value)} rows={2} placeholder="Ipotesi, osservazioni, prossimi step..." />
            </div>
          </div>
          <button className="cm-btn" onClick={save}>{editId ? 'Aggiorna' : 'Salva'}</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="cm-empty">Nessun esperimento — aggiungi il primo tiny experiment</div>
      ) : (
        <div className="ml-exp-list">
          {items.map(item => {
            const val  = VALUTAZIONI.find(v => v.k === item.valutazione);
            const euro = Number(item.ritorno_economico) || 0;
            return (
              <div key={item.id} className={`ml-exp-card ml-exp-${item.stato}`} onClick={() => openEdit(item)}>
                <div className="ml-exp-top">
                  <div className="ml-exp-name-row">
                    <span className="ml-exp-dot" style={{ background: val?.dot || 'var(--text3)' }} />
                    <strong className="ml-exp-name">{item.nome}</strong>
                  </div>
                  <span className={`ml-val-badge ml-val-${item.valutazione}`}>{val?.label}</span>
                </div>
                <div className="ml-exp-meta">
                  <span className="ml-badge ml-badge-stato">{item.stato}</span>
                  <span className="ml-exp-stat">{item.ore || 0}h investite</span>
                  {euro > 0 && <span className="ml-exp-stat ml-lime">€{euro} ritorno</span>}
                  <button className="cm-icon-btn" onClick={e => { e.stopPropagation(); remove(item.id); }}>×</button>
                </div>
                {item.note && <div className="ml-exp-note">{item.note}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
