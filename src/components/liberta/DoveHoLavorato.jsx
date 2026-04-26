import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'lib_locations';

function flagEmoji(code) {
  if (!code || code.length !== 2) return '📍';
  try {
    return String.fromCodePoint(
      ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  } catch { return '📍'; }
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
}

function calcStreakRecord(locs) {
  const ranges = locs
    .filter(l => l.from && l.to && (l.city || '').toLowerCase() !== 'milano')
    .map(l => ({ s: new Date(l.from), e: new Date(l.to) }))
    .sort((a, b) => a.s - b.s);
  if (!ranges.length) return 0;
  const merged = [{ ...ranges[0] }];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    const next = new Date(last.e); next.setDate(next.getDate() + 1);
    if (ranges[i].s <= next) { if (ranges[i].e > last.e) last.e = ranges[i].e; }
    else merged.push({ ...ranges[i] });
  }
  return Math.max(...merged.map(r => Math.round((r.e - r.s) / 86400000) + 1));
}

const EMPTY_LOC = { city: '', country: '', countryCode: '', from: '', to: '', days: '', notes: '' };

export default function DoveHoLavorato() {
  const [locs, setLocs] = useFirebaseState(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_LOC });
  const [expanded, setExpanded] = useState(null);

  const save = next => setLocs(next);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addLoc = () => {
    if (!form.city.trim()) return;
    const days = form.days
      ? parseInt(form.days)
      : (form.from && form.to)
        ? Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1
        : 1;
    save([{ ...form, id: Date.now(), days, addedAt: new Date().toISOString().split('T')[0] }, ...locs]);
    setForm({ ...EMPTY_LOC });
    setShowForm(false);
  };

  const removeLoc = id => save(locs.filter(l => l.id !== id));

  const totalDays = locs.reduce((s, l) => s + (parseInt(l.days) || 0), 0);
  const uniqueCities = new Set(locs.map(l => l.city.toLowerCase())).size;
  const streakRecord = calcStreakRecord(locs);

  const sorted = [...locs].sort((a, b) => (b.from || '').localeCompare(a.from || ''));

  return (
    <div>
      {/* Stats */}
      <div className="lb-loc-stats">
        <div className="lb-loc-stat">
          <span className="lb-loc-stat-num">{totalDays}</span>
          <span className="lb-loc-stat-lbl">giorni totali in viaggio</span>
        </div>
        <div className="lb-loc-stat">
          <span className="lb-loc-stat-num">{uniqueCities}</span>
          <span className="lb-loc-stat-lbl">città visitate</span>
        </div>
        <div className="lb-loc-stat">
          <span className="lb-loc-stat-num">{streakRecord}</span>
          <span className="lb-loc-stat-lbl">record consecutivi fuori</span>
        </div>
      </div>

      {/* Timeline visiva */}
      {locs.length > 0 ? (
        <div className="lb-timeline">
          {sorted.map(l => (
            <div key={l.id} className="lb-pin" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
              <div className="lb-pin-flag">{flagEmoji(l.countryCode)}</div>
              <div className="lb-pin-city">{l.city}</div>
              <div className="lb-pin-country">{l.country}</div>
              <div className="lb-pin-days">{l.days}gg</div>
              {l.from && <div className="lb-pin-dates">{fmtDate(l.from)}{l.to && l.to !== l.from ? ` → ${fmtDate(l.to)}` : ''}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="lb-timeline-empty">Nessun luogo registrato — aggiungi la prima destinazione.</div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="cm-btn" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Annulla' : '+ Luogo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="lb-loc-form">
          <div className="lb-loc-form-row">
            <div className="lb-field xl">
              <label className="cm-label">Città *</label>
              <input className="cm-input" value={form.city} onChange={e => setF('city', e.target.value)} placeholder="Milano, Barcellona..." />
            </div>
            <div className="lb-field lg">
              <label className="cm-label">Paese</label>
              <input className="cm-input" value={form.country} onChange={e => setF('country', e.target.value)} placeholder="Italia, Spagna..." />
            </div>
            <div className="lb-field sm">
              <label className="cm-label">Codice (IT)</label>
              <input className="cm-input" value={form.countryCode} onChange={e => setF('countryCode', e.target.value)} placeholder="ES" maxLength={2} style={{ textTransform: 'uppercase' }} />
            </div>
          </div>
          <div className="lb-loc-form-row">
            <div className="lb-field md">
              <label className="cm-label">Dal</label>
              <input type="date" className="cm-input" value={form.from} onChange={e => setF('from', e.target.value)} />
            </div>
            <div className="lb-field md">
              <label className="cm-label">Al</label>
              <input type="date" className="cm-input" value={form.to} onChange={e => setF('to', e.target.value)} />
            </div>
            <div className="lb-field sm">
              <label className="cm-label">Giorni</label>
              <input type="number" className="cm-input" value={form.days} onChange={e => setF('days', e.target.value)} placeholder="auto" min="1" />
            </div>
            <div className="lb-field xl">
              <label className="cm-label">Note</label>
              <input className="cm-input" value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Progetto, evento, vacanza..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={addLoc}>Aggiungi</button>
            <button className="cm-btn cm-btn-ghost" onClick={() => { setShowForm(false); setForm({ ...EMPTY_LOC }); }}>Annulla</button>
          </div>
        </div>
      )}

      {/* Lista cronologica */}
      {sorted.length > 0 && (
        <>
          <div className="cm-label" style={{ marginBottom: 10 }}>Lista cronologica</div>
          <div className="lb-loc-list">
            {sorted.map(l => (
              <div key={l.id} className="lb-loc-row">
                <span style={{ fontSize: 18 }}>{flagEmoji(l.countryCode)}</span>
                <span className="lb-loc-city">{l.city}</span>
                <span className="lb-loc-country">{l.country}</span>
                <span className="lb-loc-dates">
                  {l.from ? fmtDate(l.from) : '—'}{l.to && l.to !== l.from ? ` → ${fmtDate(l.to)}` : ''}
                </span>
                <span className="lb-loc-days">{l.days}gg</span>
                {l.notes && <span className="lb-loc-note">{l.notes}</span>}
                <button className="cm-icon-btn" onClick={() => removeLoc(l.id)}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
