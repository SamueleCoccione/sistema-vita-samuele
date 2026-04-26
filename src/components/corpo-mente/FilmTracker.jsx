import { useState, useRef, useEffect, useCallback } from 'react';
import './FilmTracker.css';
import { useFirebaseState, removeFirebaseData } from '../../hooks/useFirebaseState';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const FILMS_KEY = 'sv_films_v1';
const OMDB_KEY  = 'sv_omdb_key';
const GOAL_KEY  = 'sv_film_goal';

const PLATFORMS = ['Cinema', 'Netflix', 'Prime Video', 'Disney+', 'Apple TV+', 'Mubi', 'RaiPlay', 'Altro'];

const MOODS = [
  { k: 'ispirato',    color: '#c8f564', textDark: true  },
  { k: 'energico',    color: '#f0a820', textDark: true  },
  { k: 'tranquillo',  color: '#7abfb5', textDark: true  },
  { k: 'malinconico', color: '#7a8ab5', textDark: false },
];

const STATUS_LABELS = {
  watched:    'Visto',
  'to-watch': 'Da vedere',
  abandoned:  'Abbandonato',
};

const EMPTY_FILM = {
  title: '', director: '', year: '', genre: '', platform: '',
  watchedDate: '', status: 'watched', rating: 0, mood: '',
  notes: '', impression: '', quote: '', poster: null,
  imdbId: '', priority: 2, watchlistNote: '', posterColor: null,
};

function getNowMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getNowYearStr() {
  return String(new Date().getFullYear());
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

function moodStyle(k) {
  const m = MOODS.find(m => m.k === k);
  if (!m) return {};
  return {
    background:   m.color + '44',
    borderColor:  m.color,
    color:        m.textDark ? '#1a1a1a' : '#ffffff',
  };
}

function extractColor(url, onColor) {
  if (!url) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 8; canvas.height = 12;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 8, 12);
      const data = ctx.getImageData(0, 0, 8, 12).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; n++; }
      if (n > 0) onColor(`rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`);
    } catch {}
  };
  img.src = url;
}

// ── Stars ──────────────────────────────────────────────────────
function Stars({ value, onChange }) {
  return (
    <div className="ft-stars">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`ft-star${n <= value ? ' on' : ''}${onChange ? ' clickable' : ''}`}
          onClick={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          style={!onChange ? { cursor: 'default' } : undefined}
        >★</button>
      ))}
    </div>
  );
}

// ── Priority dots ───────────────────────────────────────────────
function PriorityDots({ value, onChange }) {
  const labels = ['', 'bassa', 'media', 'alta'];
  return (
    <div className="ft-pri-row">
      {[1,2,3].map(n => (
        <button
          key={n}
          type="button"
          className={`ft-pri-btn${n <= value ? ' active' : ''}`}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
        >●</button>
      ))}
      {value > 0 && (
        <span className="cm-label" style={{ marginLeft: 4 }}>{labels[value]}</span>
      )}
    </div>
  );
}

// ── OMDB search hook ────────────────────────────────────────────
function useOmdbSearch(apiKey) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback((q) => {
    clearTimeout(timer.current);
    if (!q.trim() || !apiKey) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&type=movie&apikey=${apiKey}`);
        const json = await res.json();
        setResults(json.Search || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
  }, [apiKey]);

  const fetchDetail = useCallback(async (imdbId) => {
    if (!apiKey || !imdbId) return null;
    try {
      const res  = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`);
      const json = await res.json();
      return json.Response === 'True' ? json : null;
    } catch { return null; }
  }, [apiKey]);

  const clear = () => { clearTimeout(timer.current); setResults([]); setLoading(false); };

  return { results, loading, search, fetchDetail, clear };
}

