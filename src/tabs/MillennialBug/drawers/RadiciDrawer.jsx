import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

function getWeekStr(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const y     = date.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const wk    = Math.ceil((((date - start) / 86400000) + 1) / 7);
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

function fmtWeek(s) {
  const [y, w] = s.split('-W').map(Number);
  const d = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
  const diff = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - diff + 1);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RadiciDrawer() {
  const [radici, saveRadici] = useFirebaseState('pd_radici_settimanali', []);
  const [text, setText] = useState('');

  const thisWeek  = getWeekStr();
  const today     = new Date().toISOString().split('T')[0];
  const entries   = Array.isArray(radici) ? radici : [];
  const hasThisWeek = entries.some(e => e.settimana === thisWeek);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const existing = hasThisWeek
      ? entries.map(e => e.settimana === thisWeek ? { ...e, cosa_non_strumentale: t } : e)
      : [{ id: Date.now(), settimana: thisWeek, date: today, cosa_non_strumentale: t }, ...entries];
    saveRadici(existing);
    setText('');
  };

  const remove = (id) => saveRadici(entries.filter(e => e.id !== id));

  const thisEntry = entries.find(e => e.settimana === thisWeek);

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div
          style={{
            textAlign: 'center',
            padding: '24px 0 20px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 20,
              lineHeight: 1.5,
              color: 'var(--color-ink)',
              margin: '0 0 24px',
            }}
          >
            Cosa hai fatto questa settimana di non strumentale a nessun obiettivo,<br />
            solo perché ti piaceva?
          </p>

          {thisEntry ? (
            <div
              style={{
                background: 'var(--mb-accent-soft)',
                border: '1px solid var(--mb-accent-muted)',
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: 16,
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                Settimana {thisWeek} — già compilata
              </div>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink)', margin: 0, lineHeight: 1.6 }}>
                {thisEntry.cosa_non_strumentale}
              </p>
            </div>
          ) : (
            <textarea
              className="mb-textarea"
              placeholder="Una cosa sola. Non deve essere produttiva, non deve insegnare niente."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              style={{ textAlign: 'left', marginBottom: 12 }}
            />
          )}

          {!thisEntry && (
            <button className="mb-btn" onClick={save} disabled={!text.trim()}>
              Salva radice
            </button>
          )}

          {thisEntry && (
            <button
              className="mb-btn mb-btn-ghost mb-btn-small"
              onClick={() => {
                setText(thisEntry.cosa_non_strumentale);
                saveRadici(entries.filter(e => e.settimana !== thisWeek));
              }}
            >
              Modifica
            </button>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mb-dr-section">
          <span className="mb-section-label">Settimane precedenti</span>
          <div className="mb-list">
            {[...entries]
              .sort((a, b) => b.settimana.localeCompare(a.settimana))
              .map(e => (
                <div key={e.id} className="mb-list-item">
                  <div className="mb-list-item-body">
                    <div className="mb-list-item-meta">{e.settimana} · {fmtWeek(e.settimana)}</div>
                    <div className="mb-list-item-text">{e.cosa_non_strumentale}</div>
                  </div>
                  <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
