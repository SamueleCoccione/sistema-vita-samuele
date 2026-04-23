import { useState } from 'react';

const KEY = 'sv_daily_journal';
const MAX = 160;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  });
}

export default function DailyJournal() {
  const [entries, setEntries] = useState(load);
  const [text, setText] = useState('');

  const remaining = MAX - text.length;

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const next = [{ id: Date.now(), date: todayStr(), text: t }, ...entries];
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setText('');
  };

  const remove = (id) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div>
      <div className="dj-compose">
        <textarea
          className="cm-input cm-textarea dj-textarea"
          placeholder="Un pensiero per oggi…"
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
          rows={3}
        />
        <div className="dj-footer">
          <span className={`dj-counter${remaining <= 20 ? ' dj-counter-warn' : ''}${remaining === 0 ? ' dj-counter-full' : ''}`}>
            {remaining}
          </span>
          <button className="cm-btn" onClick={save} disabled={!text.trim()}>Salva</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="cm-empty">Nessuna nota ancora — scrivi il primo pensiero</div>
      ) : (
        <div className="dj-list">
          {entries.map(e => (
            <div key={e.id} className="dj-entry">
              <span className="dj-entry-date">{fmtDate(e.date)}</span>
              <span className="dj-entry-text">{e.text}</span>
              <button className="cm-icon-btn" onClick={() => remove(e.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
