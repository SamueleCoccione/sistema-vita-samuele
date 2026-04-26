import { useState } from 'react';
import Groq from 'groq-sdk';
import './NutritionTracker.css';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const ENTRIES_KEY = 'sv_nutrition';
const PROFILE_KEY = 'sv_nutrition_profile';
const APIKEY_KEY  = 'sv_groq_key';

const ACTIVITY_LABELS = {
  sedentary:   'Sedentario (×1.2)',
  light:       'Leggero (×1.375)',
  moderate:    'Moderato (×1.55)',
  active:      'Attivo (×1.725)',
  very_active: 'Molto attivo (×1.9)',
};

const BALANCE_LABELS = { deficit: 'Deficit', ok: 'Adeguata', surplus: 'Surplus' };
const BAL_CLASS      = { deficit: 'nt-bal-deficit', ok: 'nt-bal-ok', surplus: 'nt-bal-surplus' };

const DEFAULT_PROFILE = { age: 28, gender: 'M', activity: 'moderate' };

// ── Helpers ────────────────────────────────────────────────────

function todayStr()        { return new Date().toISOString().split('T')[0]; }
function currentMonthKey() { return new Date().toISOString().slice(0, 7); }

function fmtMonth(key) {
  return new Date(key + '-01T12:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}
function fmtDay(key) {
  return new Date(key + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'long',
  });
}

// Group entries: Month → Day → entries[]  (both sorted desc)
function groupByMonthAndDay(entries) {
  const months = {};
  entries.forEach(e => {
    const mk = e.date.slice(0, 7);
    const dk = e.date;
    if (!months[mk]) months[mk] = {};
    if (!months[mk][dk]) months[mk][dk] = [];
    months[mk][dk].push(e);
  });
  return Object.entries(months)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mk, days]) => [
      mk,
      Object.entries(days).sort(([a], [b]) => b.localeCompare(a)),
    ]);
}

function calcDayTotal(dayEntries) {
  const results = dayEntries.map(e => e.result).filter(Boolean);
  return {
    kcal:    results.reduce((s, r) => s + (r.kcal     || 0), 0),
    protein: results.reduce((s, r) => s + (r.protein_g || 0), 0),
    carbs:   results.reduce((s, r) => s + (r.carbs_g   || 0), 0),
    fat:     results.reduce((s, r) => s + (r.fat_g     || 0), 0),
    tdee:    results.find(r => r.tdee)?.tdee ?? null,
  };
}

function calcDayBalance(kcal, tdee) {
  if (!tdee || !kcal) return null;
  if (kcal < tdee * 0.85) return 'deficit';
  if (kcal > tdee * 1.10) return 'surplus';
  return 'ok';
}

function parseResult(text) {
  const m = text.match(/\{[\s\S]*?\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); }
  catch { return null; }
}

function buildSystemPrompt(weight, height, profile) {
  const { age, gender, activity } = profile;
  const gLabel  = gender === 'M' ? 'Maschio' : 'Femmina';
  const actLabel = ACTIVITY_LABELS[activity] || activity;
  return `Sei un nutrizionista esperto. Stima calorie e macronutrienti di ciò che l'utente descrive (può essere un singolo pasto o più pasti).

PARAMETRI CORPOREI:
- Peso: ${weight ? weight + ' kg' : 'n.d.'} · Altezza: ${height ? height + ' cm' : 'n.d.'}
- Età: ${age}a · Sesso: ${gLabel} · Attività: ${actLabel}

Formula TDEE (Mifflin-St Jeor):
${gender === 'M'
    ? `BMR = 10×${weight || 75} + 6.25×${height || 175} − 5×${age} + 5`
    : `BMR = 10×${weight || 60} + 6.25×${height || 165} − 5×${age} − 161`}
Moltiplica per fattore attività.

Rispondi SOLO con JSON valido, nessun testo extra:
{
  "kcal": <calorie stimate, intero>,
  "protein_g": <grammi proteine, intero>,
  "carbs_g": <grammi carboidrati, intero>,
  "fat_g": <grammi grassi, intero>,
  "tdee": <TDEE giornaliero calcolato, intero>,
  "note": "<commento breve su questa voce, max 30 parole>"
}`;
}

// ── Sub-components ─────────────────────────────────────────────

