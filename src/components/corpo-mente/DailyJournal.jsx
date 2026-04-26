import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'sv_daily_journal';
const MAX = 160;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtMonth(key) {
  const d = new Date(key + '-01T12:00:00');
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

function groupByMonth(entries) {
  const groups = {};
  entries.forEach(e => {
    const key = e.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function DailyJournal() {
  const [entries, setEntries] = useFirebaseState(KEY, []);
  const [text, setText] = useState('');
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey()]));

  const remaining = MAX - text.length;

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const next = [{ id: Date.now(), date: todayStr(), text: t }, ...entries];
    setEntries(next);
    setText('');
    // ensure current month stays open after saving
    setOpenMonths(prev => new Set([...prev, currentMonthKey()]));
  };

  const remove = (id) => setEntries(entries.filter(e => e.id !== id));

  const toggleMonth = (key) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groups = groupByMonth(entries);

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
        <div className="dj-months">
          {groups.map(([monthKey, monthEntries]) => {
            const isOpen = openMonths.has(monthKey);
            const isCurrent = monthKey === currentMonthKey();
            return (
              <div key={monthKey} className="dj-month">
                <button
                  className={`dj-month-head${isOpen ? ' open' : ''}`}
                  onClick={() => toggleMonth(monthKey)}
                >
                  <span className="dj-month-label">{fmtMonth(monthKey)}</span>
                  <span className="dj-month-count">{monthEntries.length} {monthEntries.length === 1 ? 'nota' : 'note'}</span>
                  {isCurrent && <span className="dj-month-current">in corso</span>}
                  <span className="dj-month-chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="dj-list">
                    {monthEntries.map(e => (
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
          })}
        </div>
      )}
    </div>
  );
}
