import { useState } from 'react';

const KEY = 'sv_weekly_goals';
const WEEK_KEY = 'sv_weekly_goals_week';

function getMondayStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

function loadGoals() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    const storedWeek = localStorage.getItem(WEEK_KEY);
    const currentWeek = getMondayStr();
    if (storedWeek !== currentWeek) {
      // new week: reset done state, keep goal texts
      const reset = stored.map(g => ({ ...g, done: false }));
      localStorage.setItem(WEEK_KEY, currentWeek);
      localStorage.setItem(KEY, JSON.stringify(reset));
      return reset;
    }
    return stored;
  } catch {
    return [];
  }
}

export default function WeeklyGoals() {
  const [goals, setGoals] = useState(loadGoals);
  const [draft, setDraft] = useState('');

  const save = (next) => {
    setGoals(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (!localStorage.getItem(WEEK_KEY)) {
      localStorage.setItem(WEEK_KEY, getMondayStr());
    }
  };

  const addGoal = () => {
    const text = draft.trim();
    if (!text) return;
    save([...goals, { id: Date.now(), text, done: false }]);
    setDraft('');
  };

  const toggle = (id) => save(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  const remove = (id) => save(goals.filter(g => g.id !== id));

  const done = goals.filter(g => g.done).length;

  return (
    <div>
      <div className="cm-goal-progress">
        <span>{done}/{goals.length} completati</span>
        {goals.length > 0 && done === goals.length && (
          <span className="cm-goal-all-done">✓ settimana chiusa</span>
        )}
      </div>

      <div className="cm-goal-list">
        {goals.map(g => (
          <div key={g.id} className={`cm-goal-row${g.done ? ' done' : ''}`}>
            <button
              className="cm-goal-check"
              onClick={() => toggle(g.id)}
              type="button"
              aria-label={g.done ? 'segna come non fatto' : 'segna come fatto'}
            >
              {g.done ? '✓' : ''}
            </button>
            <span className="cm-goal-text">{g.text}</span>
            <button className="cm-icon-btn" onClick={() => remove(g.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="cm-goal-add">
        <input
          className="cm-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
          placeholder="Aggiungi obiettivo..."
        />
        <button className="cm-btn" onClick={addGoal}>+</button>
      </div>
    </div>
  );
}
