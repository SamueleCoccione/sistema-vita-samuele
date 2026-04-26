import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY_PERSONE = 'rel_tribu_persone';
const KEY_EVENTI  = 'rel_tribu_eventi';

const STATI = [
  { id: 'conosciuto', label: 'Conosciuto', color: '#8a8680' },
  { id: 'seguito',    label: 'Seguito',    color: '#4a7ab5' },
  { id: 'connesso',   label: 'Connesso',   color: '#c87030' },
  { id: 'alleato',    label: 'Alleato',    color: '#3a8a2a' },
];

function today()           { return new Date().toISOString().split('T')[0]; }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function fmtDate(s)        { return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }); }
const statoInfo = id => STATI.find(s => s.id === id) || STATI[0];

const EMPTY_P = { nome: '', contesto: '', cosa_fa: '', sinergia: '', stato: 'conosciuto', ultimo_contatto: today(), note: '' };
const EMPTY_E = { nome: '', data: today(), obiettivo: '', incontrati: '', followup: false, note: '' };

export default function TribuNetworking() {
  const [persone, setPersone] = useFirebaseState(KEY_PERSONE, []);
  const [eventi,  setEventi]  = useFirebaseState(KEY_EVENTI, []);
  const [view,    setView]    = useState('persone');
  const [formP,   setFormP]   = useState(null);
  const [editPId, setEditPId] = useState(null);
  const [formE,   setFormE]   = useState(null);
  const [editEId, setEditEId] = useState(null);

  const savePersone = next => setPersone(next);
  const saveEventi  = next => setEventi(next);

  const upsertP = () => {
    if (!formP?.nome.trim()) return;
    const next = editPId
      ? persone.map(p => p.id === editPId ? { ...formP, id: editPId } : p)
      : [...persone, { ...formP, id: Date.now() }];
    savePersone(next); setFormP(null); setEditPId(null);
  };
  const removeP = id => { savePersone(persone.filter(p => p.id !== id)); setFormP(null); setEditPId(null); };
  const contactedToday = id => savePersone(persone.map(p => p.id === id ? { ...p, ultimo_contatto: today() } : p));

  const upsertE = () => {
    if (!formE?.nome.trim()) return;
    const next = editEId
      ? eventi.map(e => e.id === editEId ? { ...formE, id: editEId } : e)
      : [...eventi, { ...formE, id: Date.now() }];
    saveEventi(next); setFormE(null); setEditEId(null);
  };
  const removeE = id => { saveEventi(eventi.filter(e => e.id !== id)); setFormE(null); setEditEId(null); };

  const alerts = useMemo(() =>
    persone.filter(p =>
      p.stato !== 'alleato' &&
      p.ultimo_contatto &&
      daysBetween(p.ultimo_contatto, today()) >= 30
    ),
  [persone]);

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 18, alignItems: 'center' }}>
        {[['persone', 'Persone'], ['eventi', 'Eventi']].map(([v, l]) => (
          <button key={v} className={`crm-view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        {view === 'persone' && (
          <button className="cm-btn" onClick={() => { setFormP({ ...EMPTY_P }); setEditPId(null); }}>+ Persona</button>
        )}
        {view === 'eventi' && (
          <button className="cm-btn" onClick={() => { setFormE({ ...EMPTY_E }); setEditEId(null); }}>+ Evento</button>
        )}
      </div>

      {/* Alerts */}
      {view === 'persone' && alerts.length > 0 && (
        <div className="crm-alerts-list">
          {alerts.map(p => (
            <div key={p.id} className="crm-fu-alert">
              <span>⏰ <strong>{p.nome}</strong> — {daysBetween(p.ultimo_contatto, today())}g senza contatto</span>
              <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => contactedToday(p.id)}>
                Segna oggi
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── PERSONE */}
      {view === 'persone' && (
        <div className="rl-tribu-grid">
          {persone.length === 0 && (
            <div className="cm-empty" style={{ gridColumn: '1/-1' }}>
              Aggiungi le persone interessanti che incontri — eventi, LinkedIn, casualità
            </div>
          )}
          {[...persone].sort((a, b) => a.ultimo_contatto.localeCompare(b.ultimo_contatto)).map(p => {
            const s     = statoInfo(p.stato);
            const days  = daysBetween(p.ultimo_contatto, today());
            const stale = days >= 30 && p.stato !== 'alleato';
            return (
              <div key={p.id} className="rl-tribu-card" onClick={() => { setFormP({ ...p }); setEditPId(p.id); }}>
                <div className="rl-tribu-head">
                  <div className="rl-tribu-name">{p.nome}</div>
                  <div className="rl-stato-pill" style={{ background: s.color + '22', color: s.color, border: `1px solid ${s.color}55` }}>
                    {s.label}
                  </div>
                </div>
                {p.contesto  && <div className="rl-tribu-sub">{p.contesto}</div>}
                {p.cosa_fa   && <div className="rl-tribu-sub" style={{ marginTop: 2 }}>{p.cosa_fa}</div>}
                {p.sinergia  && <div className="rl-tribu-syn">⚡ {p.sinergia}</div>}
                <div className="rl-tribu-last" style={{ color: stale ? '#b94040' : 'var(--text3)' }}>
                  {days === 0 ? 'Oggi' : `${days}g fa`}{stale ? ' ⚠' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EVENTI */}
      {view === 'eventi' && (
        <div className="rl-events-list">
          {eventi.length === 0 && <div className="cm-empty">Nessun evento — aggiungi meetup, conferenze, cene di networking</div>}
          {[...eventi].sort((a, b) => b.data.localeCompare(a.data)).map(e => (
            <div key={e.id} className="rl-event-row" onClick={() => { setFormE({ ...e }); setEditEId(e.id); }}>
              <div className="rl-event-head">
                <span className="rl-event-name">{e.nome}</span>
                <span className="rl-event-date">{fmtDate(e.data)}</span>
              </div>
              {e.obiettivo  && <div className="rl-event-meta">Obiettivo · {e.obiettivo}</div>}
              {e.incontrati && <div className="rl-event-meta">Incontrati · {e.incontrati}</div>}
              <span className={`rl-fu-badge${e.followup ? ' done' : ''}`}>
                {e.followup ? '✓ Follow-up fatto' : '○ Follow-up da fare'}
              </span>
              {e.note && <div className="rl-event-note">{e.note}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── FORM: Persona */}
      {formP && (
        <div className="crm-overlay" onClick={() => { setFormP(null); setEditPId(null); }}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-head">
              <span className="cm-label">{editPId ? 'Modifica persona' : 'Nuova persona'}</span>
              {editPId && (
                <button className="cm-btn cm-btn-ghost" style={{ color: '#b94040' }} onClick={() => removeP(editPId)}>Elimina</button>
              )}
            </div>
            <div className="crm-form-grid">
              {[
                ['nome',     'Nome *',            'Luca Ferrari'           ],
                ['contesto', 'Contesto incontro', 'Evento X, LinkedIn…'   ],
                ['cosa_fa',  'Cosa fa',           'Designer freelance'     ],
                ['sinergia', 'Potenziale sinergia','Collabs su video'      ],
              ].map(([k, l, ph]) => (
                <div key={k} className="crm-ff">
                  <label className="cm-label">{l}</label>
                  <input className="cm-input" value={formP[k]} onChange={e => setFormP(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} />
                </div>
              ))}
              <div className="crm-ff">
                <label className="cm-label">Stato relazione</label>
                <select className="cm-input" value={formP.stato} onChange={e => setFormP(f => ({ ...f, stato: e.target.value }))}>
                  {STATI.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Ultimo contatto</label>
                <input type="date" className="cm-input" value={formP.ultimo_contatto} onChange={e => setFormP(f => ({ ...f, ultimo_contatto: e.target.value }))} />
              </div>
            </div>
            <div className="crm-ff" style={{ marginTop: 8 }}>
              <label className="cm-label">Note</label>
              <textarea className="cm-input" rows={2} value={formP.note} onChange={e => setFormP(f => ({ ...f, note: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginTop: 2 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="cm-btn" onClick={upsertP} disabled={!formP.nome.trim()}>{editPId ? 'Salva' : 'Aggiungi'}</button>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setFormP(null); setEditPId(null); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORM: Evento */}
      {formE && (
        <div className="crm-overlay" onClick={() => { setFormE(null); setEditEId(null); }}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-head">
              <span className="cm-label">{editEId ? 'Modifica evento' : 'Nuovo evento'}</span>
              {editEId && (
                <button className="cm-btn cm-btn-ghost" style={{ color: '#b94040' }} onClick={() => removeE(editEId)}>Elimina</button>
              )}
            </div>
            <div className="crm-form-grid">
              <div className="crm-ff">
                <label className="cm-label">Nome evento *</label>
                <input className="cm-input" value={formE.nome} onChange={e => setFormE(f => ({ ...f, nome: e.target.value }))} placeholder="Meetup Milano" />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Data</label>
                <input type="date" className="cm-input" value={formE.data} onChange={e => setFormE(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Obiettivo</label>
                <input className="cm-input" value={formE.obiettivo} onChange={e => setFormE(f => ({ ...f, obiettivo: e.target.value }))} placeholder="Espandere network freelance" />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Chi ho incontrato</label>
                <input className="cm-input" value={formE.incontrati} onChange={e => setFormE(f => ({ ...f, incontrati: e.target.value }))} placeholder="Marco, Luca, Sara…" />
              </div>
            </div>
            <div className="crm-ff" style={{ marginTop: 8 }}>
              <label className="cm-label">Note post-evento</label>
              <textarea className="cm-input" rows={2} value={formE.note} onChange={e => setFormE(f => ({ ...f, note: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginTop: 2 }} />
            </div>
            <label className="crm-check-label" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={formE.followup} onChange={e => setFormE(f => ({ ...f, followup: e.target.checked }))} />
              Follow-up fatto con le persone incontrate
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="cm-btn" onClick={upsertE} disabled={!formE.nome.trim()}>{editEId ? 'Salva' : 'Aggiungi'}</button>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setFormE(null); setEditEId(null); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
