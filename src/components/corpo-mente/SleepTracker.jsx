import { useState, useRef } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const KEY = 'sv_sleep';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function calcHours(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = waketime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(2));
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

function parseHealthXML(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');
  const records = Array.from(
    doc.querySelectorAll('Record[type="HKCategoryTypeIdentifierSleepAnalysis"]')
  );
  const asleepRecords = records.filter(r =>
    (r.getAttribute('value') || '').toLowerCase().includes('asleep')
  );

  const byDate = {};
  for (const r of asleepRecords) {
    const startStr = r.getAttribute('startDate');
    const endStr   = r.getAttribute('endDate');
    if (!startStr || !endStr) continue;
    const start = new Date(startStr);
    const end   = new Date(endStr);
    if (isNaN(start) || isNaN(end) || end <= start) continue;
    const wakeDate = end.toISOString().split('T')[0];
    if (!byDate[wakeDate]) {
      byDate[wakeDate] = { minStart: start, maxEnd: end, totalMins: 0 };
    } else {
      if (start < byDate[wakeDate].minStart) byDate[wakeDate].minStart = start;
      if (end   > byDate[wakeDate].maxEnd)   byDate[wakeDate].maxEnd   = end;
    }
    byDate[wakeDate].totalMins += (end - start) / 60000;
  }

  return Object.entries(byDate).map(([date, d]) => ({
    id: Date.now() + Math.random(),
    date,
    bedtime:  d.minStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false }),
    waketime: d.maxEnd.toLocaleTimeString('it-IT',   { hour: '2-digit', minute: '2-digit', hour12: false }),
    hours:    parseFloat((d.totalMins / 60).toFixed(2)),
    quality:  null,
    feeling:  null,
    note:     'Importato da Apple Health',
    fromAppleHealth: true,
  }));
}

const EMPTY_FORM = { bedtime: '23:00', waketime: '07:00', quality: 7, feeling: 'normale', note: '' };