function MacroBars({ p, c, f, compact }) {
  const total = p * 4 + c * 4 + f * 9;
  if (!total) return null;
  const pPct = Math.round((p * 4 / total) * 100);
  const cPct = Math.round((c * 4 / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="nt-macro-bars">
      <div className="nt-macro-bar-wrap">
        <div className="nt-macro-bar nt-macro-p" style={{ width: `${pPct}%` }} />
        <div className="nt-macro-bar nt-macro-c" style={{ width: `${cPct}%` }} />
        <div className="nt-macro-bar nt-macro-f" style={{ width: `${fPct}%` }} />
      </div>
      <div className="nt-macro-legend">
        <span className="nt-macro-item"><span className="nt-macro-dot nt-macro-p-dot" />P {p}g</span>
        <span className="nt-macro-item"><span className="nt-macro-dot nt-macro-c-dot" />C {c}g</span>
        <span className="nt-macro-item"><span className="nt-macro-dot nt-macro-f-dot" />G {f}g</span>
        {!compact && <span className="nt-macro-item" style={{ color: 'var(--text3)', marginLeft: 4 }}>
          {Math.round(pPct)}% · {Math.round(cPct)}% · {Math.round(fPct)}%
        </span>}
      </div>
    </div>
  );
}

// Result card shown right after analysis
function ResultCard({ result }) {
  if (!result) return null;
  const { kcal, protein_g: p, carbs_g: c, fat_g: f, tdee, note } = result;
  return (
    <div className="nt-result">
      <div className="nt-result-top">
        <div className="nt-kcal">
          <span className="nt-kcal-num">{kcal.toLocaleString('it-IT')}</span>
          <span className="nt-kcal-unit">kcal</span>
          {tdee && <span className="nt-kcal-tdee">fabbisogno giornaliero: {tdee.toLocaleString('it-IT')}</span>}
        </div>
      </div>
      <MacroBars p={p} c={c} f={f} />
      {note && <div className="nt-note">{note}</div>}
    </div>
  );
}

// Single entry row inside a day group
function EntryRow({ entry, expanded, onToggle, onDelete }) {
  const r = entry.result;
  const preview = entry.description.length > 70
    ? entry.description.slice(0, 70) + '…'
    : entry.description;

  return (
    <div className={`nt-entry${expanded ? ' open' : ''}`}>
      <div className="nt-entry-compact" onClick={onToggle}>
        <span className="nt-entry-preview">{preview}</span>
        {r?.kcal ? (
          <span className="nt-entry-kcal">
            {r.kcal.toLocaleString('it-IT')}<span className="nt-entry-kcal-u">kcal</span>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>n.a.</span>
        )}
        <span className="nt-entry-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="nt-entry-expanded">
          <div className="nt-entry-desc">"{entry.description}"</div>
          {r && (
            <>
              <MacroBars p={r.protein_g} c={r.carbs_g} f={r.fat_g} />
              {r.note && <div className="nt-note" style={{ marginTop: 8 }}>{r.note}</div>}
            </>
          )}
          <button className="nt-entry-delete" onClick={e => { e.stopPropagation(); onDelete(); }}>
            elimina
          </button>
        </div>
      )}
    </div>
  );
}

