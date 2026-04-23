import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const KEY = 'sv_weight';
const today = () => new Date().toISOString().split('T')[0];

export default function WeightTracker() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  });
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState('');

  const add = () => {
    const w = parseFloat(weight);
    if (!date || isNaN(w) || w <= 0) return;
    const next = [...entries, { id: Date.now(), date, weight: w }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setWeight('');
  };

  const remove = (id) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const chartData = entries.slice(-14).map(e => ({
    d: e.date.slice(5),
    kg: e.weight,
  }));

  return (
    <div>
      <div className="cm-form-row">
        <div className="cm-form-group" style={{ maxWidth: 140 }}>
          <label className="cm-section-label">Data</label>
          <input type="date" className="cm-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="cm-form-group" style={{ maxWidth: 100 }}>
          <label className="cm-section-label">Peso (kg)</label>
          <input
            type="number" className="cm-input" value={weight} step="0.1" placeholder="0.0"
            onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
        </div>
        <div className="cm-form-group" style={{ justifyContent: 'flex-end' }}>
          <button className="cm-btn" onClick={add}>+ Log</button>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="cm-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d0c8" vertical={false} />
              <XAxis dataKey="d" stroke="#b8b4ac" tick={{ fill: '#6e6a62', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#b8b4ac" tick={{ fill: '#6e6a62', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Tooltip
                contentStyle={{ background: '#f5f3ef', border: '1px solid #d4d0c8', borderRadius: 0, color: '#1a1a1a', fontSize: 12 }}
                labelStyle={{ color: '#6e6a62', marginBottom: 2 }}
                formatter={(v) => [`${v} kg`, 'Peso']}
              />
              <Line type="monotone" dataKey="kg" stroke="#1a1a1a" strokeWidth={1.5}
                dot={{ fill: '#1a1a1a', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {entries.length === 0
        ? <div className="cm-empty">Nessuna registrazione ancora</div>
        : (
          <table className="cm-table">
            <thead><tr><th>Data</th><th>Peso</th><th></th></tr></thead>
            <tbody>
              {[...entries].reverse().slice(0, 8).map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date + 'T12:00:00').toLocaleDateString('it-IT')}</td>
                  <td><strong>{e.weight} kg</strong></td>
                  <td><button className="cm-icon-btn" onClick={() => remove(e.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}