export default function SleepTracker() {
  const [entries, persist] = useFirebaseState(KEY, []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importMsg, setImportMsg] = useState('');
  const xmlRef = useRef();

  const hours = calcHours(form.bedtime, form.waketime);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addEntry = () => {
    if (!form.bedtime || !form.waketime || !hours) return;
    const entry = {
      id: Date.now(),
      date: todayStr(),
      bedtime:  form.bedtime,
      waketime: form.waketime,
      hours,
      quality: form.quality,
      feeling: form.feeling,
      note:    form.note.trim(),
    };
    const next = [entry, ...entries.filter(e => e.date !== todayStr())]
      .sort((a, b) => b.date.localeCompare(a.date));
    persist(next);
    setForm(EMPTY_FORM);
  };

  const remove = (id) => persist(entries.filter(e => e.id !== id));

  const handleXML = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseHealthXML(ev.target.result);
        const existingDates = new Set(entries.map(x => x.date));
        const newEntries = parsed.filter(p => !existingDates.has(p.date));
        if (!newEntries.length) { setImportMsg('Nessuna nuova notte trovata nel file.'); return; }
        const merged = [...entries, ...newEntries].sort((a, b) => b.date.localeCompare(a.date));
        persist(merged);
        setImportMsg(`${newEntries.length} notti importate da Apple Health.`);
      } catch {
        setImportMsg('Errore nel parsing del file XML.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Stats: last 7 entries
  const last7       = entries.slice(0, 7);
  const avgHours    = avg(last7.filter(e => e.hours).map(e => e.hours));
  const avgQuality  = avg(last7.filter(e => e.quality).map(e => e.quality));

  // 7h+ streak (consecutive from most recent)
  let streak = 0;
  for (const e of entries) {
    if ((e.hours || 0) >= 7) streak++;
    else break;
  }

  // Chart data: last 14 entries, oldest first
  const chartData = entries.slice(0, 14).reverse().map(e => ({
    d:       e.date.slice(5),
    ore:     e.hours,
    qualita: e.quality,
  }));

  const alreadyToday = entries.length > 0 && entries[0].date === todayStr();

  return (
    <div>
      {/* Stats */}
      {entries.length > 0 && (
        <div className="cm-stat-strip" style={{ marginBottom: 24 }}>
          <div>
            <div className="cm-stat-label">Media ore (7gg)</div>
            <div className="cm-stat-value">{avgHours != null ? avgHours.toFixed(1) : '—'}</div>
          </div>
          <div>
            <div className="cm-stat-label">Qualità media</div>
            <div className="cm-stat-value">{avgQuality != null ? avgQuality.toFixed(1) : '—'}</div>
          </div>
          <div>
            <div className="cm-stat-label">Streak 7h+</div>
            <div className="cm-stat-value">{streak}</div>
          </div>
        </div>
      )}

      {/* Form */}
      {alreadyToday ? (
        <div style={{ marginBottom: 20 }}>
          <span className="cm-goal-all-done">✓ Sonno registrato oggi</span>
        </div>
      ) : (
        <div className="sl-form">
          <div className="cm-form-row">
            <div className="cm-form-group" style={{ maxWidth: 140 }}>
              <label className="cm-label">Ora addormentato</label>
              <input type="time" className="cm-input" value={form.bedtime}
                onChange={e => setF('bedtime', e.target.value)} />
            </div>
            <div className="cm-form-group" style={{ maxWidth: 140 }}>
              <label className="cm-label">Ora sveglio</label>
              <input type="time" className="cm-input" value={form.waketime}
                onChange={e => setF('waketime', e.target.value)} />
            </div>
            <div className="sl-hours-calc">
              <span className="cm-label">Ore calcolate</span>
              <span className="sl-hours-val">{hours != null ? `${hours}h` : '—'}</span>
            </div>
          </div>

          <div className="cm-form-row" style={{ alignItems: 'flex-start' }}>
            <div className="cm-form-group">
              <label className="cm-label">Qualità {form.quality}/10</label>
              <input
                type="range" min="1" max="10" value={form.quality}
                onChange={e => setF('quality', parseInt(e.target.value, 10))}
                className="sl-range"
              />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Sensazione al risveglio</label>
              <div className="sl-feeling-btns">
                {['fresco', 'normale', 'stanco'].map(f => (
                  <button key={f} type="button"
                    className={`cm-btn${form.feeling === f ? '' : ' cm-btn-ghost'}`}
                    style={{ padding: '6px 14px' }}
                    onClick={() => setF('feeling', f)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cm-form-group" style={{ marginBottom: 16 }}>
            <label className="cm-label">Nota (opzionale)</label>
            <input type="text" className="cm-input" value={form.note}
              onChange={e => setF('note', e.target.value)}
              placeholder="Come hai dormito..." />
          </div>

          <button className="cm-btn" onClick={addEntry}
            disabled={!form.bedtime || !form.waketime || !hours}>
            + Log sonno
          </button>
        </div>
      )}

      {/* Dual chart */}
      {chartData.length > 1 && (
        <div className="cm-chart-wrap" style={{ height: 220, margin: '24px 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 28, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d0c8" vertical={false} />
              <XAxis dataKey="d" stroke="#b8b4ac"
                tick={{ fill: '#6e6a62', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="h" orientation="left" domain={[0, 12]}
                stroke="#b8b4ac" tick={{ fill: '#6e6a62', fontSize: 10 }}
                axisLine={false} tickLine={false} />
              <YAxis yAxisId="q" orientation="right" domain={[0, 10]}
                stroke="#b8b4ac" tick={{ fill: '#6e6a62', fontSize: 10 }}
                axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#f5f3ef', border: '1px solid #d4d0c8', borderRadius: 0, fontSize: 12 }}
                labelStyle={{ color: '#6e6a62' }}
              />
              <Legend iconType="plainline"
                wrapperStyle={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text2)' }} />
              <Line yAxisId="h" type="monotone" dataKey="ore" name="Ore"
                stroke="#1a1a1a" strokeWidth={1.5}
                dot={{ r: 3, fill: '#1a1a1a', strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
              <Line yAxisId="q" type="monotone" dataKey="qualita" name="Qualità"
                stroke="#c8f564" strokeWidth={1.5}
                dot={{ r: 3, fill: '#c8f564', stroke: '#1a1a1a', strokeWidth: 1 }}
                activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Apple Health import */}
      <div className="sl-import-section">
        <span className="cm-label">Import Apple Health</span>
        <button className="cm-btn cm-btn-ghost" onClick={() => xmlRef.current.click()}>
          Carica export.xml
        </button>
        <input ref={xmlRef} type="file" accept=".xml"
          style={{ display: 'none' }} onChange={handleXML} />
        {importMsg && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{importMsg}</span>}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="cm-empty">Nessuna registrazione sonno ancora</div>
      ) : (
        <table className="cm-table" style={{ marginTop: 20 }}>
          <thead>
            <tr><th>Data</th><th>Ore</th><th>Qualità</th><th>Sensazione</th><th></th></tr>
          </thead>
          <tbody>
            {entries.slice(0, 10).map(e => (
              <tr key={e.id}>
                <td>{fmtDate(e.date)}</td>
                <td><strong>{e.hours}h</strong></td>
                <td>{e.quality != null ? `${e.quality}/10` : '—'}</td>
                <td>
                  {e.feeling && (
                    <span className={`sl-feeling-badge sl-feeling-${e.feeling}`}>{e.feeling}</span>
                  )}
                </td>
                <td><button className="cm-icon-btn" onClick={() => remove(e.id)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
