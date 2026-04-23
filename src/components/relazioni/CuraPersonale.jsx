import { useState, useMemo } from 'react';

const KEY = 'rel_cura_personale';

const CHECKS = [
  { k: 'capelli',  label: 'Capelli in ordine'              },
  { k: 'vestiti',  label: 'Vestiti curati'                 },
  { k: 'igiene',   label: 'Igiene personale'               },
  { k: 'specchio', label: 'Soddisfazione allo specchio'    },
];

function weekStart() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function prevWeek(w) {
  const d = new Date(w + 'T12:00:00');
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}
function fmtWeek(w) {
  const s = new Date(w + 'T12:00:00');
  const e = new Date(w + 'T12:00:00');
  e.setDate(e.getDate() + 6);
  const f = d => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}
function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

const allDone = e => CHECKS.every(c => e[c.k]);

export default function CuraPersonale() {
  const [entries, setEntries] = useState(load);
  const cw       = weekStart();
  const existing = entries.find(e => e.week === cw) || null;
  const [form, setForm] = useState(existing || { week: cw, capelli: false, vestiti: false, igiene: false, specchio: false, nota: '' });

  const save = () => {
    const next = existing
      ? entries.map(e => e.week === cw ? { ...form } : e)
      : [...entries, { ...form }];
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const streak = useMemo(() => {
    const byWeek = Object.fromEntries(entries.map(e => [e.week, e]));
    let count = 0; let w = cw;
    for (let i = 0; i < 52; i++) {
      if (byWeek[w] && allDone(byWeek[w])) { count++; w = prevWeek(w); }
      else break;
    }
    return count;
  }, [entries, cw]);

  const history = [...entries].sort((a, b) => b.week.localeCompare(a.week)).slice(0, 9);

  return (
    <div>
      {streak > 0 && (
        <div className="rl-streak-box">
          <span className="rl-streak-num">{streak}</span>
          <span className="rl-streak-lbl">{streak === 1 ? 'settimana' : 'settimane'} consecutive — tutti i check</span>
        </div>
      )}

      <div className="rl-check-form">
        <div className="rl-week-label">{fmtWeek(cw)} — settimana in corso</div>
        <div className="rl-checks">
          {CHECKS.map(c => (
            <div key={c.k} className="rl-check-item" onClick={() => setForm(f => ({ ...f, [c.k]: !f[c.k] }))}>
              <span className={`rl-check-box${form[c.k] ? ' checked' : ''}`}>{form[c.k] ? '✓' : '○'}</span>
              <span className="rl-check-label">{c.label}</span>
            </div>
          ))}
        </div>
        <textarea
          className="cm-input rl-note-area"
          rows={3}
          placeholder="Come mi sono sentito nel confrontarmi con gli altri questa settimana…"
          value={form.nota}
          onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
        />
        <button className="cm-btn" onClick={save} style={{ marginTop: 8 }}>
          {existing ? 'Aggiorna settimana' : 'Salva settimana'}
        </button>
      </div>

      {history.filter(e => e.week !== cw).length > 0 && (
        <div className="rl-history">
          {history.filter(e => e.week !== cw).map(e => (
            <div key={e.week} className="rl-history-row">
              <span className="rl-history-week">{fmtWeek(e.week)}</span>
              <div className="rl-history-checks">
                {CHECKS.map(c => (
                  <span key={c.k} className={`rl-hcheck${e[c.k] ? ' ok' : ''}`} title={c.label}>
                    {e[c.k] ? '✓' : '—'}
                  </span>
                ))}
              </div>
              {allDone(e) && <span className="rl-history-star">★</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
