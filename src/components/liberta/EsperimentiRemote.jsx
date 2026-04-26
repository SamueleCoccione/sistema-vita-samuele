import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'lib_exp_remote';

const DEFAULT_EXP = [
  {
    id: 1,
    name: 'Lavorare solo da remoto per una settimana',
    duration: '1 settimana',
    goal: 'Validare che posso produrre lo stesso output da fuori Milano',
    result: '',
    lessons: '',
    status: 'in-corso',
    addedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 2,
    name: 'Acquisire 1 cliente da piattaforma internazionale',
    duration: '3 mesi',
    goal: 'Ottenere il primo pagamento da un cliente non italiano',
    result: '',
    lessons: '',
    status: 'in-corso',
    addedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 3,
    name: 'Pubblicare portfolio online e ricevere 1 contatto inbound',
    duration: '2 mesi',
    goal: 'Portfolio live, 1 contatto in arrivo senza outreach attivo',
    result: '',
    lessons: '',
    status: 'in-corso',
    addedAt: new Date().toISOString().split('T')[0],
  },
];

const STATI = [
  { v: 'in-corso',   l: 'In corso',   cls: 'lb-exp-incorso'   },
  { v: 'completato', l: 'Completato', cls: 'lb-exp-completato' },
  { v: 'fallito',    l: 'Fallito',    cls: 'lb-exp-fallito'    },
];

const EMPTY = { name: '', duration: '', goal: '', result: '', lessons: '', status: 'in-corso' };

export default function EsperimentiRemote() {
  const [exps, setExps] = useFirebaseState(KEY, DEFAULT_EXP);
  const [openIds, setOpenIds] = useState(new Set([1, 2, 3]));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState(null);

  const save = next => setExps(next);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = id => setOpenIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submitExp = () => {
    if (!form.name.trim()) return;
    if (editId) {
      save(exps.map(e => e.id === editId ? { ...e, ...form } : e));
      setEditId(null);
    } else {
      save([{ ...form, id: Date.now(), addedAt: new Date().toISOString().split('T')[0] }, ...exps]);
    }
    setForm({ ...EMPTY });
    setShowForm(false);
  };

  const updateField = (id, field, val) => save(exps.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeExp   = id => save(exps.filter(e => e.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="cm-btn" onClick={() => { setShowForm(s => !s); setEditId(null); setForm({ ...EMPTY }); }}>
          {showForm && !editId ? 'Annulla' : '+ Nuovo esperimento'}
        </button>
      </div>

      {showForm && (
        <div className="lb-loc-form" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field xl">
              <label className="cm-label">Nome esperimento *</label>
              <input className="cm-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="es. Lavorare una settimana da Barcellona" />
            </div>
            <div className="lb-field md">
              <label className="cm-label">Durata</label>
              <input className="cm-input" value={form.duration} onChange={e => setF('duration', e.target.value)} placeholder="1 settimana, 3 mesi..." />
            </div>
            <div className="lb-field sm">
              <label className="cm-label">Stato</label>
              <select className="cm-input" value={form.status} onChange={e => setF('status', e.target.value)}>
                {STATI.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field xl">
              <label className="cm-label">Obiettivo</label>
              <input className="cm-input" value={form.goal} onChange={e => setF('goal', e.target.value)} placeholder="Cosa vuoi validare o ottenere?" />
            </div>
          </div>
          {(form.status === 'completato' || form.status === 'fallito') && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <div className="lb-field xl">
                  <label className="cm-label">Risultato</label>
                  <input className="cm-input" value={form.result} onChange={e => setF('result', e.target.value)} placeholder="Cosa è successo concretamente?" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <div className="lb-field xl">
                  <label className="cm-label">Lessons learned</label>
                  <input className="cm-input" value={form.lessons} onChange={e => setF('lessons', e.target.value)} placeholder="Cosa faresti diversamente?" />
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={submitExp}>{editId ? 'Salva' : 'Aggiungi'}</button>
            <button className="cm-btn cm-btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Annulla</button>
          </div>
        </div>
      )}

      <div className="lb-exp-list">
        {exps.map(exp => {
          const isOpen = openIds.has(exp.id);
          const statusCls = exp.status === 'completato' ? 'lb-exp-completato' : exp.status === 'fallito' ? 'lb-exp-fallito' : 'lb-exp-incorso';
          const statusLabel = STATI.find(s => s.v === exp.status)?.l || exp.status;
          return (
            <div key={exp.id} className={`lb-exp-item ${exp.status}`}>
              <div className="lb-exp-head" onClick={() => toggle(exp.id)}>
                <span className="lb-exp-name">{exp.name}</span>
                {exp.duration && <span className="lb-exp-dur">{exp.duration}</span>}
                <span className={`lb-exp-status-badge ${statusCls}`}>{statusLabel}</span>
                <span style={{ fontSize: 8, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div className="lb-exp-body">
                  {exp.goal && (
                    <div className="lb-exp-field">
                      <span className="lb-exp-field-lbl">Obiettivo</span>
                      <span className="lb-exp-field-val">{exp.goal}</span>
                    </div>
                  )}
                  {exp.result && (
                    <div className="lb-exp-field">
                      <span className="lb-exp-field-lbl">Risultato</span>
                      <span className="lb-exp-field-val">{exp.result}</span>
                    </div>
                  )}
                  {exp.lessons && (
                    <div className="lb-exp-field">
                      <span className="lb-exp-field-lbl">Lessons learned</span>
                      <span className="lb-exp-field-val">{exp.lessons}</span>
                    </div>
                  )}
                  {/* Inline editable fields */}
                  <div className="lb-exp-field">
                    <span className="lb-exp-field-lbl">Aggiorna risultato</span>
                    <input className="cm-input" style={{ fontSize: 12 }}
                      value={exp.result || ''}
                      onChange={e => updateField(exp.id, 'result', e.target.value)}
                      placeholder="Cosa è successo..." />
                  </div>
                  <div className="lb-exp-field">
                    <span className="lb-exp-field-lbl">Lessons learned</span>
                    <input className="cm-input" style={{ fontSize: 12 }}
                      value={exp.lessons || ''}
                      onChange={e => updateField(exp.id, 'lessons', e.target.value)}
                      placeholder="Cosa faresti diversamente..." />
                  </div>
                  <div className="lb-exp-actions">
                    <span className="cm-label">Stato:</span>
                    {STATI.map(s => (
                      <button
                        key={s.v}
                        className={`lb-pcheck${exp.status === s.v ? ' done' : ''}`}
                        onClick={() => updateField(exp.id, 'status', s.v)}
                      >{s.l}</button>
                    ))}
                    <button
                      className="cm-btn cm-btn-ghost"
                      style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                      onClick={() => removeExp(exp.id)}
                    >Rimuovi</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
