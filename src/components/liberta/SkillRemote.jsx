import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const SKILLS_KEY   = 'lib_skills';
const GOAL_KEY     = 'lib_skill_goal';
const STUDY_KEY    = 'lib_study_log';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function calcStudyStreak(log) {
  if (!log.length) return 0;
  const set = new Set(log);
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = d.toISOString().split('T')[0];
    if (set.has(k)) { count++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return count;
}

function daysSinceStudy(log) {
  if (!log.length) return Infinity;
  const sorted = [...log].sort((a, b) => b.localeCompare(a));
  const last = new Date(sorted[0] + 'T12:00:00');
  return Math.floor((Date.now() - last) / 86400000);
}

const EMPTY_SKILL = { name: '', resource: '', hours: 0, level: 1, target: 7 };

export default function SkillRemote() {
  const [skills,     setSkills]     = useFirebaseState(SKILLS_KEY, []);
  const [weeklyGoal, setWeeklyGoal] = useFirebaseState(GOAL_KEY, 3);
  const [studyLog,   setStudyLog]   = useFirebaseState(STUDY_KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_SKILL });
  const [editId, setEditId] = useState(null);

  const saveSkills = next => setSkills(next);
  const saveLog    = next => setStudyLog(next);
  const saveGoal   = v    => { const n = parseInt(v); if (!isNaN(n) && n > 0) setWeeklyGoal(n); };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submitSkill = () => {
    if (!form.name.trim()) return;
    if (editId) {
      saveSkills(skills.map(s => s.id === editId ? { ...s, ...form } : s));
      setEditId(null);
    } else {
      saveSkills([{ ...form, id: Date.now(), addedAt: todayStr() }, ...skills]);
    }
    setForm({ ...EMPTY_SKILL });
    setShowForm(false);
  };

  const removeSkill = id => saveSkills(skills.filter(s => s.id !== id));

  const updateSkillField = (id, field, val) =>
    saveSkills(skills.map(s => s.id === id ? { ...s, [field]: val } : s));

  const td = todayStr();
  const studiedToday = studyLog.includes(td);
  const toggleStudy  = () => {
    const next = studiedToday ? studyLog.filter(d => d !== td) : [...studyLog, td];
    saveLog(next);
  };

  const streak   = calcStudyStreak(studyLog);
  const daysSince = daysSinceStudy(studyLog);
  const showAlert = daysSince >= 5 && skills.length > 0;

  return (
    <div>
      {/* Studio oggi + streak */}
      <div className="lb-study-bar">
        <button className={`lb-study-today${studiedToday ? ' done' : ''}`} onClick={toggleStudy}>
          {studiedToday ? '✓ Studiato oggi' : 'Ho studiato oggi (30+ min)'}
        </button>
        {streak > 0 && (
          <span className="lb-study-meta">{streak}gg streak</span>
        )}
        <span className="lb-study-meta" style={{ marginLeft: 'auto' }}>
          Goal settimanale:{' '}
          <input
            className="lb-study-goal-input"
            type="number"
            value={weeklyGoal}
            onChange={e => saveGoal(e.target.value)}
            min="1"
            max="40"
          />
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>h/sett</span>
        </span>
      </div>

      {showAlert && (
        <div className="lb-alert-warn">
          ⚠ Nessuna formazione da {daysSince} giorni — il gap si allarga.
        </div>
      )}

      {/* Add button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="cm-btn" onClick={() => { setShowForm(s => !s); setEditId(null); setForm({ ...EMPTY_SKILL }); }}>
          {showForm && !editId ? 'Annulla' : '+ Skill'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="lb-skill-form" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field xl">
              <label className="cm-label">Nome skill *</label>
              <input className="cm-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Video editing remoto, Motion graphics..." />
            </div>
            <div className="lb-field xl">
              <label className="cm-label">Risorsa / corso</label>
              <input className="cm-input" value={form.resource} onChange={e => setF('resource', e.target.value)} placeholder="Udemy, YouTube, libro..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="lb-field sm">
              <label className="cm-label">Ore invest.</label>
              <input type="number" className="cm-input" value={form.hours} onChange={e => setF('hours', parseInt(e.target.value) || 0)} min="0" />
            </div>
            <div className="lb-field sm">
              <label className="cm-label">Livello (1-10)</label>
              <input type="number" className="cm-input" value={form.level} onChange={e => setF('level', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} min="1" max="10" />
            </div>
            <div className="lb-field sm">
              <label className="cm-label">Obiettivo</label>
              <input type="number" className="cm-input" value={form.target} onChange={e => setF('target', Math.min(10, Math.max(1, parseInt(e.target.value) || 7)))} min="1" max="10" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={submitSkill}>{editId ? 'Salva modifiche' : 'Aggiungi skill'}</button>
            <button className="cm-btn cm-btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Annulla</button>
          </div>
        </div>
      )}

      {/* Skills list */}
      {skills.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', padding: '16px 0' }}>Nessuna skill aggiunta — inizia con quella che ti apre più porte da remoto.</div>
      ) : (
        <div className="lb-skill-list">
          {skills.map(s => {
            const pct = Math.min(100, Math.round((s.level / (s.target || 10)) * 100));
            return (
              <div key={s.id} className="lb-skill-item">
                <div className="lb-skill-head">
                  <span className="lb-skill-name">{s.name}</span>
                  {s.resource && <span className="lb-skill-resource">{s.resource}</span>}
                  {s.hours > 0 && <span className="lb-skill-hours">{s.hours}h investite</span>}
                  <button className="cm-icon-btn" onClick={() => {
                    setEditId(s.id);
                    setForm({ name: s.name, resource: s.resource || '', hours: s.hours || 0, level: s.level || 1, target: s.target || 7 });
                    setShowForm(true);
                  }}>✎</button>
                  <button className="cm-icon-btn" onClick={() => removeSkill(s.id)}>×</button>
                </div>
                <div className="lb-skill-prog">
                  <span className="lb-skill-lvl">Lv <strong>{s.level}</strong></span>
                  <div className="lb-skill-bar-wrap">
                    <div className="lb-skill-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="lb-skill-lvl">obiettivo <strong>{s.target}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>Livello attuale:</span>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onClick={() => updateSkillField(s.id, 'level', n)}
                      style={{
                        width: 18, height: 18,
                        border: '1px solid',
                        borderColor: n <= s.level ? 'var(--accent)' : 'var(--border)',
                        background: n <= s.level ? 'var(--accent)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 9, fontWeight: 700,
                        color: n <= s.level ? '#1a1a1a' : 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                        padding: 0,
                      }}
                    >{n}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
