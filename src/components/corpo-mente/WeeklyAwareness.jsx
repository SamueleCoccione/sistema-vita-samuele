import { useState, useEffect } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'sv_weekly_awareness';

const QUESTIONS = [
  { k: 'bevo_disagio',        label: 'Ho bevuto in situazioni che mi mettono a disagio?' },
  { k: 'mangiato_emotivo',    label: 'Ho mangiato in modo emotivo questa settimana?'     },
  { k: 'dormito_regolare',    label: 'Ho dormito in orari regolari?'                     },
  { k: 'pensieri_ricorrenti', label: 'Ho avuto pensieri ricorrenti che mi hanno disturbato?' },
];

const EMPTY_ANSWERS = Object.fromEntries(QUESTIONS.map(q => [q.k, null]));

function getMondayStr() {
  const d   = new Date();
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return mon.toISOString().split('T')[0];
}

function fmtWeekRange(monday) {
  const start = new Date(monday + 'T12:00:00');
  const end   = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = dt => dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function WeeklyAwareness() {
  const [records, setRecords, recordsLoaded] = useFirebaseState(KEY, []);
  const [openHistory, setOpenHistory] = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [draft,       setDraft]       = useState({ ...EMPTY_ANSWERS });
  const [draftNote,   setDraftNote]   = useState('');
  const [initialized, setInitialized] = useState(false);

  const currentWeek   = getMondayStr();
  const isSunday      = new Date().getDay() === 0;
  const currentRecord = records.find(r => r.week === currentWeek);

  useEffect(() => {
    if (!recordsLoaded || initialized) return;
    if (currentRecord) {
      setDraft({ ...currentRecord.answers });
      setDraftNote(currentRecord.note || '');
      setEditing(false);
    } else {
      setDraft({ ...EMPTY_ANSWERS });
      setDraftNote('');
      setEditing(true);
    }
    setInitialized(true);
  }, [recordsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAnswer = (k, val) => {
    if (!editing) return;
    setDraft(prev => ({ ...prev, [k]: prev[k] === val ? null : val }));
  };

  const save = () => {
    const record = {
      week:    currentWeek,
      answers: draft,
      note:    draftNote.trim(),
      savedAt: Date.now(),
    };
    setRecords([record, ...records.filter(r => r.week !== currentWeek)]);
    setEditing(false);
  };

  const startEdit = () => {
    if (currentRecord) {
      setDraft({ ...currentRecord.answers });
      setDraftNote(currentRecord.note || '');
    }
    setEditing(true);
  };

  const pastRecords = records.filter(r => r.week !== currentWeek).slice(0, 12);

  return (
    <div>
      {!isSunday && !currentRecord && (
        <div className="wa-hint">
          Questa sezione si compila ogni domenica sera. Puoi comunque compilarla ora se preferisci.
        </div>
      )}

      {/* ── Settimana corrente ── */}
      <div className="wa-card">
        <div className="wa-card-head">
          <span className="cm-label">Settimana {fmtWeekRange(currentWeek)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isSunday && <span className="wa-sunday-badge">Oggi è domenica</span>}
            {currentRecord && !editing && (
              <button className="cm-btn cm-btn-ghost" style={{ fontSize: 10 }} onClick={startEdit}>
                Modifica
              </button>
            )}
          </div>
        </div>

        <div className="wa-questions">
          {QUESTIONS.map(q => (
            <div key={q.k} className="wa-question">
              <span className="wa-question-text">{q.label}</span>
              <div className="wa-yn-row">
                <button
                  type="button"
                  className={`wa-yn-btn${draft[q.k] === true ? ' yes' : ''}`}
                  onClick={() => toggleAnswer(q.k, true)}
                  disabled={!editing}
                >Sì</button>
                <button
                  type="button"
                  className={`wa-yn-btn${draft[q.k] === false ? ' no' : ''}`}
                  onClick={() => toggleAnswer(q.k, false)}
                  disabled={!editing}
                >No</button>
              </div>
            </div>
          ))}
        </div>

        <div className="wa-note-wrap">
          <label className="cm-label" style={{ display: 'block', marginBottom: 6 }}>
            Cosa voglio portare nella prossima settimana
          </label>
          <textarea
            className="cm-input cm-textarea"
            rows={3}
            value={draftNote}
            onChange={e => setDraftNote(e.target.value)}
            disabled={!editing}
            placeholder="Un'intenzione, una lezione, un proposito…"
          />
        </div>

        {editing && (
          <div style={{ marginTop: 14 }}>
            <button className="cm-btn" onClick={save}>Salva riflessione</button>
          </div>
        )}
      </div>

      {/* ── Storico ── */}
      {pastRecords.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button className="wa-history-toggle" onClick={() => setOpenHistory(o => !o)}>
            <span className="cm-label">Storico riflessioni</span>
            <span className="dj-month-chevron">{openHistory ? '▲' : '▼'}</span>
          </button>
          {openHistory && (
            <div className="wa-history">
              {pastRecords.map(r => (
                <div key={r.week} className="wa-hist-card">
                  <div className="wa-hist-week">{fmtWeekRange(r.week)}</div>
                  <div className="wa-hist-answers">
                    {QUESTIONS.map(q => (
                      <div key={q.k} className="wa-hist-row">
                        <span className="wa-hist-q">{q.label}</span>
                        <span className={`wa-hist-ans${r.answers[q.k] === true ? ' yes' : r.answers[q.k] === false ? ' no' : ''}`}>
                          {r.answers[q.k] === true ? 'Sì' : r.answers[q.k] === false ? 'No' : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {r.note && <div className="wa-hist-note">{r.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
