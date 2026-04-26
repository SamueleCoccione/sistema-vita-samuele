import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const KEY = 'sv_weight';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function fmtDateShort(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

function fmtDateAxis(s) {
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { kg, delta } = payload[0].payload;
  return (
    <div className="wt-tooltip">
      <div className="wt-tooltip-date">{label}</div>
      <div className="wt-tooltip-kg">{kg} <span>kg</span></div>
      {delta !== null && (
        <div className={`wt-tooltip-delta${delta > 0 ? ' up' : delta < 0 ? ' down' : ''}`}>
          {delta > 0 ? '+' : ''}{delta} kg
        </div>
      )}
    </div>
  );
}

export default function WeightTracker() {
  const [entries, persist] = useFirebaseState(KEY, []);
  const [weight, setWeight] = useState('');
  const [date,   setDate]   = useState(todayStr);

  const add = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0 || !date) return;
    const filtered = entries.filter(e => e.date !== date);
    const next = [...filtered, { id: Date.now(), date, weight: w }]
      .sort((a, b) => a.date.localeCompare(b.date));
    persist(next);
    setWeight('');
  };

  const remove = (id) => persist(entries.filter(e => e.id !== id));

  // Sorted asc for chart and stats
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Stats
  const latest   = sorted.at(-1) ?? null;
  const prev     = sorted.at(-2) ?? null;
  const delta    = latest && prev ? +(latest.weight - prev.weight).toFixed(1) : null;
  const minW     = sorted.length ? Math.min(...sorted.map(e => e.weight)) : null;
  const maxW     = sorted.length ? Math.max(...sorted.map(e => e.weight)) : null;
  const totalDelta = sorted.length > 1
    ? +(sorted.at(-1).weight - sorted[0].weight).toFixed(1)
    : null;

  // Chart data: last 30, with per-point delta
  const chartData = sorted.slice(-30).map((e, i, arr) => ({
    date:  e.date,
    label: fmtDateAxis(e.date),
    kg:    e.weight,
    delta: i > 0 ? +(e.weight - arr[i - 1].weight).toFixed(1) : null,
  }));

  // Log: newest first, with delta vs previous
  const logEntries = [...sorted].reverse().map((e, i, arr) => ({
    ...e,
    delta: i < arr.length - 1 ? +(e.weight - arr[i + 1].weight).toFixed(1) : null,
  }));

  return (
    <div>
      {/* ── Input form ── */}
      <div className="wt-form">
        <div className="wt-form-group">
          <label className="cm-label">Data</label>
          <input type="date" className="cm-input" value={date}
            onChange={e => setDate(e.target.value)} style={{ width: 150 }} />
        </div>
        <div className="wt-form-group">
          <label className="cm-label">Peso (kg)</label>
          <input
            type="number" className="cm-input" value={weight}
            step="0.1" placeholder="0.0"
            onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            style={{ width: 90 }}
          />
        </div>
        <button className="cm-btn" onClick={add} style={{ alignSelf: 'flex-end' }}>
          + Salva
        </button>
      </div>

      {/* ── Tech chart ── */}
      {sorted.length > 0 && (
        <div className="wt-chart-wrap">

          {/* Stats row */}
          <div className="wt-stats-row">
            <div className="wt-stat">
              <div className="wt-stat-num">
                {latest.weight}
                <span className="wt-stat-unit">kg</span>
              </div>
              <div className="wt-stat-lbl">attuale</div>
            </div>

            {delta !== null && (
              <div className="wt-stat">
                <div className={`wt-stat-delta${delta > 0 ? ' up' : delta < 0 ? ' down' : ' same'}`}>
                  {delta > 0 ? '+' : ''}{delta}
                </div>
                <div className="wt-stat-lbl">ultima var.</div>
              </div>
            )}

            {totalDelta !== null && (
              <div className="wt-stat">
                <div className={`wt-stat-delta${totalDelta > 0 ? ' up' : totalDelta < 0 ? ' down' : ' same'}`}>
                  {totalDelta > 0 ? '+' : ''}{totalDelta}
                </div>
                <div className="wt-stat-lbl">totale</div>
              </div>
            )}

            {minW !== null && (
              <div className="wt-stat">
                <div className="wt-stat-minmax">{minW}</div>
                <div className="wt-stat-lbl">min</div>
              </div>
            )}

            {maxW !== null && (
              <div className="wt-stat">
                <div className="wt-stat-minmax">{maxW}</div>
                <div className="wt-stat-lbl">max</div>
              </div>
            )}

            <div className="wt-stat wt-stat-right">
              <div className="wt-stat-minmax">{sorted.length}</div>
              <div className="wt-stat-lbl">misurazioni</div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wt-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#c8f564" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#c8f564" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="1 5"
                  stroke="rgba(200,245,100,0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="transparent"
                  tick={{ fill: '#404040', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fill: '#404040', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 0.8', 'dataMax + 0.8']}
                  tickFormatter={v => `${v}`}
                  width={34}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="kg"
                  stroke="#c8f564"
                  strokeWidth={1.5}
                  fill="url(#wt-grad)"
                  dot={{ fill: '#c8f564', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#c8f564', r: 5, stroke: 'rgba(200,245,100,0.30)', strokeWidth: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="wt-chart-single">
              <span className="wt-stat-num" style={{ fontSize: 48 }}>
                {sorted[0].weight}<span className="wt-stat-unit">kg</span>
              </span>
              <span className="wt-stat-lbl">prima misurazione — aggiungi la seconda per il grafico</span>
            </div>
          )}
        </div>
      )}

      {/* ── Log ── */}
      {sorted.length === 0 ? (
        <div className="cm-empty">Nessuna registrazione — inserisci il primo peso</div>
      ) : (
        <div className="wt-log">
          {logEntries.slice(0, 20).map(e => (
            <div key={e.id} className="wt-log-row">
              <span className="wt-log-date">{fmtDateShort(e.date)}</span>
              <span className="wt-log-kg">{e.weight} kg</span>
              {e.delta !== null && (
                <span className={`wt-log-delta${e.delta > 0 ? ' up' : e.delta < 0 ? ' down' : ''}`}>
                  {e.delta > 0 ? '+' : ''}{e.delta}
                </span>
              )}
              <button className="cm-icon-btn" style={{ marginLeft: 'auto' }} onClick={() => remove(e.id)}>×</button>
            </div>
          ))}
          {sorted.length > 20 && (
            <div className="wt-log-more">+ altri {sorted.length - 20} record</div>
          )}
        </div>
      )}
    </div>
  );
}
