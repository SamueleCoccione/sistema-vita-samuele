import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'rel_energia';

function today() { return new Date().toISOString().split('T')[0]; }
function weekStart() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}
export default function EnergiaSociale() {
  const [entries, setEntries] = useFirebaseState(KEY, []);
  const cw       = weekStart();
  const existing = entries.find(e => e.week === cw) || null;

  const [apertura, setApertura] = useState(existing?.apertura ?? 5);
  const [evitato,  setEvitato]  = useState(existing?.evitato  ?? false);
  const [disagio,  setDisagio]  = useState(existing?.disagio  ?? false);

  const pct = ((apertura - 1) / 9) * 100;

  const save = () => {
    const entry = { id: existing?.id || Date.now(), week: cw, date: today(), apertura, evitato, disagio };
    setEntries(existing
      ? entries.map(e => e.week === cw ? entry : e)
      : [...entries, entry]);
  };

  const chartData = useMemo(() =>
    [...entries]
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-16)
      .map(e => ({ week: fmtDate(e.week), apertura: e.apertura })),
  [entries]);

  const last = entries.length > 0
    ? [...entries].sort((a, b) => b.week.localeCompare(a.week))[0]
    : null;

  const NEGATIVE_CHECKS = [
    { k: 'evitato',  val: evitato,  setter: setEvitato,  label: 'Ho evitato situazioni sociali per paura'   },
    { k: 'disagio',  val: disagio,  setter: setDisagio,  label: 'Mi sono sentito a disagio nel confronto'   },
  ];

  return (
    <div>
      {/* Last check summary */}
      {last && last.week !== cw && (
        <div className="ml-stat-strip">
          <div>
            <div className="ml-stat-label">Ultima settimana · {fmtDate(last.week)}</div>
            <div className="ml-stat-mid">
              {last.apertura}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text2)' }}>/10</span>
            </div>
          </div>
          <div>
            <div className="ml-stat-label">Evitato per paura</div>
            <div className="ml-stat-mid" style={{ color: last.evitato ? '#b94040' : '#3a8a2a' }}>
              {last.evitato ? 'Sì' : 'No'}
            </div>
          </div>
          <div>
            <div className="ml-stat-label">Disagio nel confronto</div>
            <div className="ml-stat-mid" style={{ color: last.disagio ? '#b94040' : '#3a8a2a' }}>
              {last.disagio ? 'Sì' : 'No'}
            </div>
          </div>
        </div>
      )}

      <div className="rl-check-form">
        <div className="rl-week-label">{fmtDate(cw)} — settimana in corso</div>

        {/* Apertura slider */}
        <div className="ml-slider-field" style={{ maxWidth: 420, marginBottom: 20 }}>
          <div className="ml-slider-top">
            <span className="cm-label">Apertura agli altri</span>
            <span className="ml-slider-val">{apertura}<span className="ml-slider-denom">/10</span></span>
          </div>
          <div className="ml-slider-hint">Quanto ti sei sentito aperto, presente, disponibile con gli altri?</div>
          <div className="ml-slider-wrap">
            <input
              type="range" min={1} max={10} step={1} value={apertura}
              onChange={e => setApertura(Number(e.target.value))}
              className="ml-slider"
              style={{ '--pct': `${pct}%` }}
            />
          </div>
          <div className="ml-slider-ticks"><span>chiuso</span><span>aperto</span></div>
        </div>

        {/* Negative boolean checks */}
        <div className="rl-checks" style={{ marginBottom: 16 }}>
          {NEGATIVE_CHECKS.map(({ k, val, setter, label }) => (
            <div key={k} className="rl-check-item" onClick={() => setter(v => !v)}>
              <span className={`rl-check-box${val ? ' checked-red' : ''}`}>{val ? '✓' : '○'}</span>
              <span className="rl-check-label">{label}</span>
            </div>
          ))}
        </div>

        <button className="cm-btn" onClick={save}>
          {existing ? 'Aggiorna settimana' : 'Salva settimana'}
        </button>
      </div>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div className="ml-chart-wrap" style={{ marginTop: 20 }}>
          <div className="cm-label" style={{ marginBottom: 12 }}>Trend apertura sociale</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 0 }} />
              <ReferenceLine y={7} stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={1} />
              <Line type="monotone" dataKey="apertura" stroke="var(--text)" strokeWidth={1.5} dot={{ r: 3 }} name="Apertura" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {entries.length > 0 && (
        <div className="rl-history" style={{ marginTop: 16 }}>
          {[...entries].sort((a, b) => b.week.localeCompare(a.week)).slice(0, 8).map(e => (
            <div key={e.id || e.week} className="rl-history-row">
              <span className="rl-history-week">{fmtDate(e.week)}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {e.apertura}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text2)' }}>/10</span>
              </span>
              <span style={{ fontSize: 11, color: e.evitato ? '#b94040' : 'var(--text3)' }}>
                {e.evitato ? '⚠ evitato' : '○ non evitato'}
              </span>
              <span style={{ fontSize: 11, color: e.disagio ? '#b94040' : 'var(--text3)' }}>
                {e.disagio ? '⚠ disagio' : '○ ok'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