// Day accordion
function DayGroup({ dayKey, dayEntries, isOpen, onToggle, expandedEntry, onToggleEntry, onDelete }) {
  const total   = calcDayTotal(dayEntries);
  const balance = calcDayBalance(total.kcal, total.tdee);

  return (
    <div className={`nt-day${isOpen ? ' open' : ''}`}>
      <button className={`nt-day-head${isOpen ? ' open' : ''}`} onClick={onToggle}>
        <span className="nt-day-label">{fmtDay(dayKey)}</span>
        {total.kcal > 0 && (
          <span className="nt-day-kcal">
            {total.kcal.toLocaleString('it-IT')}<span> kcal</span>
          </span>
        )}
        <span className="nt-day-count">
          {dayEntries.length} {dayEntries.length === 1 ? 'voce' : 'voci'}
        </span>
        {balance && (
          <span className={`nt-balance ${BAL_CLASS[balance]}`} style={{ fontSize: 9, padding: '2px 7px' }}>
            {BALANCE_LABELS[balance]}
          </span>
        )}
        <span className="nt-day-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="nt-day-body">
          {total.kcal > 0 && dayEntries.length > 1 && (
            <div className="nt-day-totals">
              <div className="nt-day-totals-row">
                <span className="nt-day-totals-lbl">Totale giorno</span>
                {total.tdee && (
                  <span className="nt-day-totals-tdee">
                    {Math.round((total.kcal / total.tdee) * 100)}% del fabbisogno
                  </span>
                )}
              </div>
              <MacroBars p={total.protein} c={total.carbs} f={total.fat} />
            </div>
          )}
          {dayEntries.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              expanded={expandedEntry === entry.id}
              onToggle={() => onToggleEntry(entry.id)}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function NutritionTracker() {
  const [entries, setEntries] = useFirebaseState(ENTRIES_KEY, []);
  const [profile, setProfile] = useFirebaseState(PROFILE_KEY, DEFAULT_PROFILE);
  const [apiKey,  setApiKey]  = useFirebaseState(APIKEY_KEY, '');
  const [weightData] = useFirebaseState('sv_weight', []);
  const [measData]   = useFirebaseState('sv_body_measures', []);
  const [keyDraft, setKeyDraft] = useState('');

  const [showProfile,  setShowProfile]  = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);

  const [date,        setDate]    = useState(todayStr);
  const [description, setDesc]    = useState('');
  const [loading,     setLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);

  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey()]));
  const [openDays,   setOpenDays]   = useState(() => new Set([todayStr()]));
  const [expandedEntry, setExpandedEntry] = useState(null);

  const weight = weightData.length
    ? [...weightData].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : null;
  const height = measData.length ? measData[measData.length - 1].height : null;

  // ── Persist ──
  const saveEntries = setEntries;
  const saveProfile = setProfile;
  const setP = (k, v) => saveProfile({ ...profile, [k]: v });

  const saveKey = () => {
    const k = keyDraft.trim();
    setApiKey(k);
    setKeyDraft('');
    setShowKeySetup(false);
  };

  // ── Analyze ──
  const analyze = async () => {
    if (!description.trim() || !apiKey || loading) return;
    setLoading(true);
    setPendingResult(null);
    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      const msg  = await groq.chat.completions.create({
        model:      'llama-3.1-8b-instant',
        max_tokens: 400,
        messages: [
          { role: 'system', content: buildSystemPrompt(weight, height, profile) },
          { role: 'user',   content: description.trim() },
        ],
      });
      const raw    = msg.choices[0]?.message?.content || '';
      const result = parseResult(raw);
      setPendingResult(result);

      const newEntry = { id: Date.now(), date, description: description.trim(), result, raw };
      // Append — multiple entries per day allowed, newest first within same day
      const next = [newEntry, ...entries].sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.id - a.id
      );
      saveEntries(next);
      setDesc('');
      setOpenMonths(prev => new Set([...prev, date.slice(0, 7)]));
      setOpenDays(prev   => new Set([...prev, date]));
    } catch (err) {
      setPendingResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (key) => setOpenMonths(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  const toggleDay = (key) => setOpenDays(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  const toggleEntry = (id) => setExpandedEntry(prev => prev === id ? null : id);
  const deleteEntry = (id) => { saveEntries(entries.filter(e => e.id !== id)); if (expandedEntry === id) setExpandedEntry(null); };

  const monthGroups = groupByMonthAndDay(entries);

  const profileSummary = [
    weight ? `${weight} kg` : null,
    height ? `${height} cm` : null,
    `${profile.age}a`,
    profile.gender,
    profile.activity,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      {/* ── Profile strip ── */}
      <div className="nt-profile">
        <div className="nt-profile-head" onClick={() => setShowProfile(s => !s)}>
          <span className="nt-profile-lbl">Parametri</span>
          <span className="nt-profile-summary">{profileSummary}</span>
          <span className="nt-profile-toggle">{showProfile ? '▲' : '▼'}</span>
        </div>
        {showProfile && (
          <div className="nt-profile-body">
            {weight !== null && (
              <div className="nt-profile-field">
                <label className="cm-label">Peso (da tracker)</label>
                <span className="nt-profile-readonly">{weight}<span>kg</span></span>
              </div>
            )}
            {height !== null && (
              <div className="nt-profile-field">
                <label className="cm-label">Altezza (da misure)</label>
                <span className="nt-profile-readonly">{height}<span>cm</span></span>
              </div>
            )}
            <div className="nt-profile-field">
              <label className="cm-label">Età</label>
              <input type="number" className="cm-input" value={profile.age}
                onChange={e => setP('age', parseInt(e.target.value, 10) || 25)} style={{ width: 70 }} />
            </div>
            <div className="nt-profile-field">
              <label className="cm-label">Sesso</label>
              <div className="nt-gender-btns">
                {['M', 'F'].map(g => (
                  <button key={g} className={`nt-gender-btn${profile.gender === g ? ' active' : ''}`}
                    onClick={() => setP('gender', g)}>{g}</button>
                ))}
              </div>
            </div>
            <div className="nt-profile-field">
              <label className="cm-label">Livello attività</label>
              <select className="cm-input" value={profile.activity}
                onChange={e => setP('activity', e.target.value)} style={{ width: 'auto' }}>
                {Object.entries(ACTIVITY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── API key ── */}
      {(!apiKey || showKeySetup) ? (
        <div className="nt-apikey-setup">
          <div className="nt-apikey-desc">
            Groq API key gratuita — registrati su <strong>console.groq.com</strong>.
            {apiKey && <span style={{ color: 'var(--status-green-text)' }}> Chiave attiva.</span>}
          </div>
          <div className="nt-apikey-row">
            <input className="cm-input" type="password" style={{ flex: 1 }}
              value={keyDraft} onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()} placeholder="gsk_..." />
            <button className="cm-btn" onClick={saveKey}>Salva</button>
            {showKeySetup && apiKey && (
              <button className="cm-btn cm-btn-ghost" onClick={() => setShowKeySetup(false)}>Annulla</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 10, paddingBottom: 4 }}>
          <button className="nt-apikey-active" onClick={() => { setShowKeySetup(true); setKeyDraft(''); }}>
            ● API attiva <span style={{ opacity: 0.6, fontSize: 8 }}>modifica</span>
          </button>
        </div>
      )}

      {/* ── Compose ── */}
      <div className="nt-compose">
        <div className="nt-compose-row">
          <input type="date" className="cm-input nt-date-input" value={date}
            onChange={e => setDate(e.target.value)} />
          <textarea
            className="cm-input cm-textarea nt-textarea"
            placeholder="Descrivi un pasto o uno spuntino — es. «Pranzo: pasta al pomodoro 200g, parmigiano, un bicchiere di vino»"
            value={description}
            onChange={e => setDesc(e.target.value)}
            rows={3}
          />
        </div>
        <div className="nt-compose-footer">
          {loading && <span className="nt-loading-hint">Analisi in corso…</span>}
          <button className="cm-btn" onClick={analyze} disabled={!description.trim() || !apiKey || loading}>
            {loading ? '…' : 'Analizza'}
          </button>
        </div>
        {pendingResult && !pendingResult.error && <ResultCard result={pendingResult} />}
        {pendingResult?.error && (
          <div style={{ fontSize: 12, color: 'var(--status-red)', marginTop: 10 }}>
            Errore: {pendingResult.error}
          </div>
        )}
      </div>

      {/* ── History: Month → Day → Entries ── */}
      {monthGroups.length === 0 ? (
        <div className="cm-empty">Nessuna analisi ancora — descrivi il primo pasto per iniziare</div>
      ) : (
        <div className="nt-months">
          {monthGroups.map(([monthKey, dayGroups]) => {
            const isMonthOpen = openMonths.has(monthKey);
            const isCurrent   = monthKey === currentMonthKey();

            // Month-level stats
            const allDayTotals = dayGroups.map(([, de]) => calcDayTotal(de));
            const daysWithKcal = allDayTotals.filter(t => t.kcal > 0);
            const avgKcal = daysWithKcal.length
              ? Math.round(daysWithKcal.reduce((s, t) => s + t.kcal, 0) / daysWithKcal.length)
              : 0;

            return (
              <div key={monthKey} className="nt-month">
                <button className={`nt-month-head${isMonthOpen ? ' open' : ''}`}
                  onClick={() => toggleMonth(monthKey)}>
                  <span className="nt-month-label">{fmtMonth(monthKey)}</span>
                  <span className="nt-month-count">
                    {dayGroups.length} {dayGroups.length === 1 ? 'giorno' : 'giorni'}
                  </span>
                  {avgKcal > 0 && (
                    <span className="nt-month-avg">~{avgKcal.toLocaleString('it-IT')} kcal/gg</span>
                  )}
                  {isCurrent && <span className="nt-month-current">in corso</span>}
                  <span className="nt-month-chevron">{isMonthOpen ? '▲' : '▼'}</span>
                </button>

                {isMonthOpen && (
                  <div className="nt-month-days">
                    {dayGroups.map(([dayKey, dayEntries]) => (
                      <DayGroup
                        key={dayKey}
                        dayKey={dayKey}
                        dayEntries={dayEntries}
                        isOpen={openDays.has(dayKey)}
                        onToggle={() => toggleDay(dayKey)}
                        expandedEntry={expandedEntry}
                        onToggleEntry={toggleEntry}
                        onDelete={deleteEntry}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
