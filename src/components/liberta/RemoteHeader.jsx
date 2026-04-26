import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const WORKDAYS_KEY  = 'lib_workdays';
const GOAL_KEY      = 'lib_remote_goal';
const LOCATIONS_KEY = 'lib_locations';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function nowMonth() { return new Date().toISOString().slice(0, 7); }
function nowYear()  { return String(new Date().getFullYear()); }
function fmtShort(s) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function RemoteHeader() {
  const [workdays,   setWorkdays] = useFirebaseState(WORKDAYS_KEY, []);
  const [goal,       setGoal]     = useFirebaseState(GOAL_KEY, 60);
  const [locations]               = useFirebaseState(LOCATIONS_KEY, []);
  const [editGoal,   setEditGoal] = useState(false);
  const [goalDraft,  setGoalDraft] = useState('');

  const saveWorkdays = next => setWorkdays(next);

  const saveGoal = () => {
    const n = parseInt(goalDraft, 10);
    if (!isNaN(n) && n > 0) setGoal(n);
    setEditGoal(false);
  };

  const td = todayStr();
  const todayMode = workdays.find(d => d.date === td)?.mode || '';

  const toggleMode = mode => {
    const newMode = todayMode === mode ? '' : mode;
    const existing = workdays.find(d => d.date === td);
    let next;
    if (newMode === '') {
      next = workdays.filter(d => d.date !== td);
    } else if (existing) {
      next = workdays.map(d => d.date === td ? { ...d, mode: newMode } : d);
    } else {
      next = [...workdays, { date: td, mode: newMode }];
    }
    saveWorkdays(next);
  };

  // % remoto this month
  const mk = nowMonth();
  const yr = nowYear();
  const monthDays  = workdays.filter(d => d.date.startsWith(mk));
  const remotoN    = monthDays.filter(d => d.mode === 'remoto').length;
  const ibridoN    = monthDays.filter(d => d.mode === 'ibrido').length;
  const localeN    = monthDays.filter(d => d.mode === 'locale').length;
  const totalN     = remotoN + ibridoN + localeN;
  const remotoPct  = totalN > 0 ? Math.round(((remotoN + ibridoN * 0.5) / totalN) * 100) : 0;
  const pctColor   = remotoPct >= 50 ? 'green' : remotoPct >= 25 ? 'yellow' : 'red';

  // Giorni fuori Milano
  const fuoriAnno = locations
    .filter(l => (l.city || '').toLowerCase() !== 'milano' && (l.from || '').startsWith(yr))
    .reduce((s, l) => s + (parseInt(l.days) || 0), 0);
  const fuoriMese = locations
    .filter(l => (l.city || '').toLowerCase() !== 'milano' && (l.from || '').startsWith(mk))
    .reduce((s, l) => s + (parseInt(l.days) || 0), 0);

  const goalPct = Math.min(100, Math.round((fuoriAnno / goal) * 100));

  return (
    <div className="lb-header">
      <div className="lb-header-top">
        <div className="lb-kpi-grid">
          <div className="lb-kpi">
            <div className={`lb-kpi-num lb-kpi-num-pct lb-pct-${pctColor}`}>{remotoPct}</div>
            <div className="lb-kpi-lbl">remoto {new Date().toLocaleDateString('it-IT', { month: 'long' })}</div>
            {totalN > 0 && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                {remotoN}r · {ibridoN}i · {localeN}l su {totalN}gg
              </div>
            )}
          </div>
          <div className="lb-kpi">
            <div className="lb-kpi-num">{fuoriMese}</div>
            <div className="lb-kpi-lbl">giorni fuori Milano (mese)</div>
          </div>
          <div className="lb-kpi">
            <div className="lb-kpi-num">{fuoriAnno}</div>
            <div className="lb-kpi-lbl">giorni fuori Milano (anno)</div>
          </div>
        </div>
        <div className="lb-mode-wrap">
          <span className="lb-mode-lbl">Oggi — {fmtShort(td)}</span>
          <div className="lb-mode-btns">
            {[['remoto', 'Remoto'], ['ibrido', 'Ibrido'], ['locale', 'Locale']].map(([m, l]) => (
              <button
                key={m}
                className={`lb-mode-btn lb-mode-${m}${todayMode === m ? ' active' : ''}`}
                onClick={() => toggleMode(m)}
              >{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="lb-goal-row">
        <span className="lb-goal-lbl">Goal annuale fuori Milano</span>
        <div className="lb-goal-bar">
          <div className="lb-goal-fill" style={{ width: `${goalPct}%` }} />
        </div>
        <span className="lb-goal-hint">
          {fuoriAnno} /{' '}
          {editGoal ? (
            <input
              className="lb-goal-edit"
              value={goalDraft}
              onChange={e => setGoalDraft(e.target.value)}
              onBlur={saveGoal}
              onKeyDown={e => e.key === 'Enter' && saveGoal()}
              autoFocus
            />
          ) : (
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
              onClick={() => { setEditGoal(true); setGoalDraft(String(goal)); }}
            >{goal}</span>
          )}{' '}giorni
        </span>
        {fuoriAnno >= goal && (
          <span className="lb-goal-done">✓ Goal raggiunto</span>
        )}
        {remotoPct >= 50 && totalN >= 3 && (
          <span className="lb-goal-done">Mese prevalentemente remoto</span>
        )}
      </div>
    </div>
  );
}
