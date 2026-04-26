import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'rel_famiglia';

const RELAZIONI = ['Genitore', 'Fratello/Sorella', 'Nonno/a', 'Cugino/a', 'Zio/a', 'Altro'];

function today()           { return new Date().toISOString().split('T')[0]; }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function fmtDate(s)        { return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); }
const EMPTY = { nome: '', relazione: 'Genitore', ultimo_contatto: today(), note: '' };

export default function FamigliaAffetti() {
  const [contacts, setContacts] = useFirebaseState(KEY, []);
  const [form,     setForm]     = useState(null);
  const [editId,   setEditId]   = useState(null);

  const persist = next => setContacts(next);

  const upsert = () => {
    if (!form?.nome.trim()) return;
    const next = editId
      ? contacts.map(c => c.id === editId ? { ...form, id: editId } : c)
      : [...contacts, { ...form, id: Date.now() }];
    persist(next); setForm(null); setEditId(null);
  };

  const remove         = id => { persist(contacts.filter(c => c.id !== id)); setForm(null); setEditId(null); };
  const openNew        = ()  => { setForm({ ...EMPTY }); setEditId(null); };
  const openEdit       = c   => { setForm({ ...c }); setEditId(c.id); };
  const contactedToday = id  => persist(contacts.map(c => c.id === id ? { ...c, ultimo_contatto: today() } : c));

  const sorted = useMemo(() =>
    [...contacts].sort((a, b) => a.ultimo_contatto.localeCompare(b.ultimo_contatto)),
  [contacts]);

  const alerts = sorted.filter(c => daysBetween(c.ultimo_contatto, today()) > 14);

  return (
    <div>
      {alerts.length > 0 && (
        <div className="crm-alerts-list">
          {alerts.map(c => (
            <div key={c.id} className="crm-fu-alert">
              <span>⏰ <strong>{c.nome}</strong> ({c.relazione}) — {daysBetween(c.ultimo_contatto, today())}g fa</span>
              <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => contactedToday(c.id)}>Contattato oggi</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <button className="cm-btn" onClick={openNew}>+ Aggiungi persona</button>
      </div>

      {contacts.length === 0 && (
        <div className="cm-empty">Aggiungi fratelli, genitori, nonni, cugini — per tenere traccia dei contatti</div>
      )}

      <div className="rl-contacts">
        {sorted.map(c => {
          const days  = daysBetween(c.ultimo_contatto, today());
          const alert = days > 14;
          return (
            <div key={c.id} className={`rl-contact-row${alert ? ' rl-contact-alert' : ''}`}>
              <div className="rl-contact-main">
                <div className="rl-contact-name">{c.nome}</div>
                <div className="rl-contact-rel">{c.relazione}</div>
              </div>
              <div className="rl-contact-last">
                <span style={{ color: alert ? '#b94040' : 'var(--text2)', fontSize: 12, fontWeight: 600 }}>
                  {days === 0 ? 'oggi' : `${days}g fa`}{alert ? ' ⚠' : ''}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(c.ultimo_contatto)}</span>
              </div>
              {c.note && <div className="rl-contact-note">{c.note}</div>}
              <div className="rl-contact-actions">
                <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11 }} onClick={() => contactedToday(c.id)}>
                  Contattato oggi
                </button>
                <button className="cm-icon-btn" onClick={() => openEdit(c)}>✎</button>
                <button className="cm-icon-btn" onClick={() => remove(c.id)}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {form && (
        <div className="crm-overlay" onClick={() => { setForm(null); setEditId(null); }}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-head">
              <span className="cm-label">{editId ? 'Modifica' : 'Nuovo contatto'}</span>
              {editId && <button className="cm-btn cm-btn-ghost" style={{ color: '#b94040' }} onClick={() => remove(editId)}>Elimina</button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="crm-ff">
                <label className="cm-label">Nome *</label>
                <input className="cm-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Mario" />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Relazione</label>
                <select className="cm-input" value={form.relazione} onChange={e => setForm(f => ({ ...f, relazione: e.target.value }))}>
                  {RELAZIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Ultimo contatto</label>
                <input type="date" className="cm-input" value={form.ultimo_contatto} onChange={e => setForm(f => ({ ...f, ultimo_contatto: e.target.value }))} />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Note</label>
                <textarea
                  className="cm-input"
                  rows={3}
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Di cosa avete parlato, com'era, cosa stava facendo…"
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="cm-btn" onClick={upsert} disabled={!form.nome.trim()}>{editId ? 'Salva' : 'Aggiungi'}</button>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setForm(null); setEditId(null); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