// ── AddFilmForm ─────────────────────────────────────────────────
function AddFilmForm({ apiKey, onAdd, onSave, onCancel, initialStatus, initialData }) {
  const [form, setForm] = useState(() => initialData ? { ...initialData } : { ...EMPTY_FILM, status: initialStatus || 'watched' });
  const coverRef  = useRef();
  const dropRef   = useRef();
  const omdb      = useOmdbSearch(apiKey);
  const [showDrop, setShowDrop] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setF('poster', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTitleChange = (val) => {
    setF('title', val);
    omdb.search(val);
    setShowDrop(true);
  };

  const pickOmdb = async (item) => {
    omdb.clear();
    setShowDrop(false);
    const detail = await omdb.fetchDetail(item.imdbID);
    const d = detail || item;
    setForm(f => ({
      ...f,
      title:    d.Title  || f.title,
      director: detail && d.Director !== 'N/A' ? d.Director : f.director,
      year:     (d.Year  || f.year || '').slice(0, 4),
      genre:    detail && d.Genre !== 'N/A' ? d.Genre.split(',')[0].trim() : f.genre,
      poster:   d.Poster && d.Poster !== 'N/A' ? d.Poster : f.poster,
      imdbId:   d.imdbID || f.imdbId,
    }));
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = () => {
    if (!form.title.trim()) return;
    if (initialData) {
      onSave(form);
    } else {
      onAdd({ ...form, id: Date.now(), addedAt: new Date().toISOString().split('T')[0] });
    }
  };

  const isWatchlist = form.status === 'to-watch';

  return (
    <div className="ft-form">
      {/* Poster + title block */}
      <div className="ft-form-row ft-form-block">
        <div style={{ flexShrink: 0 }}>
          <label className="cm-label">Locandina</label>
          <div className="ft-cover-box" style={{ marginTop: 6 }} onClick={() => coverRef.current.click()}>
            {form.poster
              ? <img src={form.poster} alt="poster" crossOrigin="anonymous" />
              : <span>Carica<br />foto</span>}
          </div>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCover} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Title with OMDB autocomplete */}
          <div ref={dropRef} style={{ position: 'relative' }}>
            <label className="cm-label">Titolo *</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <input
                className="cm-input"
                style={{ width: '100%' }}
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                onFocus={() => omdb.results.length > 0 && setShowDrop(true)}
                placeholder="Titolo del film..."
              />
              {omdb.loading && <span className="ft-omdb-spinner">◌</span>}
            </div>
            {showDrop && omdb.results.length > 0 && (
              <div className="ft-omdb-drop">
                {omdb.results.map(item => (
                  <div key={item.imdbID} className="ft-omdb-item" onMouseDown={() => pickOmdb(item)}>
                    {item.Poster !== 'N/A'
                      ? <img src={item.Poster} alt={item.Title} className="ft-omdb-thumb" />
                      : <div className="ft-omdb-thumb-ph">🎬</div>}
                    <div>
                      <div className="ft-omdb-title">{item.Title}</div>
                      <div className="ft-omdb-meta">{item.Year}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ft-form-row" style={{ marginBottom: 0 }}>
            <div className="ft-form-group">
              <label className="cm-label">Regista</label>
              <input className="cm-input" value={form.director}
                onChange={e => setF('director', e.target.value)} placeholder="Regista" />
            </div>
            <div className="ft-form-group ft-form-group-sm">
              <label className="cm-label">Anno</label>
              <input className="cm-input" value={form.year}
                onChange={e => setF('year', e.target.value)} placeholder="2024" />
            </div>
            <div className="ft-form-group">
              <label className="cm-label">Genere</label>
              <input className="cm-input" value={form.genre}
                onChange={e => setF('genre', e.target.value)} placeholder="Drama, Thriller..." />
            </div>
          </div>
        </div>
      </div>

      {/* Platform / date / status / rating */}
      <div className="ft-form-row">
        <div className="ft-form-group ft-form-group-md">
          <label className="cm-label">Piattaforma</label>
          <select className="cm-input" value={form.platform} onChange={e => setF('platform', e.target.value)}>
            <option value="">— nessuna —</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="ft-form-group ft-form-group-sm">
          <label className="cm-label">Stato</label>
          <select className="cm-input" value={form.status} onChange={e => setF('status', e.target.value)}>
            <option value="watched">Visto</option>
            <option value="to-watch">Da vedere</option>
            <option value="abandoned">Abbandonato</option>
          </select>
        </div>
        {!isWatchlist && (
          <div className="ft-form-group ft-form-group-md">
            <label className="cm-label">Data visione</label>
            <input type="date" className="cm-input" value={form.watchedDate}
              onChange={e => setF('watchedDate', e.target.value)} />
          </div>
        )}
        {!isWatchlist && (
          <div className="ft-form-group" style={{ maxWidth: 130 }}>
            <label className="cm-label">Rating</label>
            <div style={{ paddingTop: 8 }}>
              <Stars value={form.rating} onChange={v => setF('rating', v)} />
            </div>
          </div>
        )}
      </div>

      {/* Mood (watched/abandoned only) */}
      {!isWatchlist && (
        <div className="ft-form-group" style={{ marginBottom: 14 }}>
          <label className="cm-label">Umore alla visione</label>
          <div className="ft-mood-btns" style={{ marginTop: 6 }}>
            {MOODS.map(m => (
              <button key={m.k} type="button" className="ft-mood-btn"
                style={form.mood === m.k ? { background: m.color + '44', borderColor: m.color } : {}}
                onClick={() => setF('mood', form.mood === m.k ? '' : m.k)}>
                {m.k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Priority (watchlist only) */}
      {isWatchlist && (
        <div className="ft-form-group" style={{ marginBottom: 14 }}>
          <label className="cm-label">Priorità</label>
          <PriorityDots value={form.priority} onChange={v => setF('priority', v)} />
        </div>
      )}

      {/* Text fields */}
      {isWatchlist ? (
        <div className="ft-form-group" style={{ marginBottom: 12 }}>
          <label className="cm-label">Perché voglio vederlo</label>
          <textarea className="cm-input cm-textarea" rows={2}
            value={form.watchlistNote} onChange={e => setF('watchlistNote', e.target.value)}
            placeholder="Motivazione, chi l'ha consigliato..." />
        </div>
      ) : (
        <>
          <div className="ft-form-group" style={{ marginBottom: 12 }}>
            <label className="cm-label">Cosa mi ha lasciato</label>
            <textarea className="cm-input cm-textarea" rows={2}
              value={form.impression} onChange={e => setF('impression', e.target.value)}
              placeholder="Riflessioni, emozioni, impatto..." />
          </div>
          <div className="ft-form-group" style={{ marginBottom: 12 }}>
            <label className="cm-label">Citazione o scena che ricordo</label>
            <textarea className="cm-input cm-textarea" rows={2}
              value={form.quote} onChange={e => setF('quote', e.target.value)}
              placeholder="..." />
          </div>
          <div className="ft-form-group" style={{ marginBottom: 12 }}>
            <label className="cm-label">Note libere</label>
            <textarea className="cm-input cm-textarea" rows={2}
              value={form.notes} onChange={e => setF('notes', e.target.value)}
              placeholder="Commenti, link, confronti..." />
          </div>
        </>
      )}

      <div className="ft-form-actions">
        <button className="cm-btn" onClick={submit}>{initialData ? 'Salva modifiche' : 'Aggiungi film'}</button>
        <button className="cm-btn cm-btn-ghost" onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

// ── FilmCard ────────────────────────────────────────────────────
function FilmCard({ film, expanded, onToggle, onPatch, onRemove, apiKey }) {
  const [posterColor, setPosterColor] = useState(film.posterColor || null);
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (!expanded) setEditing(false); }, [expanded]);

  useEffect(() => {
    if (!posterColor && film.poster) {
      extractColor(film.poster, (color) => {
        setPosterColor(color);
        onPatch({ posterColor: color });
      });
    }
  }, [film.poster]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusClass = {
    watched:    'ft-status-watched',
    'to-watch': 'ft-status-to-watch',
    abandoned:  'ft-status-abandoned',
  }[film.status] || '';

  return (
    <div className={`ft-film${expanded ? ' ft-film-open' : ''}`}>
      <div className="ft-film-compact" onClick={onToggle}>
        {film.poster
          ? <img src={film.poster} alt={film.title} className="ft-poster" crossOrigin="anonymous" />
          : <div className="ft-poster-ph">🎬</div>}
        <div className="ft-film-info">
          <div className="ft-film-title">{film.title}</div>
          <div className="ft-film-meta">
            {[film.director, film.year].filter(Boolean).join(' · ')}
          </div>
          <div className="ft-film-tags">
            {film.platform   && <span className="ft-platform-tag">{film.platform}</span>}
            {film.genre      && <span className="ft-date-tag">{film.genre}</span>}
            {film.watchedDate && <span className="ft-date-tag">{fmtDate(film.watchedDate)}</span>}
            {film.mood && (
              <span className="ft-mood-pill" style={moodStyle(film.mood)}>{film.mood}</span>
            )}
          </div>
        </div>
        <div className="ft-film-aside">
          <span className={`ft-status-badge ${statusClass}`}>{STATUS_LABELS[film.status]}</span>
          {film.rating > 0 && <Stars value={film.rating} />}
          <button className="cm-icon-btn" style={{ marginTop: 'auto' }}
            onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>
        </div>
      </div>

      {expanded && (
        editing ? (
          <div className="ft-expanded">
            <AddFilmForm
              apiKey={apiKey}
              initialData={film}
              onSave={(updated) => { onPatch(updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
        <div
          className="ft-expanded"
          style={posterColor ? { backgroundColor: posterColor + '18' } : undefined}
        >
          <div className="ft-exp-body">
            {film.poster && (
              <img src={film.poster} alt={film.title} className="ft-exp-poster" crossOrigin="anonymous" />
            )}
            <div className="ft-exp-info">
              <div className="ft-exp-title">{film.title}</div>
              <div className="ft-exp-sub">
                {[film.director, film.year, film.genre].filter(Boolean).join(' · ')}
              </div>

              <div className="ft-exp-grid">
                {film.platform && (
                  <div className="ft-exp-field">
                    <span className="ft-field-lbl">Piattaforma</span>
                    <span className="ft-field-val">{film.platform}</span>
                  </div>
                )}
                {film.watchedDate && (
                  <div className="ft-exp-field">
                    <span className="ft-field-lbl">Data visione</span>
                    <span className="ft-field-val">{fmtDate(film.watchedDate)}</span>
                  </div>
                )}
                {film.mood && (
                  <div className="ft-exp-field">
                    <span className="ft-field-lbl">Umore</span>
                    <span className="ft-mood-tag" style={moodStyle(film.mood)}>{film.mood}</span>
                  </div>
                )}
                {film.rating > 0 && (
                  <div className="ft-exp-field">
                    <span className="ft-field-lbl">Rating</span>
                    <Stars value={film.rating} onChange={v => onPatch({ rating: v })} />
                  </div>
                )}
              </div>

              {/* Inline controls */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <span className="cm-label">Stato</span>
                <select className="cm-input" style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }}
                  value={film.status} onChange={e => onPatch({ status: e.target.value })}>
                  <option value="watched">Visto</option>
                  <option value="to-watch">Da vedere</option>
                  <option value="abandoned">Abbandonato</option>
                </select>
                {film.status === 'watched' && (
                  <>
                    <span className="cm-label" style={{ marginLeft: 10 }}>Rating</span>
                    <Stars value={film.rating || 0} onChange={v => onPatch({ rating: v })} />
                  </>
                )}
              </div>

              {film.impression && (
                <div className="ft-exp-text-block">
                  <div className="ft-field-lbl">Cosa mi ha lasciato</div>
                  <div className="ft-field-text">{film.impression}</div>
                </div>
              )}
              {film.quote && (
                <div className="ft-exp-text-block">
                  <div className="ft-field-lbl">Citazione / Scena</div>
                  <div className="ft-field-quote">{film.quote}</div>
                </div>
              )}
              {film.notes && (
                <div className="ft-exp-text-block">
                  <div className="ft-field-lbl">Note</div>
                  <div className="ft-field-text">{film.notes}</div>
                </div>
              )}
            </div>
          </div>
          <div className="ft-exp-actions">
            <button className="cm-btn cm-btn-ghost" onClick={onToggle}>Chiudi</button>
            <button className="cm-btn" onClick={() => setEditing(true)}>Modifica</button>
            <button className="cm-btn cm-btn-ghost"
              style={{ marginLeft: 'auto', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
              onClick={onRemove}>Rimuovi</button>
          </div>
        </div>
        )
      )}
    </div>
  );
}

// ── WatchlistCard ───────────────────────────────────────────────
function WatchlistCard({ film, expanded, onToggle, onPatch, onRemove, apiKey }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!expanded) setEditing(false); }, [expanded]);
  return (
    <div>
      <div
        className={`ft-watchlist-card${expanded ? ' ft-film-open' : ''}`}
        onClick={onToggle}
      >
        {film.poster
          ? <img src={film.poster} alt={film.title} className="ft-poster" crossOrigin="anonymous" />
          : <div className="ft-poster-ph">🎬</div>}
        <div className="ft-wl-info">
          <div className="ft-wl-title">{film.title}</div>
          <div className="ft-wl-meta">
            {[film.director, film.year, film.genre].filter(Boolean).join(' · ')}
          </div>
          {film.watchlistNote && (
            <div className="ft-wl-note">{film.watchlistNote}</div>
          )}
        </div>
        <div className="ft-wl-aside">
          {film.platform && <span className="ft-platform-tag">{film.platform}</span>}
          <div className="ft-pri-dots">
            {[1,2,3].map(n => (
              <div key={n} className={`ft-pri-dot${n <= (film.priority || 0) ? ' on' : ''}`} />
            ))}
          </div>
          <button className="cm-icon-btn" onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>
        </div>
      </div>

      {expanded && (
        editing ? (
          <div className="ft-expanded">
            <AddFilmForm
              apiKey={apiKey}
              initialData={film}
              onSave={(updated) => { onPatch(updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
        <div className="ft-expanded">
          <div className="ft-exp-body">
            {film.poster && (
              <img src={film.poster} alt={film.title} className="ft-exp-poster" crossOrigin="anonymous" />
            )}
            <div className="ft-exp-info">
              <div className="ft-exp-title">{film.title}</div>
              <div className="ft-exp-sub">
                {[film.director, film.year, film.genre].filter(Boolean).join(' · ')}
              </div>
              {film.watchlistNote && (
                <div className="ft-exp-text-block" style={{ marginBottom: 14 }}>
                  <div className="ft-field-lbl">Perché voglio vederlo</div>
                  <div className="ft-field-text">{film.watchlistNote}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span className="cm-label">Priorità</span>
                <PriorityDots value={film.priority || 0} onChange={v => onPatch({ priority: v })} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="cm-label">Stato</span>
                <select className="cm-input" style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }}
                  value={film.status} onChange={e => onPatch({ status: e.target.value })}>
                  <option value="to-watch">Da vedere</option>
                  <option value="watched">Visto</option>
                  <option value="abandoned">Abbandonato</option>
                </select>
              </div>
            </div>
          </div>
          <div className="ft-exp-actions">
            <button className="cm-btn cm-btn-ghost" onClick={onToggle}>Chiudi</button>
            <button className="cm-btn" onClick={() => setEditing(true)}>Modifica</button>
            <button className="cm-btn cm-btn-ghost"
              style={{ marginLeft: 'auto', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
              onClick={onRemove}>Rimuovi</button>
          </div>
        </div>
        )
      )}
    </div>
  );
}

// ── StatsPanel ──────────────────────────────────────────────────
function StatsPanel({ films }) {
  const watched    = films.filter(f => f.status === 'watched');
  const nowMonth   = getNowMonthStr();
  const nowYear    = getNowYearStr();
  const thisMonth  = watched.filter(f => (f.watchedDate || '').startsWith(nowMonth));
  const thisYear   = watched.filter(f => (f.watchedDate || '').startsWith(nowYear));
  const ratedFilms = watched.filter(f => f.rating > 0);
  const avgRating  = ratedFilms.length > 0
    ? (ratedFilms.reduce((s, f) => s + f.rating, 0) / ratedFilms.length).toFixed(1)
    : null;

  // Genre bar chart
  const genreCounts = {};
  watched.forEach(f => {
    if (!f.genre) return;
    const g = f.genre.split(',')[0].trim();
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genreData = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Platform bars
  const platCounts = {};
  watched.forEach(f => { if (f.platform) platCounts[f.platform] = (platCounts[f.platform] || 0) + 1; });
  const platMax  = Math.max(...Object.values(platCounts), 1);
  const platData = Object.entries(platCounts).sort(([, a], [, b]) => b - a);

  // Mood breakdown
  const moodCounts = {};
  watched.forEach(f => { if (f.mood) moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1; });

  // Journal correlation
  let journalEntries = [];
  try { journalEntries = JSON.parse(localStorage.getItem('sv_daily_journal') || '[]'); } catch {}
  const correlations = watched
    .filter(f => f.watchedDate && f.mood)
    .map(f => ({ film: f, journal: journalEntries.find(e => e.date === f.watchedDate) || null }))
    .filter(c => c.journal)
    .slice(0, 5);

  if (watched.length === 0) {
    return (
      <div className="ft-stats">
        <div className="ft-empty">Nessun film visto ancora — inizia a tracciare!</div>
      </div>
    );
  }

  return (
    <div className="ft-stats">
      {/* KPIs */}
      <div className="ft-stats-kpi">
        <div className="ft-kpi">
          <div className="ft-kpi-num">{thisMonth.length}</div>
          <div className="ft-kpi-lbl">questo mese</div>
        </div>
        <div className="ft-kpi">
          <div className="ft-kpi-num">{thisYear.length}</div>
          <div className="ft-kpi-lbl">quest'anno</div>
        </div>
        <div className="ft-kpi">
          <div className="ft-kpi-num ft-kpi-str">
            {avgRating ?? '—'}{avgRating && <span className="ft-kpi-den">/5</span>}
          </div>
          <div className="ft-kpi-lbl">rating medio</div>
        </div>
        <div className="ft-kpi">
          <div className="ft-kpi-num">{watched.length}</div>
          <div className="ft-kpi-lbl">totale visti</div>
        </div>
      </div>

      {/* Genre chart */}
      {genreData.length > 0 && (
        <div className="ft-stats-section">
          <span className="ft-stats-lbl">Generi</span>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={genreData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11 }}
                cursor={{ fill: 'rgba(200,245,100,0.10)' }}
              />
              <Bar dataKey="count" fill="var(--chart-blue)" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform bars */}
      {platData.length > 0 && (
        <div className="ft-stats-section">
          <span className="ft-stats-lbl">Piattaforme</span>
          {platData.map(([name, count]) => (
            <div key={name} className="ft-plat-row">
              <span className="ft-plat-name">{name}</span>
              <div className="ft-plat-bar">
                <div className="ft-plat-fill" style={{ width: `${(count / platMax) * 100}%` }} />
              </div>
              <span className="ft-plat-cnt">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mood breakdown */}
      {Object.keys(moodCounts).length > 0 && (
        <div className="ft-stats-section">
          <span className="ft-stats-lbl">Umore alla visione</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {MOODS.filter(m => moodCounts[m.k]).map(m => (
              <div key={m.k}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
                <span className="ft-mood-pill" style={moodStyle(m.k)}>{m.k}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {moodCounts[m.k]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal correlation */}
      {correlations.length > 0 && (
        <div className="ft-stats-section">
          <span className="ft-stats-lbl">Film + Journal — stesso giorno</span>
          {correlations.map(({ film, journal }) => (
            <div key={film.id} className="ft-journal-row">
              <span className="ft-j-title">{film.title}</span>
              {film.mood && (
                <span className="ft-j-mood">
                  <span className="ft-mood-pill" style={moodStyle(film.mood)}>{film.mood}</span>
                </span>
              )}
              {journal.text && (
                <span className="ft-j-excerpt">
                  {journal.text.slice(0, 120)}{journal.text.length > 120 ? '…' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FilmTracker ─────────────────────────────────────────────────
export default function FilmTracker() {
  const [films,  setFilms]  = useFirebaseState(FILMS_KEY, []);
  const [goal,   setGoal]   = useFirebaseState(GOAL_KEY, 4);
  const [apiKey, setApiKey] = useFirebaseState(OMDB_KEY, '');
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [showOmdbSetup, setShowOmdbSetup] = useState(false);

  const [mainTab,   setMainTab]   = useState('films');
  const [showForm,  setShowForm]  = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter,  setGenreFilter]  = useState('');
  const [platFilter,   setPlatFilter]   = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [wlSort,    setWlSort]    = useState('priority');
  const [editGoal,  setEditGoal]  = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const save = (next) => setFilms(next);

  const addFilm = (film) => {
    save([film, ...films]);
    setShowForm(false);
  };

  const patch = (id, p) => save(films.map(f => {
    if (f.id !== id) return f;
    const merged = { ...f, ...p };
    if (p.status === 'watched' && !merged.watchedDate) merged.watchedDate = todayStr();
    return merged;
  }));
  const remove = (id)    => save(films.filter(f => f.id !== id));

  const saveGoal = () => {
    const v = parseInt(goalDraft, 10);
    if (!isNaN(v) && v > 0) setGoal(v);
    setEditGoal(false);
  };

  const saveApiKey = () => {
    const k = apiKeyDraft.trim();
    setApiKey(k);
    if (!k) removeFirebaseData(OMDB_KEY);
    setShowOmdbSetup(false);
  };

  // Counters
  const nowMonth   = getNowMonthStr();
  const nowYear    = getNowYearStr();
  const watched    = films.filter(f => f.status === 'watched');
  const monthCount = watched.filter(f => (f.watchedDate || '').startsWith(nowMonth)).length;
  const yearCount  = watched.filter(f => (f.watchedDate || '').startsWith(nowYear)).length;
  const goalPct    = Math.min(100, Math.round((monthCount / goal) * 100));

  // Filter options
  const allGenres    = [...new Set(films.map(f => f.genre).filter(Boolean).map(g => g.split(',')[0].trim()))].sort();
  const allPlatforms = [...new Set(films.map(f => f.platform).filter(Boolean))].sort();

  // Films list (excludes to-watch)
  const filmList = films
    .filter(f => f.status !== 'to-watch')
    .filter(f => statusFilter === 'all' || f.status === statusFilter)
    .filter(f => !genreFilter  || (f.genre || '').toLowerCase().includes(genreFilter.toLowerCase()))
    .filter(f => !platFilter   || f.platform === platFilter)
    .filter(f => !ratingFilter || f.rating >= parseInt(ratingFilter, 10));

  // Watchlist
  const watchlist = films
    .filter(f => f.status === 'to-watch')
    .sort((a, b) => wlSort === 'priority'
      ? (b.priority || 0) - (a.priority || 0)
      : b.id - a.id);

  const switchTab = (tab) => {
    setMainTab(tab);
    setExpanded(null);
    setShowForm(false);
  };

  return (
    <div className="ft-wrap">

      {/* ── Header ── */}
      <div className="ft-header">
        <div className="ft-counters">
          <div className="ft-counter">
            <span className="ft-counter-num">{monthCount}</span>
            <span className="ft-counter-lbl">
              questo mese
              {editGoal ? (
                <input
                  className="cm-input"
                  style={{ width: 38, padding: '1px 5px', fontSize: 11, marginLeft: 6 }}
                  value={goalDraft}
                  onChange={e => setGoalDraft(e.target.value)}
                  onBlur={saveGoal}
                  onKeyDown={e => e.key === 'Enter' && saveGoal()}
                  autoFocus
                />
              ) : (
                <span className="ft-goal-denom">/{goal}</span>
              )}
            </span>
          </div>
          <div className="ft-counter-sep" />
          <div className="ft-counter">
            <span className="ft-counter-num">{yearCount}</span>
            <span className="ft-counter-lbl">quest'anno</span>
          </div>
          <div className="ft-counter-sep" />
          <div className="ft-counter">
            <span className="ft-counter-num">{watchlist.length}</span>
            <span className="ft-counter-lbl">da vedere</span>
          </div>
        </div>

        <div className="ft-goal-row">
          <div className="ft-goal-bar">
            <div className="ft-goal-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <span className={`ft-goal-hint${monthCount >= goal ? ' ft-goal-hint-done' : ''}`}>
            {monthCount >= goal
              ? '✓ obiettivo mese raggiunto'
              : `${monthCount}/${goal} — manca${goal - monthCount > 1 ? 'no' : ''} ${goal - monthCount}`}
          </span>
          {!editGoal && (
            <button className="ft-goal-edit-btn"
              onClick={() => { setEditGoal(true); setGoalDraft(String(goal)); }}>
              modifica
            </button>
          )}
        </div>
      </div>

      {/* ── Main tabs ── */}
      <div className="ft-maintabs">
        {[
          ['films',     'Film'],
          ['watchlist', `Da vedere (${watchlist.length})`],
          ['stats',     'Statistiche'],
        ].map(([id, label]) => (
          <button key={id} className={`ft-maintab${mainTab === id ? ' active' : ''}`}
            onClick={() => switchTab(id)}>{label}</button>
        ))}
        <div className="ft-tabs-right">
          <button
            className="ft-omdb-badge"
            onClick={() => { setShowOmdbSetup(s => !s); setApiKeyDraft(apiKey); }}
          >{apiKey ? '● OMDB' : '○ OMDB'}</button>
        </div>
      </div>

      {/* ── OMDB setup ── */}
      {showOmdbSetup && (
        <div className="ft-omdb-setup">
          <p className="ft-omdb-desc">
            OMDB API (gratuita) — ottieni la chiave su{' '}
            <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer">
              omdbapi.com
            </a>{' '}
            per abilitare la ricerca automatica di titolo, regista, anno e locandina.
          </p>
          <div className="ft-omdb-input-row">
            <input
              className="cm-input"
              style={{ flex: 1 }}
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
              placeholder="Incolla la chiave API..."
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
            />
            <button className="cm-btn" onClick={saveApiKey}>Salva</button>
            {apiKey && (
              <button className="cm-btn cm-btn-ghost" onClick={() => {
                setApiKey('');
                setApiKeyDraft('');
                removeFirebaseData(OMDB_KEY);
                setShowOmdbSetup(false);
              }}>Rimuovi</button>
            )}
          </div>
        </div>
      )}

      {/* ── Film tab ── */}
      {mainTab === 'films' && (
        <>
          <div className="ft-toolbar">
            <div className="ft-filters">
              {[['all', 'Tutti'], ['watched', 'Visti'], ['abandoned', 'Abbandonati']].map(([v, l]) => (
                <button key={v} className={`cm-tab${statusFilter === v ? ' active' : ''}`}
                  onClick={() => setStatusFilter(v)}>{l}</button>
              ))}
            </div>
            <div className="ft-filters">
              {allGenres.length > 0 && (
                <select className="cm-input ft-filter-sel" value={genreFilter}
                  onChange={e => setGenreFilter(e.target.value)}>
                  <option value="">Tutti i generi</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
              {allPlatforms.length > 0 && (
                <select className="cm-input ft-filter-sel" value={platFilter}
                  onChange={e => setPlatFilter(e.target.value)}>
                  <option value="">Tutte le piattaforme</option>
                  {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              <select className="cm-input ft-filter-sel" value={ratingFilter}
                onChange={e => setRatingFilter(e.target.value)}>
                <option value="">Tutti i rating</option>
                <option value="4">4+ stelle</option>
                <option value="3">3+ stelle</option>
                <option value="2">2+ stelle</option>
              </select>
              <button className="cm-btn" onClick={() => setShowForm(s => !s)}>
                {showForm ? 'Annulla' : '+ Film'}
              </button>
            </div>
          </div>

          {showForm && (
            <AddFilmForm
              apiKey={apiKey}
              onAdd={addFilm}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="ft-list">
            {filmList.length === 0 ? (
              <div className="ft-empty">
                {statusFilter !== 'all' || genreFilter || platFilter || ratingFilter
                  ? 'Nessun film per questi filtri'
                  : 'Aggiungi il primo film visto'}
              </div>
            ) : filmList.map(film => (
              <FilmCard
                key={film.id}
                film={film}
                expanded={expanded === film.id}
                onToggle={() => setExpanded(expanded === film.id ? null : film.id)}
                onPatch={p => patch(film.id, p)}
                onRemove={() => { remove(film.id); if (expanded === film.id) setExpanded(null); }}
                apiKey={apiKey}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Watchlist tab ── */}
      {mainTab === 'watchlist' && (
        <>
          <div className="ft-watchlist-toolbar">
            <span className="ft-sort-lbl">Ordina per</span>
            {[['priority', 'priorità'], ['added', 'data aggiunta']].map(([v, l]) => (
              <button key={v} className={`cm-tab${wlSort === v ? ' active' : ''}`}
                onClick={() => setWlSort(v)}>{l}</button>
            ))}
            <button className="cm-btn" style={{ marginLeft: 'auto' }}
              onClick={() => setShowForm(s => !s)}>
              {showForm ? 'Annulla' : '+ Da vedere'}
            </button>
          </div>

          {showForm && (
            <AddFilmForm
              apiKey={apiKey}
              initialStatus="to-watch"
              onAdd={addFilm}
              onCancel={() => setShowForm(false)}
            />
          )}

          {watchlist.length === 0 ? (
            <div className="ft-empty">Nessun film in watchlist</div>
          ) : watchlist.map(film => (
            <WatchlistCard
              key={film.id}
              film={film}
              expanded={expanded === film.id}
              onToggle={() => setExpanded(expanded === film.id ? null : film.id)}
              onPatch={p => patch(film.id, p)}
              onRemove={() => { remove(film.id); if (expanded === film.id) setExpanded(null); }}
              apiKey={apiKey}
            />
          ))}
        </>
      )}

      {/* ── Stats tab ── */}
      {mainTab === 'stats' && <StatsPanel films={films} />}
    </div>
  );
}
