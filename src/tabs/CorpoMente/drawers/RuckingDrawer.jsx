import { useMemo, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import StravaTracker from '../../../components/corpo-mente/StravaTracker';
import './drawers.css';

const TEAL = '#2BB3A8';

function fmtDateShort(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// Data locale YYYY-MM-DD — evita lo shift UTC+1/+2 di toISOString()
function localDateStr(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function fmtPace(secPerKm) {
  if (!secPerKm) return null;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}′${String(s).padStart(2, '0')}″/km`;
}

function fmtDuration(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/* ── Tooltip bar chart ── */
function KmTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="dr-tooltip">
      <span className="dr-tooltip-date">{fmtDateShort(d.date)}</span>
      <span className="dr-tooltip-val">{d.km > 0 ? `${d.km} km` : '—'}</span>
    </div>
  );
}

/* ── Inline peso zaino per singola attività ── */
function RuckWeightInput({ activityId, weights, setWeights }) {
  const current = weights?.[activityId];
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef = useRef();

  function startEdit() {
    setDraft(current != null ? String(current) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commit() {
    const val = parseFloat(draft.replace(',', '.'));
    const next = { ...(weights || {}) };
    if (!isNaN(val) && val > 0) {
      next[activityId] = Math.round(val * 10) / 10;
    } else {
      delete next[activityId];
    }
    setWeights(next);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="50"
        step="0.5"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        placeholder="0"
        style={{
          width: 52,
          fontFamily: 'var(--font-mono)', fontSize: 12,
          border: `1px solid ${TEAL}`, borderRadius: 6,
          background: 'var(--color-surface)', color: 'var(--color-ink)',
          padding: '3px 6px', textAlign: 'right',
          outline: 'none',
        }}
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Modifica peso zaino"
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        background: 'none', border: 'none', cursor: 'pointer',
        color: current != null ? TEAL : 'var(--color-ink-muted)',
        padding: '2px 4px', borderRadius: 4,
      }}
    >
      🎒 {current != null ? `${current} kg` : '— kg'}
    </button>
  );
}

/* ── Stat media peso zaino ── */
function RuckWeightStat({ activities, weights }) {
  const { avg, avg30, avg30prev, withWeight } = useMemo(() => {
    if (!weights || !activities.length) return { avg: null, avg30: null, avg30prev: null, withWeight: 0 };

    const today  = new Date();
    const d30ago = new Date(today); d30ago.setDate(today.getDate() - 30);
    const d60ago = new Date(today); d60ago.setDate(today.getDate() - 60);

    const withW = activities.filter(a => weights[a.id] != null);
    if (!withW.length) return { avg: null, avg30: null, avg30prev: null, withWeight: 0 };

    const mean = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

    const allVals    = withW.map(a => weights[a.id]);
    const vals30     = withW.filter(a => new Date(a.date + 'T12:00:00') >= d30ago).map(a => weights[a.id]);
    const vals30prev = withW.filter(a => {
      const d = new Date(a.date + 'T12:00:00');
      return d >= d60ago && d < d30ago;
    }).map(a => weights[a.id]);

    return {
      avg:      mean(allVals),
      avg30:    mean(vals30),
      avg30prev:mean(vals30prev),
      withWeight: withW.length,
    };
  }, [activities, weights]);

  if (avg == null) return null;

  const delta = avg30 != null && avg30prev != null ? (avg30 - avg30prev).toFixed(1) : null;
  const deltaNum = delta != null ? parseFloat(delta) : 0;

  return (
    <section className="dr-section">
      <h3 className="dr-section-title">Peso medio zaino (ruck)</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--color-ink)' }}>
          {avg.toFixed(1)}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)' }}>kg</span>
        {avg30 != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
            ultimi 30 gg: <strong style={{ color: 'var(--color-ink)' }}>{avg30.toFixed(1)} kg</strong>
          </span>
        )}
      </div>

      {delta != null && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
            color: deltaNum > 0 ? 'var(--color-success)' : deltaNum < 0 ? 'var(--color-magenta)' : 'var(--color-ink-muted)',
          }}>
            {deltaNum > 0 ? '↑' : deltaNum < 0 ? '↓' : '→'} {deltaNum > 0 ? '+' : ''}{delta} kg
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
            rispetto ai 30 gg precedenti
          </span>
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', margin: '8px 0 0' }}>
        Su {withWeight} session{withWeight !== 1 ? 'i' : 'e'} con peso registrato
      </p>
    </section>
  );
}

/* ── Heatmap: 7 righe (Lun→Dom) × 13 settimane ── */
function buildHeatmap(activities) {
  const today    = new Date();
  const todayJs  = today.getDay();
  const daysToSun = todayJs === 0 ? 0 : 7 - todayJs;
  const endDate  = new Date(today);
  endDate.setDate(today.getDate() + daysToSun);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7 * 13 + 1);

  const actMap = {};
  activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0); });

  const cells = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dateStr = localDateStr(cur);
    cells.push({ date: dateStr, km: actMap[dateStr] || 0, isFuture: cur > today });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function heatColor(km, isFuture) {
  if (isFuture) return 'transparent';
  if (km === 0)  return '#e8e4dc';
  if (km < 4)    return '#7dd4d0';
  if (km < 8)    return TEAL;
  return '#1a7a74';
}

/* ── Main ── */
export default function RuckingDrawer() {
  const [activities]        = useFirebaseState('sv_strava_activities', []);
  const [weights, setWeights] = useFirebaseState('sv_ruck_weights', {});

  /* Bar chart: ultimi 30 giorni */
  const barData = useMemo(() => {
    const today  = new Date();
    const actMap = {};
    activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0); });

    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const dateStr = localDateStr(d);
      return {
        date: dateStr,
        km:   parseFloat((actMap[dateStr] || 0).toFixed(2)),
      };
    });
  }, [activities]);

  const heatmap = useMemo(() => buildHeatmap(activities), [activities]);

  return (
    <div className="dr-content">

      {/* Strava — status + sync discreto */}
      <section className="dr-section" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <StravaTracker />
      </section>

      {/* Ultime 3 attività con peso zaino */}
      {activities.length > 0 && (
        <section className="dr-section">
          <h3 className="dr-section-title">Ultime attività</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activities.slice(0, 3).map(a => {
              const pace     = fmtPace(a.avgPace);
              const duration = fmtDuration(a.duration);
              const hasExtra = pace || a.avgHR || a.calories;
              return (
                <div key={a.id} style={{
                  padding: '12px 14px',
                  background: 'rgba(43,179,168,0.05)',
                  borderRadius: 10,
                  border: '1px solid rgba(43,179,168,0.12)',
                }}>
                  {/* top row: nome + data + km + zaino */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: hasExtra ? 8 : 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                        {a.name || a.type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginLeft: 8 }}>
                        {fmtDateShort(a.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <RuckWeightInput
                        activityId={a.id}
                        weights={weights}
                        setWeights={setWeights}
                      />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: TEAL }}>
                          {a.km}
                        </span>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>km</span>
                      </div>
                    </div>
                  </div>

                  {/* detail pills */}
                  {hasExtra && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {duration && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>⏱ {duration}</span>
                      )}
                      {pace && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>🚶 {pace}</span>
                      )}
                      {a.elevation > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>↑ {a.elevation}m</span>
                      )}
                      {a.avgHR && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>♥ {a.avgHR}{a.maxHR ? `/${a.maxHR}` : ''} bpm</span>
                      )}
                      {a.calories && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>🔥 {a.calories} kcal</span>
                      )}
                      {a.sufferScore != null && a.sufferScore > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>💪 {a.sufferScore} suffer</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Heatmap 13 settimane */}
      <section className="dr-section">
        <h3 className="dr-section-title">Costanza — 13 settimane</h3>
        <div className="dr-heatmap-wrap">
          <div className="dr-heatmap-days">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="dr-heatmap-day">{d}</span>
            ))}
          </div>
          <div className="dr-heatmap">
            {heatmap.map((cell, i) => (
              <div
                key={i}
                className="dr-heatmap-cell"
                style={{ background: heatColor(cell.km, cell.isFuture) }}
                title={cell.isFuture ? '' : `${cell.date}: ${cell.km > 0 ? cell.km.toFixed(1) + ' km' : 'riposo'}`}
              />
            ))}
          </div>
        </div>
        <div className="dr-heatmap-legend">
          <span className="dr-legend-text">0 km</span>
          {[['#7dd4d0', '1–4'], [TEAL, '4–8'], ['#1a7a74', '8+']].map(([color, label]) => (
            <span key={label} className="dr-legend-item">
              <span className="dr-legend-dot" style={{ background: color }} />
              {label} km
            </span>
          ))}
        </div>
      </section>

      {/* Bar chart km/giorno */}
      <section className="dr-section">
        <h3 className="dr-section-title">Km — ultimi 30 giorni</h3>
        <div className="dr-chart-wrap">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={7} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="date"
                ticks={barData.filter((_, i) => i % 7 === 0).map(d => d.date)}
                tickFormatter={v => fmtDateShort(v)}
                tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<KmTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="km" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.km > 0 ? TEAL : '#E5D9C2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Peso medio zaino */}
      <RuckWeightStat activities={activities} weights={weights} />

    </div>
  );
}
