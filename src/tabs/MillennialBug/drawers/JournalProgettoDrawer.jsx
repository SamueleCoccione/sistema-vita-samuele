import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const ALL_TAGS = ['paura', 'vittoria', 'dubbio', 'voce', 'idea', 'resistenza', 'recidiva', 'lettore', 'identita'];

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function JournalProgettoDrawer({ initialTag }) {
  const [journal, saveJournal] = useFirebaseState('pd_journal_progetto', []);
  const [text,     setText]    = useState('');
  const [selTags,  setSelTags] = useState([]);
  const [filter,   setFilter]  = useState(initialTag || null);
  const [expanded, setExpanded] = useState(null);

  const entries = Array.isArray(journal) ? journal : [];

  const toggleTag = (t) => setSelTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const today = new Date().toISOString().split('T')[0];
    const entry = { id: Date.now(), date: today, text: t, tags: selTags };
    saveJournal([entry, ...entries]);
    setText('');
    setSelTags([]);
  };

  const remove = (id) => saveJournal(entries.filter(e => e.id !== id));

  const filtered = filter
    ? entries.filter(e => (e.tags || []).includes(filter))
    : entries;

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <span className="mb-section-label">Nuova entry</span>
        <textarea
          className="mb-textarea"
          placeholder="Scrivi liberamente. Cosa stai portando oggi al progetto?"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          style={{ marginBottom: 12 }}
        />
        <div className="mb-tags" style={{ marginBottom: 14 }}>
          {ALL_TAGS.map(t => (
            <span
              key={t}
              className={`mb-tag${selTags.includes(t) ? ' mb-tag--active' : ''}`}
              onClick={() => toggleTag(t)}
            >
              {t}
            </span>
          ))}
        </div>
        <button className="mb-btn" onClick={save} disabled={!text.trim()}>
          Salva
        </button>
      </div>

      <div className="mb-dr-section">
        <div className="mb-action-bar" style={{ marginBottom: 12 }}>
          <span className="mb-section-label" style={{ margin: 0 }}>
            {filtered.length} entr{filtered.length !== 1 ? 'y' : 'y'}
            {filter ? ` · ${filter}` : ''}
          </span>
          {filter && (
            <button className="mb-btn mb-btn-ghost mb-btn-small" onClick={() => setFilter(null)}>
              × Rimuovi filtro
            </button>
          )}
        </div>

        <div className="mb-tags" style={{ marginBottom: 16 }}>
          {ALL_TAGS.map(t => {
            const count = entries.filter(e => (e.tags || []).includes(t)).length;
            if (count === 0) return null;
            return (
              <span
                key={t}
                className={`mb-tag${filter === t ? ' mb-tag--active' : ''}`}
                onClick={() => setFilter(f => f === t ? null : t)}
              >
                {t} {count}
              </span>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mb-empty">
            {filter ? `Nessuna entry con tag "${filter}".` : 'Il journal è vuoto. Inizia a scrivere.'}
          </div>
        ) : (
          <div className="mb-list">
            {[...filtered]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(e => (
                <div key={e.id} className="mb-list-item" style={{ flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="mb-list-item-body">
                      <div className="mb-list-item-meta">{fmtDate(e.date)}</div>
                      <p
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 13,
                          color: 'var(--color-ink)',
                          margin: '6px 0 0',
                          lineHeight: 1.6,
                          ...(expanded !== e.id
                            ? {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }
                            : {}),
                        }}
                      >
                        {e.text}
                      </p>
                      {e.text.length > 200 && (
                        <button
                          onClick={() => setExpanded(ex => ex === e.id ? null : e.id)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                            color: 'var(--mb-accent)', cursor: 'pointer', marginTop: 4,
                          }}
                        >
                          {expanded === e.id ? 'Mostra meno ▲' : 'Continua a leggere ›'}
                        </button>
                      )}
                    </div>
                    <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                  </div>
                  {(e.tags || []).length > 0 && (
                    <div className="mb-tags" style={{ marginTop: 8 }}>
                      {e.tags.map(t => (
                        <span
                          key={t}
                          className="mb-tag"
                          onClick={() => setFilter(f => f === t ? null : t)}
                        >
                          {t}
                        </span>
                      ))}
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
