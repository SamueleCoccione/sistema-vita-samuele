import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const EMPTY_FORM = {
  cosa_sto_imparando_a_dire: '',
  cosa_non_voglio_piu_dire: '',
  riferimenti: '',
  frasi_mie_preferite: '',
};

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ApprendimentiDrawer() {
  const [apprendimenti, saveApprendimenti] = useFirebaseState('pd_apprendimenti_voce', []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(null);

  const entries = Array.isArray(apprendimenti) ? apprendimenti : [];

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = { id: Date.now(), date: today, ...form };
    saveApprendimenti([entry, ...entries]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const remove = (id) => saveApprendimenti(entries.filter(e => e.id !== id));

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div className="mb-action-bar">
          <span className="mb-section-label" style={{ margin: 0 }}>
            {entries.length} apprendiment{entries.length !== 1 ? 'i' : 'o'} sulla voce
          </span>
          <button
            className="mb-btn mb-btn-small"
            onClick={() => setShowForm(s => !s)}
          >
            {showForm ? 'Annulla' : '+ Nuovo apprendimento'}
          </button>
        </div>

        {showForm && (
          <div className="mb-form">
            <div className="mb-form-field">
              <label className="mb-form-label">Cosa sto imparando a dire</label>
              <textarea
                className="mb-textarea"
                placeholder="Una nuova capacità espressiva, un tono, un modo di stare nella pagina..."
                value={form.cosa_sto_imparando_a_dire}
                onChange={set('cosa_sto_imparando_a_dire')}
                rows={3}
              />
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Cosa non voglio più dire</label>
              <textarea
                className="mb-textarea"
                placeholder="Pattern da abbandonare, frasi tipo, posture che non mi appartengono..."
                value={form.cosa_non_voglio_piu_dire}
                onChange={set('cosa_non_voglio_piu_dire')}
                rows={3}
              />
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Riferimenti</label>
              <input
                className="mb-input"
                placeholder="Autori, articoli, cose lette che hanno influenzato questo apprendimento"
                value={form.riferimenti}
                onChange={set('riferimenti')}
              />
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Frasi mie preferite</label>
              <textarea
                className="mb-textarea"
                placeholder="Frasi che ho scritto e che suonano come voglio suonare..."
                value={form.frasi_mie_preferite}
                onChange={set('frasi_mie_preferite')}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="mb-btn"
                onClick={save}
                disabled={!form.cosa_sto_imparando_a_dire.trim()}
              >
                Salva apprendimento
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-dr-section">
        {entries.length === 0 ? (
          <div className="mb-empty">
            Nessun apprendimento ancora. La voce si forma nel tempo.
          </div>
        ) : (
          <div className="mb-list">
            {entries.map(e => (
              <div key={e.id} className="mb-list-item" style={{ flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                  <div className="mb-list-item-body">
                    <div className="mb-list-item-meta">{fmtDate(e.date)}</div>
                    <div
                      className="mb-list-item-title"
                      style={{ cursor: 'pointer', marginTop: 4 }}
                      onClick={() => setExpanded(ex => ex === e.id ? null : e.id)}
                    >
                      {e.cosa_sto_imparando_a_dire || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="mb-delete-btn"
                      onClick={() => setExpanded(ex => ex === e.id ? null : e.id)}
                      style={{ fontSize: 12, color: 'var(--mb-accent)' }}
                    >
                      {expanded === e.id ? '▲' : '▼'}
                    </button>
                    <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                  </div>
                </div>

                {expanded === e.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-line)', width: '100%' }}>
                    {e.cosa_non_voglio_piu_dire && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
                          Cosa non voglio più dire
                        </div>
                        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink)', margin: 0, lineHeight: 1.55 }}>
                          {e.cosa_non_voglio_piu_dire}
                        </p>
                      </div>
                    )}
                    {e.riferimenti && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
                          Riferimenti
                        </div>
                        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.55 }}>
                          {e.riferimenti}
                        </p>
                      </div>
                    )}
                    {e.frasi_mie_preferite && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
                          Frasi mie preferite
                        </div>
                        <blockquote
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: 15,
                            color: 'var(--color-ink)',
                            margin: 0,
                            lineHeight: 1.65,
                            borderLeft: '2px solid var(--mb-accent-muted)',
                            paddingLeft: 12,
                          }}
                        >
                          {e.frasi_mie_preferite}
                        </blockquote>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
