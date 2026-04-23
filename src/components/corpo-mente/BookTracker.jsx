import { useState, useRef } from 'react';

const KEY      = 'sv_books_v2';
const GOAL_KEY = 'sv_book_goal';

const STATUS_MAP = {
  'to-read':   'Da leggere',
  'reading':   'In lettura',
  'done':      'Completato',
  'abandoned': 'Abbandonato',
};

const FILTERS = [
  ['all',       'Tutti'],
  ['reading',   'In lettura'],
  ['to-read',   'Da leggere'],
  ['done',      'Completati'],
  ['abandoned', 'Abbandonati'],
];

const EMPTY = {
  title: '', author: '', genre: '', recommendedBy: '',
  cover: null, status: 'to-read', rating: 0,
  totalPages: '', currentPages: '0',
  startDate: '', endDate: '',
  notes: '', learnings: '', application: '',
};

function getMondayStr() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return m.toISOString().split('T')[0];
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
}

function ProgressBar({ current, total }) {
  if (!total || Number(total) <= 0) return null;
  const pct = Math.min(100, Math.round((Number(current) / Number(total)) * 100));
  return (
    <div className="cm-prog-wrap">
      <div className="cm-prog-bar">
        <div className="cm-prog-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="cm-prog-label">{pct}% · {current}/{total} pagine</span>
    </div>
  );
}

function StarRow({ value, onChange }) {
  return (
    <div className="cm-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          className={`cm-star${n <= value ? ' active' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}>★</button>
      ))}
    </div>
  );
}

