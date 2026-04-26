import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY_DAILY = 'rel_compagna_daily';
const KEY_NOTES = 'rel_compagna_note';

function today() { return new Date().toISOString().split('T')[0]; }
function weekStart() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
}
function fmtWeek(w) {
  const s = new Date(w + 'T12:00:00');
  const e = new Date(w + 'T12:00:00');
  e.setDate(e.getDate() + 6);
  const f = d => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}
const DAILY_CHECKS = [
  { k: 'gesto',   label: 'Gesto concreto per lei'      },
  { k: 'ascolto', label: 'Ho ascoltato senza telefono'  },
];

export default function Compagna() {
  const [daily, setDaily] = useFirebaseState(KEY_DAILY, []);
  const [notes, setNotes] = useFirebaseState(KEY_NOTES, []);

  const td = today();
  const cw = weekStart();

  const todayEntry = daily.find(e => e.date === td) || null;
  const weekNote   = notes.find(n => n.week === cw)  || null;

  const [form,     setForm]     = useState(todayEntry || { date: td, gesto: false, ascolto: false });
  const [noteText, setNoteText] = useState(weekNote?.nota || '');

  const saveDaily = () => {
    const next = todayEntry
      ? daily.map(e => e.date === td ? { ...form } : e)
      : [...daily, { ...form }];
    setDaily(next);
  };

  const saveNote = () => {
    const note = { week: cw, nota: noteText };
    const next = weekNote
      ? notes.map(n => n.week === cw ? note : n)
      : [...notes, note];
    setNotes(next);
  };

  const streak = useMemo(() => {
    const byDate = Object.fromEntries(daily.map(e => [e.date, e]));
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      const e   = byDate[key];
      if (e?.gesto) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [daily]);

  const history = [...daily].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  return (
    <div>
      {streak > 0 && (
        <div className="rl-streak-box">
          <span className="rl-streak-num">{streak}</span>
          <span className="rl-streak-lbl">{streak === 1 ? 'giorno' : 'giorni'} consecutivi con gesto fatto</span>
        </div>
      )}

      {/* Daily */}
      <div className="rl-check-form">
        <div className="rl-week-label">{fmtDate(td)} — oggi</div>
        <div className="rl-checks">
          {DAILY_CHECKS.map(c => (
            <div key={c.k} className="rl-check-item" onClick={() => setForm(f => ({ ...f, [c.k]: !f[c.k] }))}>
              <span className={`rl-check-box${form[c.k] ? ' checked' : ''}`}>{form[c.k] ? '✓' : '○'}</span>
              <span className="rl-check-label">{c.label}</span>
            </div>
          ))}
        </div>
        <button className="cm-btn" onClick={saveDaily} style={{ marginTop: 4 }}>
          {todayEntry ? 'Aggiorna oggi' : 'Salva oggi'}
        </button>
      </div>

      {/* Weekly note */}
      <div className="rl-check-form" style={{ marginTop: 12 }}>
        <div className="rl-week-label">Nota settimana — {fmtWeek(cw)}</div>
        <textarea
          className="cm-input rl-note-area"
          rows={3}
          placeholder="Fotografia della settimana insieme…"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
        />
        <button className="cm-btn cm-btn-ghost" onClick={saveNote} style={{ marginTop: 8 }}>
          {weekNote ? 'Aggiorna nota' : 'Salva nota'}
        </button>
      </div>

      {/* History */}
      {history.filter(e => e.date !== td).length > 0 && (
        <div className="rl-history" style={{ marginTop: 12 }}>
          {history.filter(e => e.date !== td).map(e => (
            <div key={e.date} className="rl-history-row">
              <span className="rl-history-week">{fmtDate(e.date)}</span>
              <span className={`rl-hcheck${e.gesto ? ' ok' : ''}`}>
                {e.gesto ? '✓' : '—'} gesto
              </span>
              <span className={`rl-hcheck${e.ascolto ? ' ok' : ''}`}>
                {e.ascolto ? '✓' : '—'} ascolto
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
