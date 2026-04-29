import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirebaseState } from '../hooks/useFirebaseState';
import './ObjectiveStatus.css';

export function scoreColor(score) {
  if (!score && score !== 0) return 'var(--text2)';
  if (score <= 3) return '#e85454';
  if (score <= 6) return '#f0c040';
  return '#c8f564';
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

export default function ObjectiveStatus({ tabKey, placeholder }) {
  const [data, setData, loaded] = useFirebaseState(tabKey, { score: null, entries: [] });
  const [sliderVal,       setSliderVal]       = useState(5);
  const [text,            setText]            = useState('');
  const [archCollapsed,   setArchCollapsed]   = useState(false);
  const [showAll,         setShowAll]         = useState(false);
  const [collapsedTexts,  setCollapsedTexts]  = useState(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && loaded) {
      if (data?.score != null) setSliderVal(data.score);
      initialized.current = true;
    }
  }, [loaded, data]);

  const score   = data?.score   ?? null;
  const entries = data?.entries ?? [];

  const toggleEntryText = id => setCollapsedTexts(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const removeEntry = id => {
    const next = entries.filter(e => e.id !== id);
    const lastScore = next[0]?.score ?? null;
    setData({ score: lastScore, entries: next });
  };

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const entry = {
      id:    Date.now(),
      date:  new Date().toISOString().split('T')[0],
      score: sliderVal,
      text:  t,
    };
    setData({ score: sliderVal, entries: [entry, ...entries] });
    setText('');
  };

  const visibleEntries = showAll ? entries : entries.slice(0, 3);
  const chartData = entries.slice().reverse().map(e => ({ date: e.date, score: e.score }));

  return (
    <div className="os-wrap">

      {/* ── Barra stato attuale ── */}
      <div className="os-bar-section">
        <div className="cm-label os-bar-label">Come sto su questo obiettivo</div>
        <div className="os-bar-row">
          <div className="os-bar-track">
            {score !== null && (
              <div
                className="os-bar-fill"
                style={{ width: `${(score / 10) * 100}%`, background: scoreColor(score) }}
              />
            )}
          </div>
          <div className="os-score-val" style={{ color: score !== null ? scoreColor(score) : 'var(--text2)' }}>
            {score ?? '—'}
          </div>
        </div>
      </div>

      {/* ── Form valutazione ── */}
      <div className="os-form">
        <div className="os-slider-row">
          <span className="os-slider-bound">1</span>
          <input
            type="range"
            min={1}
            max={10}
            value={sliderVal}
            onChange={e => setSliderVal(Number(e.target.value))}
            className="os-slider"
          />
          <span className="os-slider-bound">10</span>
          <span className="os-slider-current" style={{ color: scoreColor(sliderVal) }}>
            {sliderVal}
          </span>
        </div>
        <textarea
          className="cm-input cm-textarea os-textarea"
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />
        <div className="os-form-footer">
          <button className="cm-btn" onClick={save} disabled={!text.trim()}>
            Salva valutazione
          </button>
        </div>
      </div>

      {/* ── Archivio ── */}
      {entries.length > 0 && (
        <div className="os-archive">
          <button className="os-archive-toggle" onClick={() => setArchCollapsed(c => !c)}>
            <span className="cm-label">Archivio valutazioni</span>
            <span className="os-archive-chev">{archCollapsed ? '▼' : '▲'}</span>
          </button>
          {!archCollapsed && (
            <>
              <div className="os-archive-list">
                {visibleEntries.map(e => {
                  const textHidden = collapsedTexts.has(e.id);
                  return (
                    <div key={e.id} className="os-entry">
                      <div className="os-entry-meta">
                        <span className="os-entry-date">{fmtDate(e.date)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="os-entry-score" style={{ color: scoreColor(e.score) }}>
                            {e.score}/10
                          </span>
                          <button
                            className="os-entry-toggle"
                            onClick={() => toggleEntryText(e.id)}
                            title={textHidden ? 'Espandi' : 'Comprimi'}
                          >
                            {textHidden ? '▼' : '▲'}
                          </button>
                          <button
                            className="os-entry-toggle"
                            onClick={() => removeEntry(e.id)}
                            title="Elimina"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {!textHidden && (
                        <div className="os-entry-text">{e.text}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {entries.length > 3 && (
                <button
                  className="cm-btn cm-btn-ghost os-show-more"
                  onClick={() => setShowAll(s => !s)}
                >
                  {showAll ? 'Mostra meno' : `Mostra tutte (${entries.length})`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Trend ── */}
      {chartData.length >= 3 && (
        <div className="os-chart">
          <div className="cm-label os-chart-label">Trend punteggio</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 5, 10]}
                tick={{ fontSize: 10, fill: '#7a7670' }}
              />
              <Tooltip
                formatter={v => [v, 'Punteggio']}
                labelFormatter={l => fmtDate(l)}
                contentStyle={{
                  fontSize: 11,
                  background: '#ede9e2',
                  border: '1px solid #d4d0c8',
                  borderRadius: 0,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#c8f564"
                strokeWidth={2}
                dot={{ fill: '#c8f564', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
