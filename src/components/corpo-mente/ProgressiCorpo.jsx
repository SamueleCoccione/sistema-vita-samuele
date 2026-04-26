import { useState, useRef } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BodyAvatar from './BodyAvatar';

const MEAS_KEY   = 'sv_body_measures';
const PHOTOS_KEY = 'sv_progressi_photos';

const DEFAULTS = { height: 178, weight: 80, waist: 85, hips: 95 };

function bmi(weight, height) {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
}

function weekDiff(entries) {
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const cutoff = new Date(latest.date);
  cutoff.setDate(cutoff.getDate() - 8);
  const prev = [...entries]
    .reverse()
    .find(e => new Date(e.date) <= cutoff);
  if (!prev) return null;
  return (latest.weight - prev.weight).toFixed(1);
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

function getMondayStr() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return m.toISOString().split('T')[0];
}

export default function ProgressiCorpo() {
  const [measures, setMeasures] = useFirebaseState(MEAS_KEY, []);
  const [photos,   setPhotos]   = useFirebaseState(PHOTOS_KEY, []);

  const latest  = measures.length ? measures[measures.length - 1] : DEFAULTS;
  const [form, setForm] = useState({
    height: latest.height || DEFAULTS.height,
    weight: latest.weight || DEFAULTS.weight,
    waist:  latest.waist  || DEFAULTS.waist,
    hips:   latest.hips   || DEFAULTS.hips,
  });

  const frontRef = useRef();
  const sideRef  = useRef();
  const [photoForm, setPhotoForm] = useState({ date: getMondayStr(), front: null, side: null });
  const [showPhotoForm, setShowPhotoForm] = useState(false);

  /* ── measurements ── */
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMeasures = () => {
    setMeasures([...measures, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      height: parseFloat(form.height) || 0,
      weight: parseFloat(form.weight) || 0,
      waist:  parseFloat(form.waist)  || 0,
      hips:   parseFloat(form.hips)   || 0,
    }]);
  };

  /* ── photos ── */
  const readFile = (file, cb) => {
    const r = new FileReader();
    r.onload = e => cb(e.target.result);
    r.readAsDataURL(file);
  };

  const addPhotoEntry = () => {
    if (!photoForm.front && !photoForm.side) return;
    setPhotos([{ id: Date.now(), date: photoForm.date, front: photoForm.front, side: photoForm.side }, ...photos]);
    setPhotoForm({ date: getMondayStr(), front: null, side: null });
    setShowPhotoForm(false);
  };

  const removePhoto = (id) => setPhotos(photos.filter(p => p.id !== id));

  /* ── stats ── */
  const diff    = weekDiff(measures);
  const bmiVal  = bmi(latest.weight, latest.height);
  const diffStr = diff !== null
    ? `${parseFloat(diff) >= 0 ? '+' : ''}${diff} kg`
    : '—';

  return (
    <div>
      {/* ── avatar + misure ── */}
      <div className="pc-layout">
        {/* Avatar 3D */}
        <div>
          <BodyAvatar
            height={parseFloat(form.height) || DEFAULTS.height}
            weight={parseFloat(form.weight) || DEFAULTS.weight}
            waist={parseFloat(form.waist)   || DEFAULTS.waist}
            hips={parseFloat(form.hips)     || DEFAULTS.hips}
          />
          <p className="pc-avatar-hint">Trascina per ruotare · L'avatar si aggiorna con le misure</p>
        </div>

        {/* Misure + stats */}
        <div className="pc-right">
          <div className="pc-measures">
            <div className="cm-label" style={{ marginBottom: 16 }}>Misure corporee</div>
            {[
              ['height', 'Altezza', 'cm'],
              ['weight', 'Peso',    'kg'],
              ['waist',  'Vita',    'cm'],
              ['hips',   'Fianchi', 'cm'],
            ].map(([k, label, unit]) => (
              <div key={k} className="pc-measure-row">
                <label className="pc-measure-label">{label}</label>
                <input
                  type="number"
                  className="cm-input pc-measure-input"
                  value={form[k]}
                  onChange={e => setF(k, e.target.value)}
                  step={k === 'weight' ? '0.1' : '1'}
                  min="0"
                />
                <span className="pc-measure-unit">{unit}</span>
              </div>
            ))}
            <button className="cm-btn" style={{ marginTop: 14, width: '100%' }} onClick={saveMeasures}>
              Salva misure
            </button>
          </div>

          {/* Stats */}
          <div className="pc-stats">
            <div className="cm-label" style={{ marginBottom: 14 }}>Trend</div>
            <div className="pc-stat-grid">
              <div className="pc-stat">
                <div className="pc-stat-label">Peso attuale</div>
                <div className="pc-stat-val">{latest.weight || '—'}<span className="pc-stat-unit">kg</span></div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-label">Variazione sett.</div>
                <div className={`pc-stat-val${diff !== null && parseFloat(diff) < 0 ? ' pc-stat-down' : ''}`}>
                  {diffStr}
                </div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-label">BMI</div>
                <div className="pc-stat-val">{bmiVal || '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-label">Altezza</div>
                <div className="pc-stat-val">{latest.height || '—'}<span className="pc-stat-unit">cm</span></div>
              </div>
            </div>

            {/* Mini weight history */}
            {measures.length > 1 && (
              <div className="pc-history">
                <div className="cm-label" style={{ marginBottom: 10 }}>Storico peso</div>
                {[...measures].reverse().slice(0, 6).map(m => (
                  <div key={m.id} className="pc-history-row">
                    <span className="pc-history-date">{fmtDate(m.date)}</span>
                    <div className="pc-history-bar-wrap">
                      <div
                        className="pc-history-bar"
                        style={{
                          width: `${Math.min(100, Math.max(10, ((m.weight - (measures[0].weight * 0.85)) / (measures[0].weight * 0.3)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="pc-history-val">{m.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── foto progressi ── */}
      <div className="pc-photos-section">
        <div className="pc-photos-header">
          <span className="cm-label">Foto progressi — lunedì</span>
          <button className="cm-btn" onClick={() => setShowPhotoForm(s => !s)}>
            {showPhotoForm ? 'Annulla' : '+ Aggiungi foto'}
          </button>
        </div>

        {showPhotoForm && (
          <div className="pc-photo-form">
            <div className="cm-form-row" style={{ alignItems: 'flex-start' }}>
              <div className="cm-form-group" style={{ maxWidth: 150 }}>
                <label className="cm-label">Data (lunedì)</label>
                <input type="date" className="cm-input"
                  value={photoForm.date}
                  onChange={e => setPhotoForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="cm-form-group">
                <label className="cm-label">Frontale</label>
                <div className="pc-upload-thumb" onClick={() => frontRef.current.click()}>
                  {photoForm.front
                    ? <img src={photoForm.front} alt="front" />
                    : <span>+ Foto</span>}
                </div>
                <input ref={frontRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) readFile(f, src => setPhotoForm(p => ({ ...p, front: src }))); e.target.value = ''; }} />
              </div>
              <div className="cm-form-group">
                <label className="cm-label">Laterale</label>
                <div className="pc-upload-thumb" onClick={() => sideRef.current.click()}>
                  {photoForm.side
                    ? <img src={photoForm.side} alt="side" />
                    : <span>+ Foto</span>}
                </div>
                <input ref={sideRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) readFile(f, src => setPhotoForm(p => ({ ...p, side: src }))); e.target.value = ''; }} />
              </div>
              <div className="cm-form-group" style={{ justifyContent: 'flex-end' }}>
                <button className="cm-btn" onClick={addPhotoEntry}>Salva</button>
              </div>
            </div>
          </div>
        )}

        {photos.length === 0 ? (
          <div className="cm-empty">Nessuna foto ancora — aggiungi la prima foto del lunedì</div>
        ) : (
          <div className="pc-timeline">
            {photos.map(p => (
              <div key={p.id} className="pc-week-card">
                <div className="pc-week-date">{fmtDate(p.date)}</div>
                <div className="pc-week-photos">
                  {p.front && (
                    <div className="pc-week-photo">
                      <img src={p.front} alt="frontale" />
                      <span className="pc-photo-label">Front</span>
                    </div>
                  )}
                  {p.side && (
                    <div className="pc-week-photo">
                      <img src={p.side} alt="laterale" />
                      <span className="pc-photo-label">Side</span>
                    </div>
                  )}
                  {!p.front && !p.side && (
                    <div className="pc-photo-placeholder">Nessuna foto</div>
                  )}
                </div>
                <button className="cm-icon-btn pc-remove-btn" onClick={() => removePhoto(p.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
