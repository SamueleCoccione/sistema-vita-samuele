import { useState, useCallback } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const CHECKIN_KEY = 'sv_daily_checkin';

const CHECKS = [
  { id: 'rucking', label: 'Rucking fatto' },
  { id: 'sleep',   label: 'Sonno 7–8h' },
  { id: 'reading', label: 'Lettura o contenuto costruttivo' },
];

const ENERGY_LEVELS = ['bassa', 'media', 'alta'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function fmtWeekday(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short' });
}

function getLastDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function upsertToday(list, patch) {
  const today = todayStr();
  const idx = list.findIndex(e => e.date === today);
  const blank = { date: today, rucking: false, sleep: false, reading: false, energy: null };
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    return next;
  }
  return [...list, { ...blank, ...patch }];
}

function calcStreak(map, id) {
  let count = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const s = d.toISOString().split('T')[0];
    const e = map[s];
    if (e && e[id]) count++;
    else break;
  }
  return count;
}

export default function DailyCheckin() {
  const [checkins, setCheckins] = useFirebaseState(CHECKIN_KEY, []);

  const today = todayStr();
  const map = Object.fromEntries(checkins.map(e => [e.date, e]));
  const todayEntry = map[today] || { rucking: false, sleep: false, reading: false, energy: null };

  const update = useCallback((patch) => {
    setCheckins(upsertToday(checkins, patch));
  }, [checkins, setCheckins]);

  const toggle  = (id)    => update({ [id]: !todayEntry[id] });
  const setEnergy = (lvl) => update({ energy: todayEntry.energy === lvl ? null : lvl });

  const last7 = getLastDays(7);
  const completedToday = CHECKS.filter(c => todayEntry[c.id]).length;

  return (
    <div className="db-checkin">

      {/* ── oggi ── */}
      <div className="db-today-header">
        <span className="db-today-date">{fmtWeekday(today)}, {fmtDate(today)}</span>
        <span className={`db-progress-badge${completedToday === CHECKS.length ? ' db-progress-full' : ''}`}>
          {completedToday}/{CHECKS.length}
        </span>
      </div>

      <div className="db-checks">
        {CHECKS.map(({ id, label }) => {
          const on     = todayEntry[id];
          const streak = calcStreak(map, id);
          return (
            <button
              key={id}
              className={`db-check-item${on ? ' db-check-on' : ''}`}
              onClick={() => toggle(id)}
            >
              <span className="db-check-icon">{on ? '✓' : '○'}</span>
              <span className="db-check-label">{label}</span>
              {streak > 1 && <span className="db-streak">{streak}d</span>}
            </button>
          );
        })}
      </div>

      <div className="db-energy-row">
        <span className="db-energy-label">Energia oggi</span>
        <div className="db-energy-btns">
          {ENERGY_LEVELS.map(lvl => (
            <button
              key={lvl}
              className={`db-energy-btn db-energy-${lvl}${todayEntry.energy === lvl ? ' active' : ''}`}
              onClick={() => setEnergy(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ── storico 7 giorni ── */}
      {checkins.length > 0 && (
        <div className="db-history">
          <div className="db-history-legend">
            <span />
            {CHECKS.map(c => (
              <span key={c.id} className="db-legend-label">{c.label.split(' ').slice(0, 1)}</span>
            ))}
            <span className="db-legend-label">Energia</span>
          </div>

          {last7.map(date => {
            const e       = map[date];
            const isToday = date === today;
            return (
              <div key={date} className={`db-history-row${isToday ? ' db-history-today' : ''}`}>
                <span className="db-history-date">{fmtWeekday(date)}</span>
                {CHECKS.map(c => (
                  <span key={c.id} className={`db-dot${e && e[c.id] ? ' db-dot-on' : e ? ' db-dot-off' : ''}`} />
                ))}
                <span className={`db-edot db-edot-${e?.energy || 'none'}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
