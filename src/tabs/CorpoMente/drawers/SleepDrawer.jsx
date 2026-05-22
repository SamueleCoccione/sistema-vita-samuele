import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const ACCENT    = '#6B5DD3';
const REF_MIN   = 420; // 7h in minuti
const SC_BASE   = '/api/sleepcloud';

/* ─── helpers display ─── */
function fmtDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtNightDate(toTime) {
  return new Date(toTime).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function sleepQuality(durationMinutes, deepSleep) {
  if (durationMinutes >= 420 && (deepSleep || 0) >= 0.20) return { label: 'Ottimo',        color: 'var(--color-success)' };
  if (durationMinutes >= 360 && (deepSleep || 0) >= 0.15) return { label: 'Buono',         color: 'var(--color-flame)' };
  return                                                           { label: 'Insufficiente', color: 'var(--color-magenta)' };
}

function noiseLabel(level) {
  if ((level || 0) < 20)  return 'Basso';
  if ((level || 0) <= 40) return 'Medio';
  return 'Alto';
}

/* ─── SleepCloud fetch ─── */
function mapRecord(s) {
  const toTime   = s.toTime;
  const fromTime = s.fromTime;
  return {
    date:            new Date(toTime).toISOString().split('T')[0],
    fromTime,
    toTime,
    durationMinutes: s.lengthMinutes ?? Math.round((toTime - fromTime) / 60000),
    deepSleep:       s.deepSleep      ?? 0,
    cycles:          s.cycles         ?? 0,
    rating:          s.rating         ?? 0,
    noiseLevel:      s.noiseLevel     ?? 0,
    snoringSeconds:  s.snoringSeconds ?? 0,
    tags:            s.tags           ?? [],
  };
}

async function fetchRecords(userToken, timestamp = 0) {
  const url = `${SC_BASE}?timestamp=${timestamp}&user_token=${encodeURIComponent(userToken)}`;
  const res  = await fetch(url, { mode: 'cors' });

  if (res.status === 401 || res.status === 403) {
    const e = new Error('auth'); e.status = 401; throw e;
  }
  if (!res.ok) throw new Error(`network:${res.status}`);

  const text = await res.text();
  if (!text.trim()) return [];

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('parse'); }

  if (data?.error) {
    const e = new Error(data.error); e.status = 401; throw e;
  }

  const arr = data.sleeps ?? data.records ?? (Array.isArray(data) ? data : null);
  if (!arr) throw new Error(`unknown_shape:${Object.keys(data).join(',')}`);

  const records = [];
  for (const s of arr) {
    try { records.push(mapRecord(s)); }
    catch { /* record malformato, ignorato */ }
  }
  return records;
}

/* ─── Setup section ─── */
function SetupSection({ config, setConfig, log, setLog }) {
  const [token,  setToken]  = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error_auth | error_net | error_empty

  const busy = status === 'loading';

  async function handleConnect() {
    const t = token.trim();
    if (!t) return;
    setStatus('loading');
    try {
      const records = await fetchRecords(t, 0);
      if (records.length === 0) { setStatus('error_empty'); return; }
      const lastTime = Math.max(...records.map(r => r.toTime));
      setLog(records);
      setConfig({ user_token: t, ultimo_sync: lastTime });
    } catch (e) {
      setStatus(e.status === 401 ? 'error_auth' : 'error_net');
    }
  }

  const errMsg = {
    error_auth:  'Token non valido. Controllalo in Sleep as Android → Impostazioni → Servizi → SleepCloud.',
    error_net:   'Errore di rete. Verifica la connessione e riprova.',
    error_empty: 'Nessuna notte trovata. Assicurati di aver abilitato il backup SleepCloud nell\'app.',
  }[status];

  return (
    <section className="dr-section" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '40px 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 40 }}>🌙</span>
        <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: '12px 0 6px' }}>
          Connetti Sleep as Android
        </h3>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', lineHeight: 1.65, margin: 0 }}>
          Trova il token in <strong>Impostazioni → Servizi → SleepCloud → Mostra token</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          className="cm-input"
          type="text"
          placeholder="Incolla qui il tuo SleepCloud token"
          value={token}
          onChange={e => { setToken(e.target.value); setStatus('idle'); }}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
        />
        <button
          className="cm-btn"
          onClick={handleConnect}
          disabled={busy || !token.trim()}
        >
          {busy ? 'Connessione…' : 'Connetti'}
        </button>
      </div>

      {errMsg && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-magenta)', margin: 0, lineHeight: 1.5 }}>
          {errMsg}
        </p>
      )}
    </section>
  );
}

