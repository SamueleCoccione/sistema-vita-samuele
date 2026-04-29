import { useState, useEffect } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY        = 'sv_weekly_goals';
const WEEK_KEY   = 'sv_weekly_goals_week';
const STRAVA_KEY = 'sv_strava_activities';

function getMondayStr() {
  const d = new Date();
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return mon.toISOString().split('T')[0];
}

function getSundayStr() {
  const d = new Date();
  const day = d.getDay();
  const sun = new Date(d);
  sun.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
  return sun.toISOString().split('T')[0];
}

function GoalProgress({ goal, ruckingCount }) {
  const count  = goal.type === 'rucking' ? ruckingCount : (goal.current || 0);
  const target = goal.target || 1;
  const pct    = Math.min(100, Math.round((count / target) * 100));
  const label  = goal.type === 'rucking'
    ? `${count}/${target} sessioni`
    : `${count}/${target}${goal.unit ? ' ' + goal.unit : ''}`;
  return (
    <div className="cm-goal-prog-wrap">
      <div className="cm-goal-prog-bar">
        <div className="cm-goal-prog-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="cm-goal-prog-label">{label}</span>
    </div>
  );
}

export default function WeeklyGoals() {
  const [goals,      setGoals,   goalsLoaded] = useFirebaseState(KEY, []);
  const [storedWeek, setStoredWeek, weekLoaded] = useFirebaseState(WEEK_KEY, '');
  const [stravaActs] = useFirebaseState(STRAVA_KEY, []);
  const [draft,       setDraft]       = useState('');
  const [draftType,   setDraftType]   = useState('binary');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftUnit,   setDraftUnit]   = useState('');

  const mon = getMondayStr();
  const sun = getSundayStr();
  const ruckingCount = stravaActs.filter(a => a.date >= mon && a.date <= sun).length;

  /* Reset weekly goals at week boundary */
  useEffect(() => {
    if (!goalsLoaded || !weekLoaded) return;
    const currentWeek = getMondayStr();
    if (storedWeek !== currentWeek) {
      const reset = goals.map(g => ({
        ...g,
        done:    false,
        current: g.type === 'numeric' ? 0 : (g.current || 0),
      }));
      setGoals(reset);
      setStoredWeek(currentWeek);
    }
  }, [goalsLoaded, weekLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Migrate old food goal text */
  useEffect(() => {
    if (!goalsLoaded) return;
    const OLD = 'Non mangiare merda per una settimana';
    const NEW = 'Ho scelto consapevolmente cosa mangiare questa settimana';
    if (goals.some(g => g.text === OLD)) {
      setGoals(goals.map(g => g.text === OLD ? { ...g, text: NEW } : g));
    }
  }, [goalsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (next) => {
    setGoals(next);
    if (!storedWeek) setStoredWeek(getMondayStr());
  };

  const addGoal = () => {
    const text = draft.trim();
    if (!text) return;
    const goal = { id: Date.now(), text, type: draftType, done: false };
    if (draftType === 'numeric') {
      goal.target  = parseInt(draftTarget, 10) || 1;
      goal.current = 0;
      goal.unit    = draftUnit.trim();
    }
    if (draftType === 'rucking') {
      goal.target = parseInt(draftTarget, 10) || 6;
    }
    save([...goals, goal]);
    setDraft(''); setDraftTarget(''); setDraftUnit('');
  };

  const toggle = (id) => save(goals.map(g =>
    g.id === id && (g.type === 'binary' || !g.type) ? { ...g, done: !g.done } : g
  ));

  const updateCurrent = (id, val) => save(goals.map(g => {
    if (g.id !== id || g.type !== 'numeric') return g;
    const current = Math.max(0, parseInt(val, 10) || 0);
    return { ...g, current, done: current >= (g.target || 1) };
  }));

  const remove = (id) => save(goals.filter(g => g.id !== id));

  const isGoalDone = (g) => {
    if (g.type === 'rucking') return ruckingCount >= (g.target || 6);
    if (g.type === 'numeric') return (g.current || 0) >= (g.target || 1);
    return !!g.done;
  };

  const doneCount = goals.filter(isGoalDone).length;

  return (
    <div>
      <div className="cm-goal-progress">
        <span>{doneCount}/{goals.length} completati</span>
        {goals.length > 0 && doneCount === goals.length && (
          <span className="cm-goal-all-done">✓ settimana chiusa</span>
        )}
      </div>

      <div className="cm-goal-list">
        {goals.map(g => {
          const isDone    = isGoalDone(g);
          const isTracked = g.type === 'rucking' || g.type === 'numeric';
          return (
            <div key={g.id} className={`cm-goal-row${isDone ? ' done' : ''}`}>
              <button
                className="cm-goal-check"
                onClick={() => !isTracked && toggle(g.id)}
                type="button"
                style={isTracked ? { cursor: 'default' } : undefined}
              >
                {isDone && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 3.5L3.8 6.5L9 1" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="cm-goal-body">
                <div className="cm-goal-title-row">
                  <span className="cm-goal-text">{g.text}</span>
                  {g.type === 'rucking' && <span className="sv-type-badge">Strava auto</span>}
                </div>
                {isTracked && <GoalProgress goal={g} ruckingCount={ruckingCount} />}
                {g.type === 'numeric' && (
                  <div className="cm-goal-numeric-input">
                    <span className="cm-label">Aggiorna</span>
                    <input
                      type="number"
                      className="cm-input"
                      style={{ width: 64, padding: '2px 6px', fontSize: 12 }}
                      value={g.current || 0}
                      min={0}
                      onChange={e => updateCurrent(g.id, e.target.value)}
                    />
                    {g.unit && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{g.unit}</span>}
                  </div>
                )}
              </div>
              <button className="cm-icon-btn" onClick={() => remove(g.id)}>×</button>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      <div className="cm-goal-add-wrap">
        <div className="cm-goal-add-fields">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="cm-input"
              style={{ flex: 1 }}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="Aggiungi obiettivo..."
            />
            <select
              className="cm-input"
              value={draftType}
              onChange={e => setDraftType(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="binary">Sì/No</option>
              <option value="numeric">Numerico</option>
              <option value="rucking">Rucking Strava</option>
            </select>
          </div>
          {(draftType === 'numeric' || draftType === 'rucking') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                className="cm-input"
                type="number"
                style={{ width: 130 }}
                value={draftTarget}
                onChange={e => setDraftTarget(e.target.value)}
                placeholder={draftType === 'rucking' ? 'Target (es. 6)' : 'Target numero'}
              />
              {draftType === 'numeric' && (
                <input
                  className="cm-input"
                  value={draftUnit}
                  onChange={e => setDraftUnit(e.target.value)}
                  placeholder="Unità (es. km, volte)"
                />
              )}
            </div>
          )}
        </div>
        <button className="cm-btn" onClick={addGoal} style={{ alignSelf: 'flex-start' }}>+</button>
      </div>
    </div>
  );
}
