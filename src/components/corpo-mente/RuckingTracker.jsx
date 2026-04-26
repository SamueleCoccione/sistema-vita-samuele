import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'sv_rucking';
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { date: today(), km: '', duration: '', bagKg: '' };

export default function RuckingTracker() {
  const [sessions, setSessions] = useFirebaseState(KEY, []);
  const [form, setForm] = useState(EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = () => {
    const km = parseFloat(form.km);
    const duration = parseInt(form.duration, 10);
    const bagKg = parseFloat(form.bagKg);
    if (!form.date || isNaN(km) || isNaN(duration) || isNaN(bagKg)) return;
    setSessions([{ id: Date.now(), date: form.date, km, duration, bagKg }, ...sessions]);
    setForm(f => ({ ...f, km: '', duration: '', bagKg: '' }));
  };

  const remove = (id) => setSessions(sessions.filter(s => s.id !== id));

  const totalKm = sessions.reduce((s, e) => s + e.km, 0);
  const avgPace = sessions.length
    ? (sessions.reduce((s, e) => s + e.duration / e.km, 0) / sessions.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="cm-stat-strip">
        <div className="cm-stat-cell"><div className="cm-stat-label">Sessioni</div><div className="cm-stat-value">{sessions.length}</div></div>
        <div className="cm-stat-cell"><div className="cm-stat-label">KM totali</div><div className="cm-stat-value">{totalKm.toFixed(1)}</div></div>
        <div className="cm-stat-cell"><div className="cm-stat-label">Pace medio</div><div className="cm-stat-value">{avgPace ? `${avgPace}'` : '—'}</div></div>
      </div>

      <div className="cm-form-row">
        <div className="cm-form-group" style={{ maxWidth: 120 }}>
          <label className="cm-section-label">Data</label>
          <input type="date" className="cm-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="cm-form-group" style={{ maxWidth: 72 }}>
          <label className="cm-section-label">KM</label>
          <input type="number" className="cm-input" value={form.km} placeholder="5" step="0.1" onChange={e => set('km', e.target.value)} />
        </div>
        <div className="cm-form-group" style={{ maxWidth: 80 }}>
          <label className="cm-section-label">Min</label>
          <input type="number" className="cm-input" value={form.duration} placeholder="60" onChange={e => set('duration', e.target.value)} />
        </div>
        <div className="cm-form-group" style={{ maxWidth: 80 }}>
          <label className="cm-section-label">Zaino kg</label>
          <input type="number" className="cm-input" value={form.bagKg} placeholder="10" step="0.5" onChange={e => set('bagKg', e.target.value)} />
        </div>
        <div className="cm-form-group" style={{ justifyContent: 'flex-end' }}>
          <button className="cm-btn" onClick={add}>+ Log</button>
        </div>
      </div>

      {sessions.length === 0
        ? <div className="cm-empty">Nessuna sessione ancora</div>
        : (
          <table className="cm-table">
            <thead><tr><th>Data</th><th>KM</th><th>Min</th><th>Zaino</th><th>Pace</th><th></th></tr></thead>
            <tbody>
              {sessions.slice(0, 8).map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date + 'T12:00:00').toLocaleDateString('it-IT')}</td>
                  <td><strong>{s.km}</strong></td>
                  <td>{s.duration}</td>
                  <td>{s.bagKg} kg</td>
                  <td>{(s.duration / s.km).toFixed(1)}'</td>
                  <td><button className="cm-icon-btn" onClick={() => remove(s.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}
