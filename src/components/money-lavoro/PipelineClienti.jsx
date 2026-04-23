import { useState } from 'react';

const KEY          = 'ml_pipeline';
const OUTREACH_KEY = 'ml_outreach';

const STATI = ['contattato', 'risposto', 'proposta', 'acquisito', 'perso'];

const STATO_COLOR = {
  contattato: 'var(--text3)',
  risposto:   'var(--text2)',
  proposta:   '#7a9a3a',
  acquisito:  'var(--accent-text)',
  perso:      '#b94040',
};
const STATO_BG = {
  acquisito: 'var(--accent)',
  perso:     '#fde8e8',
};

const eur      = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const todayStr = () => new Date().toISOString().split('T')[0];

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function loadOutreach() {
  try {
    const d = JSON.parse(localStorage.getItem(OUTREACH_KEY) || '{}');
    return d.date === todayStr() ? !!d.done : false;
  } catch { return false; }
}

const EMPTY = { nome: '', valore_stimato: '', stato: 'contattato', ultimo_contatto: todayStr(), note: '' };

export default function PipelineClienti() {
  const [clients,  setClients]  = useState(load);
  const [outreach, setOutreach] = useState(loadOutreach);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [filter,   setFilter]   = useState('tutti');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.nome) return;
    const entry = { ...form, valore_stimato: parseFloat(form.valore_stimato) || 0 };
    const next  = editId
      ? clients.map(c => c.id === editId ? { ...c, ...entry } : c)
      : [{ id: Date.now(), ...entry }, ...clients];
    setClients(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setShowForm(false);
    setEditId(null);
    setForm({ ...EMPTY });
  };

  const openEdit = c => {
    setForm({ nome: c.nome, valore_stimato: c.valore_stimato, stato: c.stato, ultimo_contatto: c.ultimo_contatto, note: c.note || '' });
    setEditId(c.id);
    setShowForm(true);
  };

  const updateStato = (id, stato) => {
    const next = clients.map(c => c.id === id ? { ...c, stato, ultimo_contatto: todayStr() } : c);
    setClients(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const remove = id => {
    const next = clients.filter(c => c.id !== id);
    setClients(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const toggleOutreach = () => {
    const next = !outreach;
    setOutreach(next);
    localStorage.setItem(OUTREACH_KEY, JSON.stringify({ date: todayStr(), done: next }));
  };

  const filtered       = filter === 'tutti' ? clients : clients.filter(c => c.stato === filter);
  const pipelineValue  = clients.filter(c => !['acquisito', 'perso'].includes(c.stato)).reduce((s, c) => s + c.valore_stimato, 0);
  const acquisitoValue = clients.filter(c => c.stato === 'acquisito').reduce((s, c) => s + c.valore_stimato, 0);

  return (
    <div>
      <div className="ml-stat-strip">
        <div><div className="ml-stat-label">Pipeline attiva</div><div className="ml-stat-mid">{eur(pipelineValue)}</div></div>
        <div><div className="ml-stat-label">Acquisito</div><div className="ml-stat-mid ml-lime">{eur(acquisitoValue)}</div></div>
        <div>
          <div className="ml-stat-label">Outreach oggi</div>
          <button className={`ml-outreach-btn${outreach ? ' done' : ''}`} onClick={toggleOutreach}>
            {outreach ? '✓ Fatto' : 'Non ancora'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ml-tbl-header">
        <div className="ml-filter-tabs">
          {['tutti', ...STATI].map(s => (
            <button key={s} className={`ml-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <button className="cm-btn" onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ ...EMPTY }); }}>
          {showForm && !editId ? 'Annulla' : '+ Cliente'}
        </button>
      </div>

      {showForm && (
        <div className="ml-form-panel">
          <div className="ml-form-grid">
            <div className="cm-form-group">
              <label className="cm-label">Nome cliente</label>
              <input type="text" className="cm-input" value={form.nome} onChange={e => setF('nome', e.target.value)} />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Valore stimato €</label>
              <input type="number" className="cm-input" value={form.valore_stimato} onChange={e => setF('valore_stimato', e.target.value)} min="0" />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Stato</label>
              <select className="cm-input" value={form.stato} onChange={e => setF('stato', e.target.value)}>
                {STATI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Ultimo contatto</label>
              <input type="date" className="cm-input" value={form.ultimo_contatto} onChange={e => setF('ultimo_contatto', e.target.value)} />
            </div>
            <div className="cm-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="cm-label">Note</label>
              <textarea className="cm-input cm-textarea" value={form.note} onChange={e => setF('note', e.target.value)} rows={2} />
            </div>
          </div>
          <button className="cm-btn" onClick={save}>{editId ? 'Aggiorna' : 'Salva'}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="cm-empty">Nessun cliente in questa fase</div>
      ) : (
        <div className="ml-pipeline-list">
          {filtered.map(c => (
            <div
              key={c.id}
              className="ml-pipeline-card"
              style={{ borderLeft: `3px solid ${STATO_COLOR[c.stato]}` }}
              onClick={() => openEdit(c)}
            >
              <div className="ml-pipeline-top">
                <strong className="ml-pipeline-name">{c.nome}</strong>
                <span className="ml-pipeline-val">{c.valore_stimato > 0 ? eur(c.valore_stimato) : '—'}</span>
              </div>
              <div className="ml-pipeline-meta">
                <select
                  className="ml-stato-select"
                  value={c.stato}
                  style={{ color: STATO_COLOR[c.stato], background: STATO_BG[c.stato] || 'transparent' }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); updateStato(c.id, e.target.value); }}
                >
                  {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="ml-pipeline-date">{c.ultimo_contatto}</span>
                <button className="cm-icon-btn" onClick={e => { e.stopPropagation(); remove(c.id); }}>×</button>
              </div>
              {c.note && <div className="ml-pipeline-note">{c.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
