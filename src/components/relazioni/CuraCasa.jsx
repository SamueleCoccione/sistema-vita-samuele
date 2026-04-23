import { useState } from 'react';

const KEY = 'rel_cura_casa';

const CHECKS = [
  { k: 'ordine', label: 'Casa in ordine'  },
  { k: 'camera', label: 'Camera ordinata' },
  { k: 'cucina', label: 'Cucina pulita'   },
];

function today() { return new Date().toISOString().split('T')[0]; }
function weekStart() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function fmtWeek(w) {
  const s = new Date(w + 'T12:00:00');
  const e = new Date(w + 'T12:00:00');
  e.setDate(e.getDate() + 6);
  const f = d => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}
function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

const allDone = e => CHECKS.every(c => e[c.k]);

export default function CuraCasa() {
  const [entries, setEntries] = useState(load);
  const cw       = weekStart();
  const td       = today();
  const existing = entries.find(e => e.week === cw) || null;
  const [form, setForm] = useState(existing || { week: cw, ordine: false, camera: false, cucina: false, nota: '', saved_at: td });

  const save = () => {
    const entry = { ...form, saved_at: td };
    const next  = existing
      ? entries.map(e => e.week === cw ? entry : e)
      : [...entries, entry];
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const lastComplete = [...entries]
    .filter(allDone)
    .sort((a, b) => (b.saved_at || b.week).localeCompare(a.saved_at || a.week))[0];

  const alertMsg = (() => {
    if (!lastComplete) return entries.length > 0 ? 'Checklist mai completata al 100%' : null;
    const days = daysBetween(lastComplete.saved_at || lastComplete.week, td);
    return days >= 7 ? `Checklist non completata da ${days} giorni` : null;
  })();

  const history = [...entries].sort((a, b) => b.week.localeCompare(a.week)).slice(0, 7);

  return (
    <div>
      {alertMsg && <div className="rl-alert">⚠ {alertMsg}</div>}

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
          rows={2}
          placeholder="Stato generale degli spazi questa settimana…"
          value={form.nota}
          onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
        />
        <button className="cm-btn" onClick={save} style={{ marginTop: 8 }}>
          {existing ? 'Aggiorna' : 'Salva'}
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
