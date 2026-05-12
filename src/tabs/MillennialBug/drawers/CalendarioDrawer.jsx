import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const STATUSES    = ['programmato', 'in_scrittura', 'pronto', 'pubblicato', 'spostato', 'saltato'];
const STATUS_LABELS = {
  programmato: 'Programmato', in_scrittura: 'In scrittura', pronto: 'Pronto',
  pubblicato: 'Pubblicato', spostato: 'Spostato', saltato: 'Saltato',
};
const TIPI  = ['saggio', 'riflessione', 'altro'];
const TEMI  = ['uscire dal sistema', 'lettura', 'cinema', 'alimentazione', 'rucking', 'altro'];

const EMPTY_FORM = {
  data_prevista: '',
  titolo: '',
  tipo: 'saggio',
  tema: 'altro',
  status: 'programmato',
  note: '',
};

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

export default function CalendarioDrawer() {
  const [calendario, saveCalendario] = useFirebaseState('pd_calendario', []);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [view,     setView]     = useState('upcoming'); // upcoming | all
  const [moving,   setMoving]   = useState(null);
  const [newDate,  setNewDate]  = useState('');

  const entries = Array.isArray(calendario) ? calendario : [];
  const today   = new Date().toISOString().split('T')[0];

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const entry = { id: Date.now(), ...form };
    saveCalendario([...entries, entry].sort((a, b) => a.data_prevista.localeCompare(b.data_prevista)));
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    saveCalendario(entries.map(e => e.id === id ? { ...e, status } : e));
  };

  const moveEntry = (id) => {
    if (!newDate) return;
    saveCalendario(
      entries
        .map(e => e.id === id ? { ...e, data_prevista: newDate, spostato_da: e.data_prevista, status: 'spostato' } : e)
        .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista))
    );
    setMoving(null);
    setNewDate('');
  };

  const remove = (id) => saveCalendario(entries.filter(e => e.id !== id));

  const upcoming = entries.filter(e =>
    e.data_prevista >= today && !['pubblicato', 'saltato'].includes(e.status)
  );
  const past     = entries.filter(e =>
    e.data_prevista < today || ['pubblicato', 'saltato'].includes(e.status)
  );
  const displayed = view === 'upcoming' ? upcoming : entries;

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div className="mb-action-bar">
          <div style={{ display: 'flex', gap: 6 }}>
            {['upcoming', 'all'].map(v => (
              <button
                key={v}
                className={`mb-btn mb-btn-ghost mb-btn-small${view === v ? '' : ''}`}
                style={view === v ? { background: 'var(--mb-accent-soft)', color: 'var(--mb-accent)', border: '1px solid var(--mb-accent-muted)' } : {}}
                onClick={() => setView(v)}
              >
                {v === 'upcoming' ? `In arrivo (${upcoming.length})` : `Tutti (${entries.length})`}
              </button>
            ))}
          </div>
          <button className="mb-btn mb-btn-small" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Annulla' : '+ Aggiungi'}
          </button>
        </div>

        {showForm && (
          <div className="mb-form">
            <div className="mb-form-row">
              <div className="mb-form-field">
                <label className="mb-form-label">Data prevista</label>
                <input type="date" className="mb-input" value={form.data_prevista} onChange={set('data_prevista')} />
              </div>
              <div className="mb-form-field">
                <label className="mb-form-label">Tipo</label>
                <select className="mb-select" value={form.tipo} onChange={set('tipo')}>
                  {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Titolo</label>
              <input className="mb-input" placeholder="Titolo o idea provvisoria" value={form.titolo} onChange={set('titolo')} />
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
              <input className="mb-input" placeholder="Note opzionali" value={form.note} onChange={set('note')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mb-btn" onClick={save} disabled={!form.data_prevista || !form.titolo.trim()}>
                Aggiungi
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-dr-section">
        {displayed.length === 0 ? (
          <div className="mb-empty">
            {view === 'upcoming' ? 'Nessuna pubblicazione in programma.' : 'Calendario vuoto.'}
          </div>
        ) : (
          <div className="mb-list">
            {displayed.map(e => (
              <div key={e.id} className="mb-list-item" style={{ flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-ink-muted)',
                      marginTop: 2,
                      minWidth: 80,
                    }}
                  >
                    {fmtDate(e.data_prevista)}
                  </div>
                  <div className="mb-list-item-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className={`mb-badge mb-badge--${e.status}`}>{STATUS_LABELS[e.status]}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
                        {e.tipo} · {e.tema}
                      </span>
                    </div>
                    <div className="mb-list-item-title">{e.titolo || '—'}</div>
                    {e.spostato_da && (
                      <div className="mb-list-item-meta" style={{ marginTop: 2 }}>
                        spostato da {fmtDate(e.spostato_da)}
                      </div>
                    )}
                  </div>
                  <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                </div>

                {/* Quick actions */}
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.filter(s => s !== e.status && s !== 'spostato').map(s => (
                    <button
                      key={s}
                      className="mb-btn mb-btn-ghost mb-btn-small"
                      style={{ fontSize: 10 }}
                      onClick={() => updateStatus(e.id, s)}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                  <button
                    className="mb-btn mb-btn-ghost mb-btn-small"
                    style={{ fontSize: 10, color: 'var(--mb-accent)' }}
                    onClick={() => setMoving(m => m === e.id ? null : e.id)}
                  >
                    Sposta
                  </button>
                </div>

                {moving === e.id && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="mb-input"
                      style={{ flex: 1 }}
                      value={newDate}
                      onChange={ev => setNewDate(ev.target.value)}
                    />
                    <button
                      className="mb-btn mb-btn-small"
                      onClick={() => moveEntry(e.id)}
                      disabled={!newDate}
                    >
                      Conferma
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {view === 'upcoming' && past.length > 0 && (
        <div className="mb-dr-section" style={{ opacity: 0.7 }}>
          <span className="mb-section-label">Passate / pubblicate — {past.length}</span>
          <button
            className="mb-btn mb-btn-ghost mb-btn-small"
            onClick={() => setView('all')}
          >
            Mostra tutte
          </button>
        </div>
      )}
    </div>
  );
}