/* ─── Sync button ─── */
function SyncButton({ config, setConfig, log, setLog }) {
  const [status, setStatus] = useState('idle');

  async function sync() {
    const token = config?.user_token;
    if (!token) return;
    setStatus('syncing');
    try {
      const incoming = await fetchRecords(token, config?.ultimo_sync || 0);
      if (incoming.length > 0) {
        const existing = new Set((log || []).map(r => r.fromTime));
        const newRecs  = incoming.filter(r => !existing.has(r.fromTime));
        if (newRecs.length > 0) {
          const merged = [...(log || []), ...newRecs].sort((a, b) => b.toTime - a.toTime);
          setLog(merged);
        }
        setConfig({ ...config, ultimo_sync: Math.max(...incoming.map(r => r.toTime)) });
      }
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus(e.status === 401 ? 'expired' : 'error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const label = { idle: 'Sincronizza', syncing: 'Sincronizzazione…', done: 'Aggiornato ✓', error: 'Errore rete', expired: 'Token scaduto' }[status];
  const color = ['done'].includes(status) ? 'var(--color-success)' : ['error','expired'].includes(status) ? 'var(--color-magenta)' : ACCENT;

  return (
    <button
      onClick={sync}
      disabled={status === 'syncing'}
      style={{
        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        padding: '7px 14px', borderRadius: 20,
        border: `1px solid ${color}`, background: 'transparent', color,
        cursor: status === 'syncing' ? 'wait' : 'pointer',
        transition: 'all 200ms', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Last night card ─── */
function LastNightCard({ entry }) {
  const q     = sleepQuality(entry.durationMinutes, entry.deepSleep);
  const noise = noiseLabel(entry.noiseLevel);

  return (
    <div style={{ background: 'var(--color-surface-alt, #ede9e2)', borderRadius: 16, padding: 20, border: '1px solid var(--color-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', textTransform: 'capitalize' }}>
          {fmtNightDate(entry.toTime)}
        </span>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: q.color, padding: '3px 10px', borderRadius: 20,
          border: `1px solid ${q.color}44`, background: `${q.color}10`,
        }}>
          {q.label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1, color: 'var(--color-ink)', marginBottom: 16 }}>
        {fmtDuration(entry.durationMinutes)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Profondo', val: `${Math.round((entry.deepSleep || 0) * 100)}%` },
          { label: 'Cicli',    val: entry.cycles || '—' },
          { label: 'Rating',   val: entry.rating ? `★ ${entry.rating.toFixed(1)} / 5` : '—' },
          { label: 'Rumore',   val: noise },
        ].map(({ label, val }) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px',
            borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-line)',
            flex: '1 0 40%',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{val}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 7-day chart ─── */
function SleepTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="dr-tooltip">
      <span className="dr-tooltip-date">{d.label}</span>
      <span className="dr-tooltip-val" style={{ color: ACCENT }}>{fmtDuration(d.minutes)}</span>
    </div>
  );
}

function TrendSection({ log }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const entry   = (log || []).filter(r => r.date === dateStr)
                                  .sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
      return {
        label:   d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        minutes: entry?.durationMinutes ?? 0,
      };
    });
  }, [log]);

  const avgMinutes = useMemo(() => {
    const valid = chartData.filter(d => d.minutes > 0);
    return valid.length ? Math.round(valid.reduce((s, d) => s + d.minutes, 0) / valid.length) : 0;
  }, [chartData]);

  return (
    <section className="dr-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="dr-section-title" style={{ margin: 0 }}>Ultimi 7 giorni</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
          media {fmtDuration(avgMinutes)}
        </span>
      </div>
      <div className="dr-chart-wrap">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => `${Math.floor(v / 60)}h`} tick={{ fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }} tickLine={false} axisLine={false} width={32} />
            <ReferenceLine y={REF_MIN} stroke={ACCENT} strokeDasharray="4 3" strokeOpacity={0.5}
              label={{ value: '7h', position: 'right', fontSize: 9, fill: ACCENT, fontFamily: 'inherit' }} />
            <Tooltip content={<SleepTooltip />} cursor={{ fill: 'rgba(107,93,211,0.06)' }} />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.minutes === 0 ? 'var(--color-line)' : d.minutes >= REF_MIN ? ACCENT : `${ACCENT}88`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="dr-heatmap-legend" style={{ marginTop: 10 }}>
        {[[ACCENT, '≥ 7 ore'], [`${ACCENT}88`, '< 7 ore'], ['var(--color-line)', 'nessun dato']].map(([c, l]) => (
          <span key={l} className="dr-legend-item">
            <span className="dr-legend-dot" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Main drawer ─── */
export default function SleepDrawer() {
  const [config, setConfig, configLoaded] = useFirebaseState('sv_sonno_config', {});
  const [log,    setLog,    logLoaded]    = useFirebaseState('sv_sonno_log', []);

  const sortedLog = useMemo(() =>
    [...(log || [])].sort((a, b) => (b.toTime || 0) - (a.toTime || 0)),
  [log]);

  const hasToken  = !!(config?.user_token);
  const lastEntry = sortedLog[0] ?? null;

  if (!configLoaded || !logLoaded) {
    return (
      <div className="dr-content">
        <section className="dr-section">
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>Caricamento…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="dr-content">
      {!hasToken && (
        <SetupSection config={config} setConfig={setConfig} log={log} setLog={setLog} />
      )}

      {hasToken && (
        <>
          <section className="dr-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="dr-section-title" style={{ margin: 0 }}>Ultima notte</h3>
              <SyncButton config={config} setConfig={setConfig} log={log} setLog={setLog} />
            </div>
            {!lastEntry ? (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.65 }}>
                Nessuna notte registrata ancora. Assicurati di aver abilitato il backup su SleepCloud in Sleep as Android.
              </p>
            ) : (
              <LastNightCard entry={lastEntry} />
            )}
          </section>

          {sortedLog.length > 0 && <TrendSection log={log} />}

          <section className="dr-section">
            <h3 className="dr-section-title">Impostazioni</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>
                Connesso · {sortedLog.length} notti
              </span>
              <button
                onClick={() => { setConfig({}); setLog([]); }}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid var(--color-line)',
                  background: 'transparent', color: 'var(--color-ink-muted)', cursor: 'pointer',
                }}
              >
                Disconnetti
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
