import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import StravaTracker from '../../../components/corpo-mente/StravaTracker';
import './drawers.css';

function fmtDateShort(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
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

/* Custom tooltip per il bar chart */
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

/* Heatmap: 7 righe (Lun→Dom) × 13 settimane */
function buildHeatmap(activities) {
  const today   = new Date();
  const todayJs = today.getDay(); // 0=Dom, 1=Lun…
  // Fine = domenica prossima o oggi se domenica
  const daysToSun = todayJs === 0 ? 0 : 7 - todayJs;
  const endDate   = new Date(today);
  endDate.setDate(today.getDate() + daysToSun);

  // Inizio = lunedì di 13 settimane fa
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7 * 13 + 1);

  const actMap = {};
  activities.forEach(a => {
    actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0);
  });

  const cells = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dateStr = cur.toISOString().split('T')[0];
    cells.push({
      date:     dateStr,
      km:       actMap[dateStr] || 0,
      isFuture: cur > today,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function heatColor(km, isFuture) {
  if (isFuture) return 'transparent';
  if (km === 0)  return '#e8e4dc';
  if (km < 4)    return '#7dd4d0';
  if (km < 8)    return '#2BB3A8';
  return '#1a7a74';
}

export default function RuckingDrawer() {
  const [activities] = useFirebaseState('sv_strava_activities', []);
  /* ── Bar chart: ultimi 30 giorni ── */
  const barData = useMemo(() => {
    const today = new Date();
    const actMap = {};
    activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + (a.km || 0); });

    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date:  dateStr,
        label: i % 7 === 0 ? fmtDateShort(dateStr) : '',
        km:    parseFloat((actMap[dateStr] || 0).toFixed(2)),
      };
    });
  }, [activities]);

  /* ── Heatmap ── */
  const heatmap = useMemo(() => buildHeatmap(activities), [activities]);

  return (
    <div className="dr-content">

      {/* ── Sincronizzazione Strava ── */}
      <section className="dr-section">
        <h3 className="dr-section-title">Sincronizzazione Strava</h3>
        <StravaTracker />
      </section>

      {/* ── Bar chart km/giorno ── */}
      <section className="dr-section">
        <h3 className="dr-section-title">Km — ultimi 30 giorni</h3>
        <div className="dr-chart-wrap">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={7} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6B5D52', fontFamily: 'inherit' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<KmTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="km" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.km > 0 ? '#2BB3A8' : '#E5D9C2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Ultime attività con dettaglio ── */}
      {activities.length > 0 && (
        <section className="dr-section">
          <h3 className="dr-section-title">Ultime attività</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activities.slice(0, 10).map(a => {
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
                  {/* top row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasExtra ? 8 : 0 }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                        {a.name || a.type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginLeft: 8 }}>
                        {fmtDateShort(a.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--color-teal)' }}>
                        {a.km}
                      </span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>km</span>
                    </div>
                  </div>
                  {/* detail pills */}
                  {hasExtra && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {duration && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          ⏱ {duration}
                        </span>
                      )}
                      {pace && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          🚶 {pace}
                        </span>
                      )}
                      {a.elevation > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          ↑ {a.elevation}m
                        </span>
                      )}
                      {a.avgHR && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          ♥ {a.avgHR}{a.maxHR ? `/${a.maxHR}` : ''} bpm
                        </span>
                      )}
                      {a.calories && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          🔥 {a.calories} kcal
                        </span>
                      )}
                      {a.sufferScore != null && a.sufferScore > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
                          💪 {a.sufferScore} suffer
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Heatmap 13 settimane ── */}
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
          {[['#7dd4d0', '1–4'], ['#2BB3A8', '4–8'], ['#1a7a74', '8+']].map(([color, label]) => (
            <span key={label} className="dr-legend-item">
              <span className="dr-legend-dot" style={{ background: color }} />
              {label} km
            </span>
          ))}
        </div>
      </section>

    </div>
  );
}
