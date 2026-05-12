import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const STATUSES = ['idea', 'bozza', 'pronta', 'archiviata'];
const STATUS_LABELS = {
  idea: 'Idea', bozza: 'Bozza', pronta: 'Pronta', archiviata: 'Archiviata',
};
const TEMI = ['uscire dal sistema', 'lettura', 'cinema', 'alimentazione', 'rucking', 'altro'];

const EMPTY_FORM = { titolo: '', tema: 'altro', status: 'idea', note: '' };

export default function BozzeDrawer() {
  const [bozze, saveBozze]  = useFirebaseState('pd_bozze', []);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(null);

  const entries = Array.isArray(bozze) ? bozze : [];

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = { id: Date.now(), date_added: today, ...form };
    saveBozze([entry, ...entries]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    saveBozze(entries.map(e => e.id === id ? { ...e, status } : e));
  };

  const remove = (id) => saveBozze(entries.filter(e => e.id !== id));

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div className="mb-action-bar">
          <span className="mb-section-label" style={{ margin: 0 }}>
            {entries.filter(e => e.status !== 'archiviata').length} attive
          </span>
          <button className="mb-btn mb-btn-small" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Annulla' : '+ Nuova idea'}
          </button>
        </div>

        {showForm && (
          <div className="mb-form">
            <div className="mb-form-field">
              <label className="mb-form-label">Titolo / Idea</label>
              <input
                className="mb-input"
                placeholder="Di cosa vuoi scrivere?"
                value={form.titolo}
                onChange={set('titolo')}
              />
            </div>
            <div className="mb-form-row">
              <div className="mb-form-field">
                <label className="mb-form-label">Tema</label>
                <select className="mb-select" value={form.tema} onChange={set('tema')}>
                  {TEMI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-form-field">
                <label className="mb-form-label">Status</label>
                <select className="mb-select" value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Note</label>
              <textarea
                className="mb-textarea"
                placeholder="Pensieri sparsi, angoli, frasi iniziali..."
                value={form.note}
                onChange={set('note')}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mb-btn" onClick={save} disabled={!form.titolo.trim()}>
                Salva
              </button>
            </div>
          </div>
        )}
      </div>

      {STATUSES.filter(s => s !== 'archiviata').map(status => {
        const group = entries.filter(e => e.status === status);
        if (group.length === 0) return null;
        return (
          <div key={status} className="mb-dr-section">
            <span className="mb-section-label">{STATUS_LABELS[status]} — {group.length}</span>
            <div className="mb-list">
              {group.map(e => (
                <div key={e.id} className="mb-list-item" style={{ flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="mb-list-item-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={`mb-badge mb-badge--${status}`}>{STATUS_LABELS[status]}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
                          {e.tema}
                        </span>
                      </div>
                      <div className="mb-list-item-title"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(ex => ex === e.id ? null : e.id)}
                      >
                        {e.titolo || '—'}
                      </div>
                      {e.note && expanded === e.id && (
                        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', margin: '6px 0 0', lineHeight: 1.55 }}>
                          {e.note}
                        </p>
                      )}
                    </div>
                    <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                  </div>

                  {expanded === e.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-line)' }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                        SPOSTA IN
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {STATUSES.filter(s => s !== e.status).map(s => (
                          <button
                            key={s}
                            className="mb-btn mb-btn-ghost mb-btn-small"
                            onClick={() => { updateStatus(e.id, s); setExpanded(null); }}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {entries.filter(e => e.status === 'archiviata').length > 0 && (
        <div className="mb-dr-section">
          <span className="mb-section-label">Archiviate — {entries.filter(e => e.status === 'archiviata').length}</span>
          <div className="mb-list">
            {entries.filter(e => e.status === 'archiviata').map(e => (
              <div key={e.id} className="mb-list-item" style={{ opacity: 0.6 }}>
                <div className="mb-list-item-body">
                  <div className="mb-list-item-title" style={{ textDecoration: 'line-through' }}>{e.titolo}</div>
                  <div className="mb-list-item-meta">{e.tema}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="mb-btn mb-btn-ghost mb-btn-small"
                    onClick={() => updateStatus(e.id, 'idea')}
                  >
                    Riattiva
                  </button>
                  <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