function BookItem({ book, expanded, onToggle, onPatch, onRemove }) {
  return (
    <div className="cm-book-row">
      {/* ── compact row ── */}
      <div className="cm-book-compact" onClick={onToggle}>
        {book.cover
          ? <img src={book.cover} alt={book.title} className="cm-book-thumb" />
          : <div className="cm-book-thumb-ph" />}

        <div className="cm-book-info">
          <div className="cm-book-title">{book.title}</div>
          <div className="cm-book-meta">
            {[book.author, book.genre].filter(Boolean).join(' · ')}
            {book.recommendedBy && <span style={{ color: 'var(--text3)' }}> · {book.recommendedBy}</span>}
          </div>
          <ProgressBar current={book.currentPages || 0} total={book.totalPages} />
        </div>

        <div className="cm-book-aside">
          <span className={`cm-status-badge cm-status-${book.status}`}>
            {STATUS_MAP[book.status]}
          </span>
          {book.rating > 0 && (
            <div className="cm-stars">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`cm-star${n <= book.rating ? ' active' : ''}`} style={{ cursor: 'default' }}>★</span>
              ))}
            </div>
          )}
          <span className="cm-book-chevron">{expanded ? '▲' : '▼'}</span>
        </div>

        <button className="cm-icon-btn" style={{ alignSelf: 'flex-start', marginTop: 2 }}
          onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>
      </div>

      {/* ── expanded panel ── */}
      {expanded && (
        <div className="cm-book-expanded" onClick={e => e.stopPropagation()}>
          {/* Meta row */}
          <div className="cm-book-exp-meta">
            {book.startDate && (
              <div className="cm-book-exp-item">
                <span className="cm-label">Inizio</span>
                <span>{fmtDate(book.startDate)}</span>
              </div>
            )}
            {book.endDate && (
              <div className="cm-book-exp-item">
                <span className="cm-label">Fine</span>
                <span>{fmtDate(book.endDate)}</span>
              </div>
            )}
            {book.recommendedBy && (
              <div className="cm-book-exp-item">
                <span className="cm-label">Consigliato da</span>
                <span>{book.recommendedBy}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="cm-book-exp-controls">
            {book.totalPages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="cm-label">Pagine lette</span>
                <input type="number" className="cm-input"
                  style={{ width: 70, padding: '3px 8px' }}
                  value={book.currentPages || 0}
                  onChange={e => onPatch({ currentPages: e.target.value })} />
                <span style={{ color: 'var(--text2)', fontSize: 12 }}>/ {book.totalPages}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cm-label">Stato</span>
              <select className="cm-input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                value={book.status} onChange={e => onPatch({ status: e.target.value })}>
                <option value="to-read">Da leggere</option>
                <option value="reading">In lettura</option>
                <option value="done">Completato</option>
                <option value="abandoned">Abbandonato</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cm-label">Rating</span>
              <StarRow value={book.rating || 0} onChange={v => onPatch({ rating: v })} />
            </div>
          </div>

          {/* Text fields — edit inline */}
          {[
            ['notes',       'Note libere'],
            ['learnings',   'Insegnamenti chiave'],
            ['application', 'Come lo applico alla vita'],
          ].map(([field, label]) => (
            <div key={field} className="cm-form-group" style={{ marginBottom: 14 }}>
              <label className="cm-label">{label}</label>
              <textarea
                className="cm-input cm-textarea"
                rows={3}
                value={book[field] || ''}
                onChange={e => onPatch({ [field]: e.target.value })}
                placeholder={`${label}...`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookTracker() {
  const [books, setBooks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  });
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem(GOAL_KEY) || '1', 10));
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editGoal, setEditGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const coverRef = useRef();

  const save = (next) => { setBooks(next); localStorage.setItem(KEY, JSON.stringify(next)); };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setF('cover', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addBook = () => {
    if (!form.title.trim()) return;
    try {
      save([{ id: Date.now(), ...form, addedAt: new Date().toISOString().split('T')[0] }, ...books]);
    } catch { alert('Storage pieno — rimuovi alcuni libri.'); return; }
    setForm(EMPTY);
    setShowForm(false);
  };

  const patch  = (id, p) => save(books.map(b => b.id === id ? { ...b, ...p } : b));
  const remove = (id)    => save(books.filter(b => b.id !== id));

  const saveGoal = () => {
    const v = parseInt(goalDraft, 10);
    if (!isNaN(v) && v > 0) { setGoal(v); localStorage.setItem(GOAL_KEY, String(v)); }
    setEditGoal(false);
  };

  const ws = getMondayStr();
  const doneThisWeek = books.filter(b => b.status === 'done' && (b.endDate || b.addedAt) >= ws).length;
  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);

  return (
    <div>
      {/* ── GOAL STRIP ── */}
      <div className="cm-goal-strip">
        <span className="cm-label">Goal settimanale</span>
        {editGoal ? (
          <input className="cm-input" style={{ width: 50, padding: '2px 8px' }}
            value={goalDraft}
            onChange={e => setGoalDraft(e.target.value)}
            onBlur={saveGoal}
            onKeyDown={e => e.key === 'Enter' && saveGoal()}
            autoFocus />
        ) : (
          <span className="cm-goal-num"
            onClick={() => { setEditGoal(true); setGoalDraft(String(goal)); }}
            title="Clicca per modificare">
            {doneThisWeek}/{goal}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>libri questa settimana</span>
        <button className="cm-btn" onClick={() => { setShowForm(s => !s); if (showForm) setForm(EMPTY); }}>
          {showForm ? 'Annulla' : '+ Aggiungi libro'}
        </button>
      </div>

      {/* ── ADD FORM ── */}
      {showForm && (
        <div className="cm-book-form">
          <div className="cm-form-row">
            <div className="cm-form-group">
              <label className="cm-label">Titolo *</label>
              <input className="cm-input" value={form.title}
                onChange={e => setF('title', e.target.value)}
                placeholder="Titolo del libro"
                onKeyDown={e => e.key === 'Enter' && addBook()} />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Autore</label>
              <input className="cm-input" value={form.author}
                onChange={e => setF('author', e.target.value)} placeholder="Nome Cognome" />
            </div>
          </div>
          <div className="cm-form-row">
            <div className="cm-form-group">
              <label className="cm-label">Genere</label>
              <input className="cm-input" value={form.genre}
                onChange={e => setF('genre', e.target.value)} placeholder="Saggistica, Romanzo..." />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Consigliato da</label>
              <input className="cm-input" value={form.recommendedBy}
                onChange={e => setF('recommendedBy', e.target.value)} placeholder="Chi te l'ha consigliato" />
            </div>
          </div>
          <div className="cm-form-row">
            <div className="cm-form-group" style={{ maxWidth: 160 }}>
              <label className="cm-label">Stato</label>
              <select className="cm-input" value={form.status} onChange={e => setF('status', e.target.value)}>
                <option value="to-read">Da leggere</option>
                <option value="reading">In lettura</option>
                <option value="done">Completato</option>
                <option value="abandoned">Abbandonato</option>
              </select>
            </div>
            <div className="cm-form-group" style={{ maxWidth: 140 }}>
              <label className="cm-label">Data inizio</label>
              <input type="date" className="cm-input" value={form.startDate}
                onChange={e => setF('startDate', e.target.value)} />
            </div>
            <div className="cm-form-group" style={{ maxWidth: 140 }}>
              <label className="cm-label">Data fine</label>
              <input type="date" className="cm-input" value={form.endDate}
                onChange={e => setF('endDate', e.target.value)} />
            </div>
          </div>
          <div className="cm-form-row" style={{ alignItems: 'flex-end' }}>
            <div className="cm-form-group" style={{ maxWidth: 130 }}>
              <label className="cm-label">Pagine totali</label>
              <input type="number" className="cm-input" value={form.totalPages}
                onChange={e => setF('totalPages', e.target.value)} placeholder="300" />
            </div>
            <div className="cm-form-group" style={{ maxWidth: 130 }}>
              <label className="cm-label">Pagine lette</label>
              <input type="number" className="cm-input" value={form.currentPages}
                onChange={e => setF('currentPages', e.target.value)} placeholder="0" />
            </div>
            <div className="cm-form-group" style={{ maxWidth: 120 }}>
              <label className="cm-label">Rating</label>
              <StarRow value={form.rating} onChange={v => setF('rating', v)} />
            </div>
            <div className="cm-form-group" style={{ maxWidth: 80, flexShrink: 0 }}>
              <label className="cm-label">Copertina</label>
              <div className="cm-cover-upload-btn" onClick={() => coverRef.current.click()}>
                {form.cover ? <img src={form.cover} alt="cover" /> : '+ foto'}
              </div>
              <input ref={coverRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleCover} />
            </div>
          </div>
          {[
            ['notes',       'Note libere'],
            ['learnings',   'Insegnamenti chiave'],
            ['application', 'Come lo applico alla vita'],
          ].map(([field, label]) => (
            <div key={field} className="cm-form-group" style={{ marginBottom: 12 }}>
              <label className="cm-label">{label}</label>
              <textarea className="cm-input cm-textarea" rows={3}
                value={form[field]} onChange={e => setF(field, e.target.value)}
                placeholder={`${label}...`} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="cm-btn" onClick={addBook}>Aggiungi libro</button>
            <button className="cm-btn cm-btn-ghost"
              onClick={() => { setShowForm(false); setForm(EMPTY); }}>Annulla</button>
          </div>
        </div>
      )}

      {/* ── FILTER TABS ── */}
      <div className="cm-filter-tabs">
        {FILTERS.map(([v, l]) => (
          <button key={v} className={`cm-tab${filter === v ? ' active' : ''}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {/* ── BOOK LIST ── */}
      {filtered.length === 0
        ? <div className="cm-empty">Nessun libro in questa categoria</div>
        : filtered.map(book => (
          <BookItem
            key={book.id}
            book={book}
            expanded={expanded === book.id}
            onToggle={() => setExpanded(expanded === book.id ? null : book.id)}
            onPatch={p => patch(book.id, p)}
            onRemove={() => remove(book.id)}
          />
        ))}
    </div>
  );
}
