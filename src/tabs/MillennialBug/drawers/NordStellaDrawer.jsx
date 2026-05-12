import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const DEFAULT_NORD = {
  cornice_temporale: '12 mesi da maggio 2025',
  volume_target: '1-2 pezzi/settimana strutturati + riflessioni spontanee opzionali',
  check_di_ciclo: 'ogni 30 giorni',
  posizionamento: 'Uscire dal sistema / vivere in modo personalizzato. Sotto-temi: lettura, cinema, alimentazione, rucking',
  regole_anti_recidiva: [
    'Niente formazione marketing/monetizzazione fino al mese 9-10',
    'Niente integrazione API Substack per i primi 90 giorni',
    'Metriche di risultato solo nei check di ciclo, inserite a mano',
    'App Substack disinstallata dal telefono, accesso solo da desktop',
    'Niente notifiche push da Substack',
  ],
  definizione_successo_12_mesi: [
    'Non ho mollato — ho continuato a pubblicare anche nei mesi pesanti',
    'Sono diventato uno che pubblica — costanza e tenacia da publisher',
    'Ho migliorato la creatività — al mese 12 il progetto è migliore del mese 1',
    'Sono fiero di quello che ho esposto — rileggerei almeno alcuni pezzi senza vergogna',
    'Ho scritto in modo da rendere possibile la risonanza con persone bloccate o diverse come me',
    'Mi sto trattando bene mentre lo faccio — il tono interno è stato sostenibile',
  ],
  non_misura_successo: ['subscriber', 'open rate', 'monetizzazione', 'viralità', 'crescita comparata'],
};

function Section({ title, children }) {
  return (
    <div className="mb-nord-section">
      <div className="mb-nord-title">{title}</div>
      {children}
    </div>
  );
}

export default function NordStellaDrawer() {
  const [nord, saveNord] = useFirebaseState('pd_nord_stella', DEFAULT_NORD);
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(null);

  const data = nord ?? DEFAULT_NORD;

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(data)));
    setEditing(true);
  };

  const saveEdit = () => {
    saveNord(draft);
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const updateList = (key, idx, value) => {
    setDraft(d => {
      const next = [...d[key]];
      next[idx] = value;
      return { ...d, [key]: next };
    });
  };

  const addItem = (key) => {
    setDraft(d => ({ ...d, [key]: [...(d[key] || []), ''] }));
  };

  const removeItem = (key, idx) => {
    setDraft(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));
  };

  if (editing && draft) {
    return (
      <div className="mb-dr-content">
        <div className="mb-dr-section">
          <div className="mb-action-bar">
            <span className="mb-section-label" style={{ margin: 0 }}>Modifica Nord Stella</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="mb-btn mb-btn-ghost mb-btn-small" onClick={cancelEdit}>Annulla</button>
              <button className="mb-btn mb-btn-small" onClick={saveEdit}>Salva</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['cornice_temporale', 'Cornice temporale'],
              ['volume_target', 'Volume target'],
              ['check_di_ciclo', 'Check di ciclo'],
              ['posizionamento', 'Posizionamento'],
            ].map(([key, label]) => (
              <div key={key} className="mb-form-field">
                <label className="mb-form-label">{label}</label>
                <input
                  className="mb-input"
                  value={draft[key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                />
              </div>
            ))}

            {[
              ['regole_anti_recidiva', 'Regole anti-recidiva'],
              ['definizione_successo_12_mesi', 'Definizione successo 12 mesi'],
              ['non_misura_successo', 'Non misura il successo'],
            ].map(([key, label]) => (
              <div key={key} className="mb-form-field">
                <label className="mb-form-label">{label}</label>
                {(draft[key] || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      className="mb-input"
                      value={item}
                      onChange={e => updateList(key, idx, e.target.value)}
                    />
                    <button className="mb-delete-btn" onClick={() => removeItem(key, idx)}>×</button>
                  </div>
                ))}
                <button
                  className="mb-btn mb-btn-ghost mb-btn-small"
                  onClick={() => addItem(key)}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  + Aggiungi
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div className="mb-action-bar">
          <span className="mb-section-label" style={{ margin: 0 }}>Decisioni strategiche bloccate</span>
          <button className="mb-btn mb-btn-ghost mb-btn-small" onClick={startEdit}>Modifica</button>
        </div>

        <Section title="Cornice temporale">
          <p className="mb-nord-text">{data.cornice_temporale}</p>
        </Section>

        <Section title="Volume target">
          <p className="mb-nord-text">{data.volume_target}</p>
        </Section>

        <Section title="Check di ciclo">
          <p className="mb-nord-text">{data.check_di_ciclo}</p>
        </Section>

        <Section title="Posizionamento">
          <p className="mb-nord-text">{data.posizionamento}</p>
        </Section>

        <div className="mb-divider" />

        <Section title="Regole anti-recidiva">
          <ul className="mb-nord-list">
            {(data.regole_anti_recidiva || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>

        <div className="mb-divider" />

        <Section title="Definizione successo — 12 mesi">
          <ul className="mb-nord-list">
            {(data.definizione_successo_12_mesi || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>

        <div className="mb-divider" />

        <Section title="Non misura il successo">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.non_misura_successo || []).map((r, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 10,
                  background: 'rgba(31,24,18,0.06)',
                  color: 'var(--color-ink-muted)',
                  textDecoration: 'line-through',
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
