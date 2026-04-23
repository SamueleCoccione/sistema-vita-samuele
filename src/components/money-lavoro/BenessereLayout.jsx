import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const KEY = 'ml_benessere';

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function Slider({ label, value, onChange, hint }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="ml-slider-field">
      <div className="ml-slider-top">
        <span className="cm-label">{label}</span>
        <span className="ml-slider-val">{value}<span className="ml-slider-denom">/10</span></span>
      </div>
      {hint && <div className="ml-slider-hint">{hint}</div>}
      <div className="ml-slider-wrap">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="ml-slider"
          style={{ '--pct': `${pct}%` }}
        />
      </div>
      <div className="ml-slider-ticks"><span>basso</span><span>alto</span></div>
    </div>
  );
}

export default function BenessereLayout() {
  const [checks,  setChecks]  = useState(load);
  const [burnout, setBurnout] = useState(5);
  const [purpose, setPurpose] = useState(5);
  const [carico,  setCarico]  = useState(5);

  const save = () => {
    const entry = { id: Date.now(), date: new Date().toISOString().split('T')[0], burnout, purpose, carico };
    const next  = [...checks, entry];
    setChecks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const remove = id => {
    const next = checks.filter(c => c.id !== id);
    setChecks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const chartData = [...checks].slice(-16).map(c => ({
    date:    fmtDate(c.date),
    burnout: c.burnout,
    purpose: c.purpose,
    carico:  c.carico,
  }));

  const last = checks[checks.length - 1];

  return (
    <div>
      {/* Check form */}
      <div className="ml-bw-form">
        <Slider
          label="Burnout"
          value={burnout}
          onChange={setBurnout}
          hint="Quanto ti senti esaurito/a questa settimana?"
        />
        <Slider
          label="Purpose"
          value={purpose}
          onChange={setPurpose}
          hint="Quanto il lavoro ti dà senso e significato?"
        />
        <Slider
          label="Carico di lavoro"
          value={carico}
          onChange={setCarico}
          hint="Quanto senti il peso delle cose da fare?"
        />
        <button className="cm-btn" onClick={save} style={{ marginTop: 8 }}>
          Salva check settimanale
        </button>
      </div>

      {/* Last check summary */}
      {last && (
        <div className="ml-bw-last">
          <span className="ml-stat-label">Ultimo check · {fmtDate(last.date)}</span>
          <div className="ml-bw-chips">
            <span className="ml-bw-chip" style={{ color: last.burnout > 7 ? '#b94040' : 'var(--text2)' }}>
              Burnout {last.burnout}
            </span>
            <span className="ml-bw-chip" style={{ color: last.purpose >= 7 ? 'var(--accent-text)' : 'var(--text2)', background: last.purpose >= 7 ? 'var(--accent)' : 'transparent' }}>
              Purpose {last.purpose}
            </span>
            <span className="ml-bw-chip">Carico {last.carico}</span>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {checks.length < 2 ? (
        <div className="cm-empty" style={{ marginTop: 24 }}>
          Aggiungi almeno 2 check settimanali per vedere il grafico di correlazione
        </div>
      ) : (
        <div className="ml-chart-wrap" style={{ marginTop: 24 }}>
          <div className="cm-label" style={{ marginBottom: 12 }}>Correlazione burnout / purpose / carico</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 10]} tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={22} ticks={[1, 3, 5, 7, 10]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 0 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10, color: 'var(--text2)' }} />
              <Line type="monotone" dataKey="burnout" stroke="#b94040" strokeWidth={1.5} dot={{ r: 3 }} name="Burnout" />
              <Line type="monotone" dataKey="purpose" stroke="#c8f564" strokeWidth={1.5} dot={{ r: 3 }} name="Purpose" />
              <Line type="monotone" dataKey="carico"  stroke="var(--text2)" strokeWidth={1} strokeDasharray="4 3" dot={{ r: 2 }} name="Carico" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {checks.length > 0 && (
        <div className="ml-bw-history">
          {[...checks].reverse().slice(0, 8).map(c => (
            <div key={c.id} className="ml-bw-row">
              <span className="ml-history-date">{c.date}</span>
              <span className="ml-bw-cell" style={{ color: c.burnout > 7 ? '#b94040' : 'var(--text2)' }}>B {c.burnout}</span>
              <span className="ml-bw-cell" style={{ color: c.purpose >= 7 ? '#5a8a2a' : 'var(--text2)' }}>P {c.purpose}</span>
              <span className="ml-bw-cell">C {c.carico}</span>
              <button className="cm-icon-btn" onClick={() => remove(c.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
