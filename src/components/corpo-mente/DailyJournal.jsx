import { useState, useMemo, useEffect } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY  = 'sv_daily_journal';
const MAX  = 280;

export const JOURNAL_TAGS = ['lavoro', 'relazioni', 'cibo', 'alcol', 'corpo', 'soldi', 'famiglia', 'tribù', 'paura', 'gioia', 'rabbia'];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function currentMonthKey() { return new Date().toISOString().slice(0, 7); }

function getMondayStr(date = new Date()) {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtMonth(key) {
  return new Date(key + '-01T12:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

function groupByMonth(entries) {
  const groups = {};
  entries.forEach(e => {
    const key = e.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function DailyJournal() {
  const [entries, setEntries, loaded] = useFirebaseState(KEY, []);
  const [text,         setText]       = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [view,         setView]       = useState('list');
  const [filterTag,    setFilterTag]  = useState(null);
  const [openMonths,   setOpenMonths] = useState(() => new Set([currentMonthKey()]));
  const [editingId,    setEditingId]  = useState(null);
  const [editText,     setEditText]   = useState('');
  const [editTags,     setEditTags]   = useState([]);

  // Keep current month open after Firebase loads
  useEffect(() => {
    if (loaded) setOpenMonths(prev => new Set([...prev, currentMonthKey()]));
  }, [loaded]);

  const remaining = MAX - text.length;

  const toggleTag = tag =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    setEntries([{ id: Date.now(), date: todayStr(), text: t, tags: selectedTags }, ...entries]);
    setText('');
    setSelectedTags([]);
    setOpenMonths(prev => new Set([...prev, currentMonthKey()]));
  };

  const remove = id => setEntries(entries.filter(e => e.id !== id));

  const startEdit = e => { setEditingId(e.id); setEditText(e.text); setEditTags(e.tags || []); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); setEditTags([]); };
  const saveEdit = () => {
    const t = editText.trim();
    if (!t) return;
    setEntries(entries.map(e => e.id === editingId ? { ...e, text: t, tags: editTags } : e));
    cancelEdit();
  };
  const toggleEditTag = tag =>
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleMonth = key => setOpenMonths(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  // Tag pattern: frequency per tag, last 4 weeks
  const tagPattern = useMemo(() => {
    let monday = getMondayStr();
    const weeks = Array.from({ length: 4 }, () => {
      const sunday = addDays(monday, 6);
      const counts = Object.fromEntries(JOURNAL_TAGS.map(t => [t, 0]));
      entries
        .filter(e => e.date >= monday && e.date <= sunday)
        .forEach(e => (e.tags || []).forEach(t => { if (counts[t] !== undefined) counts[t]++; }));
      const result = { monday, counts };
      monday = addDays(monday, -7);
      return result;
    });

    const total = Object.fromEntries(JOURNAL_TAGS.map(t => [t, weeks.reduce((s, w) => s + w.counts[t], 0)]));
    const sorted = JOURNAL_TAGS.filter(t => total[t] > 0).sort((a, b) => total[b] - total[a]);
    const max = sorted.length ? total[sorted[0]] : 1;
    return { total, sorted, max };
  }, [entries]);

  const filteredGroups = useMemo(() => {
    const src = filterTag ? entries.filter(e => (e.tags || []).includes(filterTag)) : entries;
    return groupByMonth(src);
  }, [entries, filterTag]);

  const hasAnyTag = entries.some(e => (e.tags || []).length > 0);

  return (
    <div>
      {/* ── Compose ── */}
      <div className="dj-compose">
        <textarea
          className="cm-input cm-textarea dj-textarea"
          placeholder="Un pensiero per oggi…"
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
          rows={3}
        />
        <div className="dj-tags-row">
          {JOURNAL_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              className={`dj-tag${selectedTags.includes(tag) ? ' active' : ''}`}
              onClick={() => toggleTag(tag)}
            >{tag}</button>
          ))}
        </div>
        <div className="dj-footer">
          <span className={`dj-counter${remaining <= 40 ? ' dj-counter-warn' : ''}${remaining === 0 ? ' dj-counter-full' : ''}`}>
            {remaining}
          </span>
          <button className="cm-btn" onClick={save} disabled={!text.trim()}>Salva</button>
        </div>
      </div>

      {/* ── View tabs ── */}
      {entries.length > 0 && (
        <div className="cm-filter-tabs" style={{ marginBottom: 16 }}>
          <button
            className={`cm-tab${view === 'list' ? ' active' : ''}`}
            onClick={() => { setView('list'); setFilterTag(null); }}
          >Note</button>
          <button
            className={`cm-tab${view === 'pattern' ? ' active' : ''}`}
            onClick={() => setView('pattern')}
          >Pattern tag</button>
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <>
          {hasAnyTag && (
            <div className="dj-filter-row">
              <button
                className={`dj-filter-chip${!filterTag ? ' active' : ''}`}
                onClick={() => setFilterTag(null)}
              >Tutte</button>
              {JOURNAL_TAGS.filter(t => tagPattern.total[t] > 0).map(tag => (
                <button
                  key={tag}
                  className={`dj-filter-chip${filterTag === tag ? ' active' : ''}`}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  {tag}<span className="dj-filter-count">{tagPattern.total[tag]}</span>
                </button>
              ))}
            </div>
          )}

          {filteredGroups.length === 0 ? (
            <div className="cm-empty">
              {filterTag ? `Nessuna nota con tag "${filterTag}"` : 'Nessuna nota ancora — scrivi il primo pensiero'}
            </div>
          ) : (
            <div className="dj-months">
              {filteredGroups.map(([monthKey, monthEntries]) => {
                const isOpen    = openMonths.has(monthKey);
                const isCurrent = monthKey === currentMonthKey();
                return (
                  <div key={monthKey} className="dj-month">
                    <button
                      className={`dj-month-head${isOpen ? ' open' : ''}`}
                      onClick={() => toggleMonth(monthKey)}
                    >
                      <span className="dj-month-label">{fmtMonth(monthKey)}</span>
                      <span className="dj-month-count">{monthEntries.length} {monthEntries.length === 1 ? 'nota' : 'note'}</span>
                      {isCurrent && <span className="dj-month-current">in corso</span>}
                      <span className="dj-month-chevron">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="dj-list">
                        {monthEntries.map(e => (
                          <div key={e.id} className="dj-entry">
                            <span className="dj-entry-date">{fmtDate(e.date)}</span>
                            {editingId === e.id ? (
                              <div className="dj-entry-body">
                                <textarea
                                  className="cm-input cm-textarea dj-textarea"
                                  value={editText}
                                  onChange={ev => setEditText(ev.target.value.slice(0, MAX))}
                                  rows={3}
                                  autoFocus
                                />
                                <div className="dj-tags-row">
                                  {JOURNAL_TAGS.map(tag => (
                                    <button
                                      key={tag}
                                      type="button"
                                      className={`dj-tag${editTags.includes(tag) ? ' active' : ''}`}
                                      onClick={() => toggleEditTag(tag)}
                                    >{tag}</button>
                                  ))}
                                </div>
                                <div className="dj-footer">
                                  <span className={`dj-counter${(MAX - editText.length) <= 40 ? ' dj-counter-warn' : ''}`}>
                                    {MAX - editText.length}
                                  </span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="cm-btn cm-btn-ghost" onClick={cancelEdit}>Annulla</button>
                                    <button className="cm-btn" onClick={saveEdit} disabled={!editText.trim()}>Salva</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="dj-entry-body">
                                <span className="dj-entry-text">{e.text}</span>
                                {(e.tags || []).length > 0 && (
                                  <div className="dj-entry-tags">
                                    {e.tags.map(t => <span key={t} className="dj-entry-tag">{t}</span>)}
                                  </div>
                                )}
                              </div>
                            )}
                            {editingId === e.id ? null : (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="cm-icon-btn" onClick={() => startEdit(e)} title="Modifica">✎</button>
                                <button className="cm-icon-btn" onClick={() => remove(e.id)} title="Elimina">×</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Pattern view ── */}
      {view === 'pattern' && (
        <div className="dj-pattern">
          <div className="cm-label" style={{ marginBottom: 18 }}>Frequenza tag — ultime 4 settimane</div>
          {tagPattern.sorted.length === 0 ? (
            <div className="cm-empty">Nessun tag usato ancora — seleziona i tag quando scrivi una nota</div>
          ) : (
            <div className="dj-pattern-bars">
              {tagPattern.sorted.map(tag => (
                <div key={tag} className="dj-pattern-row">
                  <span className="dj-pattern-tag">{tag}</span>
                  <div className="dj-pattern-bar-wrap">
                    <div
                      className="dj-pattern-bar-fill"
                      style={{ width: `${(tagPattern.total[tag] / tagPattern.max) * 100}%` }}
                    />
                  </div>
                  <span className="dj-pattern-count">{tagPattern.total[tag]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
