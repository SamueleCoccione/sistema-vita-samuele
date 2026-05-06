import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import WeightTracker from '../../../components/corpo-mente/WeightTracker';
import './drawers.css';

const RANGES = [
  { label: '7g',  days: 7   },
  { label: '30g', days: 30  },
  { label: '90g', days: 90  },
  { label: 'Tutto', days: null },
];

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function WtTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="dr-tooltip">
      <span className="dr-tooltip-date">{d.label}</span>
      <span className="dr-tooltip-val">{d.kg} kg</span>
    </div>
  );
}

export default function WeightDrawer() {
  const [entries] = useFirebaseState('sv_weight', []);
  const [range, setRange] = useState(30);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  const chartData = useMemo(() => {
    const base = range ? sorted.slice(-range) : sorted;
    return base.map(e => ({ label: fmtDate(e.date), kg: e.weight }));
  }, [sorted, range]);

  return (
    <div className="dr-content">
      {chartData.length >= 2 && (
        <section className="dr-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="dr-section-title" style={{ margin: 0 }}>Andamento peso</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {RANGES.map(r => (
                <button
                  key={r.label}
                  onClick={() => setRange(r.days)}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '4px 10px',
                    border: '1px solid',
                    borderColor: range === r.days ? 'var(--color-teal)' : 'var(--color-line)',
                    borderRadius: 999,
                    background: range === r.days ? 'var(--color-teal)' : 'transparent',
                    color: range === r.days ? '#fff' : 'var(--color-ink-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="dr-chart-wrap">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="wt-dr-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2BB3A8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2BB3A8" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }}
                  tickLine={false} axisLine={false}
                  width={36}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<WtTooltip />} cursor={{ stroke: 'var(--color-line)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="kg"
                  stroke="#2BB3A8"
                  strokeWidth={2}
                  fill="url(#wt-dr-grad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#2BB3A8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="dr-section">
        <h3 className="dr-section-title">Inserisci / Storico</h3>
        <WeightTracker />
      </section>
    </div>
  );
}
