import { useState, useEffect, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const TEAL = 'var(--color-teal)';

/* ── helpers ── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function fmtMin(min) {
  if (!min) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

function cellColor(minutes) {
  if (minutes === null) return 'transparent';
  if (minutes === 0)    return 'rgba(31,24,18,0.07)';
  if (minutes < 15)     return 'rgba(43,179,168,0.22)';
  if (minutes < 30)     return 'rgba(43,179,168,0.45)';
  if (minutes < 60)     return 'rgba(43,179,168,0.72)';
  return '#2BB3A8';
}

function buildHeatmap(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() === 0 ? 7 : today.getDay(); // 1=Lun…7=Dom
  const startMonday = new Date(today);
  startMonday.setDate(today.getDate() - (dow - 1) - 12 * 7);

  const todayKey = todayStr();
  const weeks = [];
  for (let w = 0; w < 13; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + w * 7 + d);
      const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isFuture = k > todayKey;
      week.push({ date: k, minutes: isFuture ? null : (sessions[k]?.totalMin || 0), isToday: k === todayKey });
    }
    weeks.push(week);
  }
  return weeks;
}

/* ── Heatmap ── */
const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

function fmtDateLong(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function Heatmap({ sessions }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const weeks = useMemo(() => buildHeatmap(sessions), [sessions]);

  const thisWeekDone = useMemo(() => {
    const today = new Date();
    const dow = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow - 1));
    monday.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < dow; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if ((sessions[k]?.totalMin || 0) > 0) count++;
    }
    return count;
  }, [sessions]);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if ((sessions[k]?.totalMin || 0) > 0) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [sessions]);

  const dayData = selectedDay ? sessions[selectedDay] : null;

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
          {/* Etichette giorni */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 2 }}>
            {DAY_LABELS.map((l, i) => (
              <div key={i} style={{
                width: 16, height: 16,
                fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700,
                color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center',
              }}>{l}</div>
            ))}
          </div>
          {/* Celle settimane */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => {
                const hasData = day.minutes !== null && day.minutes > 0;
                const isSelected = selectedDay === day.date;
                return (
                  <div
                    key={di}
                    title={day.minutes !== null ? `${day.date} — ${fmtMin(day.minutes)}` : day.date}
                    onClick={() => hasData ? setSelectedDay(isSelected ? null : day.date) : null}
                    style={{
                      width: 16, height: 16,
                      borderRadius: 3,
                      background: cellColor(day.minutes),
                      outline: isSelected
                        ? '2px solid #2BB3A8'
                        : day.isToday ? '1.5px solid #2BB3A8' : 'none',
                      outlineOffset: isSelected ? 2 : 1,
                      flexShrink: 0,
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'outline 120ms, transform 120ms',
                      transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: cellColor(0),  label: '0' },
          { color: cellColor(5),  label: '<15 min' },
          { color: cellColor(20), label: '15–30' },
          { color: cellColor(45), label: '30–60' },
          { color: cellColor(75), label: '60+ min' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>{label}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
          {thisWeekDone}/7 questa settimana
          {streak > 0 && <> · 🔥 {streak} giorni</>}
        </span>
      </div>

      {/* Dettaglio giorno selezionato */}
      {selectedDay && (
        <div style={{
          marginTop: 14,
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(43,179,168,0.07)',
          border: '1px solid rgba(43,179,168,0.25)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--color-ink)', textTransform: 'capitalize' }}>
              {fmtDateLong(selectedDay)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#2BB3A8' }}>
              {fmtMin(dayData?.totalMin || 0)}
            </span>
          </div>

          {/* Sessioni con orari */}
          {dayData?.sessions?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: dayData?.notes ? 10 : 0 }}>
              {dayData.sessions.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--color-ink-muted)', whiteSpace: 'nowrap',
                  }}>
                    {s.startTime ? `${fmtTime(s.startTime)} → ${fmtTime(s.endTime)}` : `Sessione ${i + 1}`}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                    color: '#2BB3A8', whiteSpace: 'nowrap',
                  }}>
                    {fmtMin(s.durationMin)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Note */}
          {dayData?.notes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayData.notes.split('\n').filter(n => n.trim()).map((n, i) => (
                <p key={i} style={{
                  margin: 0,
                  fontFamily: 'var(--font-ui)', fontSize: 12,
                  color: 'var(--color-ink)', lineHeight: 1.55,
                  paddingLeft: 10,
                  borderLeft: '2px solid rgba(43,179,168,0.4)',
                }}>
                  {n}
                </p>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
              Nessuna nota per questo giorno.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main drawer ── */
export default function WritingDrawer() {
  const [sessions, setSessions] = useFirebaseState('pd_writing_sessions', {});
  const [active,   setActive]   = useFirebaseState('pd_writing_active', null);

  const [now,       setNow]       = useState(Date.now());
  const [phase,     setPhase]     = useState('idle'); // idle | running | recap
  const [lastSess,  setLastSess]  = useState(null);
  const [note,      setNote]      = useState('');

  // Recupera sessione attiva al mount
  useEffect(() => {
    if (active?.startTime) setPhase('running');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick ogni secondo quando il timer è attivo
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const elapsedSec = active?.startTime ? Math.floor((now - active.startTime) / 1000) : 0;
  const td = todayStr();
  const todayMin = sessions[td]?.totalMin || 0;

  const handleStart = () => {
    const startTime = Date.now();
    setActive({ startTime, date: td });
    setPhase('running');
    setNow(Date.now());
  };

  const handleStop = () => {
    const endTime = Date.now();
    const durationMin = Math.max(1, Math.round((endTime - (active?.startTime || endTime)) / 60000));
    setLastSess({ startTime: active.startTime, endTime, durationMin });
    setActive(null);
    setPhase('recap');
  };

  const handleSave = () => {
    if (!lastSess) return;
    const existing = sessions[td] || { date: td, totalMin: 0, notes: '', sessions: [] };
    const updated = {
      ...existing,
      totalMin:  existing.totalMin + lastSess.durationMin,
      notes:     existing.notes ? `${existing.notes}\n${note}` : note,
      sessions:  [...(existing.sessions || []), lastSess],
    };
    setSessions({ ...sessions, [td]: updated });
    setNote('');
    setPhase('idle');
    setLastSess(null);
  };

  return (
    <div className="dr-content">

      {/* ── Timer ── */}
      <section className="dr-section">
        <h3 className="dr-section-title">Sessione di scrittura</h3>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 0 8px' }}>
          {/* Cronometro */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1,
            color: phase === 'running' ? TEAL : 'var(--color-ink)',
            transition: 'color 300ms',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtTimer(elapsedSec)}
          </div>

          {phase === 'idle' && (
            <button
              onClick={handleStart}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                padding: '12px 32px', borderRadius: 'var(--radius-sm)',
                background: TEAL, border: 'none', color: '#fff',
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              Inizia a scrivere
            </button>
          )}

          {phase === 'running' && (
            <button
              onClick={handleStop}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                padding: '12px 32px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: `2px solid ${TEAL}`, color: TEAL,
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              Ho finito
            </button>
          )}

          {todayMin > 0 && phase !== 'running' && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
              Oggi: <strong style={{ color: TEAL }}>{fmtMin(todayMin)}</strong> già registrati
            </div>
          )}
        </div>
      </section>

      {/* ── Recap ── */}
      {phase === 'recap' && lastSess && (
        <section className="dr-section">
          <h3 className="dr-section-title">
            Sessione conclusa — {fmtMin(lastSess.durationMin)}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
              Cosa hai scritto oggi?
            </label>
            <textarea
              className="mb-form-textarea"
              rows={4}
              placeholder="Argomento trattato, idee emerse, dove sei arrivato…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="mb-btn mb-btn--primary"
                onClick={handleSave}
              >
                Salva sessione
              </button>
              <button
                className="mb-btn"
                onClick={() => { setPhase('idle'); setLastSess(null); }}
              >
                Salta
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Heatmap ── */}
      <section className="dr-section">
        <h3 className="dr-section-title">Ultime 13 settimane</h3>
        <Heatmap sessions={sessions} />
      </section>

    </div>
  );
}
