import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const PLATFORMS_KEY = 'lib_platforms';
const CLIENTS_KEY   = 'lib_remote_clients';

const DEFAULT_PLATFORMS = {
  toptal:   { name: 'Toptal',           iscritto: false, profilo: false, contatto: false },
  wwn:      { name: 'Working Nomads',   iscritto: false, profilo: false, contatto: false },
  wwremote: { name: 'We Work Remotely', iscritto: false, profilo: false, contatto: false },
  upwork:   { name: 'Upwork',           iscritto: false, profilo: false, contatto: false },
  linkedin: { name: 'LinkedIn',         iscritto: false, profilo: false, contatto: false },
};

const TIPI = ['internazionale', 'agenzia estera', 'piattaforma'];

const EMPTY_CLIENT = { name: '', type: 'internazionale', status: '', notes: '' };

export default function PipelineRemote() {
  const [platforms, setPlatforms] = useFirebaseState(PLATFORMS_KEY, DEFAULT_PLATFORMS);
  const [clients,   setClients]   = useFirebaseState(CLIENTS_KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_CLIENT });

  const savePlatforms = next => setPlatforms(next);
  const saveClients   = next => setClients(next);

  const togglePCheck = (key, field) => {
    savePlatforms({ ...platforms, [key]: { ...platforms[key], [field]: !platforms[key][field] } });
  };

  const addClient = () => {
    if (!form.name.trim()) return;
    saveClients([{ ...form, id: Date.now() }, ...clients]);
    setForm({ ...EMPTY_CLIENT });
    setShowForm(false);
  };

  const removeClient = id => saveClients(clients.filter(c => c.id !== id));

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {/* Platforms */}
      <div className="cm-label" style={{ marginBottom: 12 }}>Piattaforme da esplorare</div>
      <div className="lb-platform-list">
        {Object.entries(platforms).map(([key, p]) => (
          <div key={key} className="lb-platform-row">
            <span className="lb-platform-name">{p.name}</span>
            <div className="lb-platform-checks">
              {[['iscritto', 'Iscritto'], ['profilo', 'Profilo completo'], ['contatto', 'Primo contatto']].map(([field, label]) => (
                <button
                  key={field}
                  className={`lb-pcheck${p[field] ? ' done' : ''}`}
                  onClick={() => togglePCheck(key, field)}
                >
                  {p[field] ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Remote clients */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 12 }}>
        <span className="cm-label">Contatti / clienti remote-friendly</span>
        <button className="cm-btn" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Annulla' : '+ Aggiungi'}
        </button>
      </div>

      {showForm && (
        <div className="lb-loc-form" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field xl">
              <label className="cm-label">Nome / Azienda *</label>
              <input className="cm-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Contatto o azienda..." />
            </div>
            <div className="lb-field lg">
              <label className="cm-label">Tipo</label>
              <select className="cm-input" value={form.type} onChange={e => setF('type', e.target.value)}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="lb-field md">
              <label className="cm-label">Stato</label>
              <input className="cm-input" value={form.status} onChange={e => setF('status', e.target.value)} placeholder="da contattare, in talk..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field xl">
              <label className="cm-label">Note</label>
              <input className="cm-input" value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Budget, zona, lingua..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={addClient}>Aggiungi</button>
            <button className="cm-btn cm-btn-ghost" onClick={() => setShowForm(false)}>Annulla</button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', padding: '12px 0' }}>Nessun contatto remote aggiunto ancora.</div>
      ) : (
        <div className="lb-client-list">
          {clients.map(c => (
            <div key={c.id} className="lb-client-row">
              <span className={`lb-type-tag lb-type-${c.type?.replace(/\s/g,'-') || 'intl'}`}>{c.type}</span>
              <span className="lb-client-name">{c.name}</span>
              {c.status && <span className="lb-client-status">{c.status}</span>}
              {c.notes  && <span className="lb-client-note">{c.notes}</span>}
              <button className="cm-icon-btn" onClick={() => removeClient(c.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
