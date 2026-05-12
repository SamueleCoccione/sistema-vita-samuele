import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const TIPI = ['saggio', 'riflessione', 'altro'];
const TEMI = ['uscire dal sistema', 'lettura', 'cinema', 'alimentazione', 'rucking', 'altro'];

const EMPTY_FORM = {
  titolo: '', tipo: 'saggio', tema: 'altro', link: '',
  tempo_impiegato_ore: 1, sentimento_prima: 5, sentimento_dopo: 5, quote_preferita: '',
};

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
}

function SentimentBar({ label, value }) {
  return (
    <div className="mb-sentiment-item">
      <span className="mb-sentiment-num">{value}</span>
      <span className="mb-sentiment-label">{label}</span>
    </div>
  );
}

function Slider7gg({ pub, onSave }) {
  const [val, setVal] = useState(5);
  return (
    <div
      style={{
        marginTop: 10,
        padding: '10px 12px',
        background: 'var(--mb-accent-soft)',
        borderRadius: 8,
        border: '1px solid var(--mb-accent-muted)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--mb-accent)', margin: '0 0 10px', fontStyle: 'italic' }}>
        Come ti senti rispetto a questo pezzo adesso, a {daysSince(pub.date)} giorni?
      </p>
      <div className="mb-slider-wrap">
        <input
          type="range" min={1} max={10}
          className="mb-slider"
          value={val}
          onChange={e => setVal(Number(e.target.value))}
        />
        <span className="mb-slider-val">{val}</span>
      </div>
      <button
        className="mb-btn mb-btn-small"
        style={{ marginTop: 10 }}
        onClick={() => onSave(val)}
      >
        Salva retrospettiva
      </button>
    </div>
  );
}

export default function PubblicazioniDrawer() {
  const [pubs, savePubs]   = useFirebaseState('pd_pubblicazioni', []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(null);

  const entries = Array.isArray(pubs) ? pubs : [];

  const set  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setN = (k) => (e) => setForm(f => ({ ...f, [k]: Number(e.target.value) }));

  const save = () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = { id: Date.now(), date: today, ...form };
    savePubs([entry, ...entries]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const save7gg = (id, val) => {
    savePubs(entries.map(e => e.id === id ? { ...e, 'sentimento_+7gg': val } : e));
  };

  const remove = (id) => savePubs(entries.filter(e => e.id !== id));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <div className="mb-action-bar">
          <span className="mb-section-label" style={{ margin: 0 }}>
            {entries.length} pubblicazion{entries.length !== 1 ? 'i' : 'e'}
          </span>
          <button className="mb-btn mb-btn-small" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Annulla' : '+ Nuova pubblicazione'}
          </button>
        </div>

        {showForm && (
          <div className="mb-form">
            <div className="mb-form-field">
              <label className="mb-form-label">Titolo</label>
              <input className="mb-input" placeholder="Titolo del pezzo" value={form.titolo} onChange={set('titolo')} />
            </div>
            <div className="mb-form-row">
              <div className="mb-form-field">
                <label className="mb-form-label">Tipo</label>
                <select className="mb-select" value={form.tipo} onChange={set('tipo')}>
                  {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-form-field">
                <label className="mb-form-label">Tema</label>
                <select className="mb-select" value={form.tema} onChange={set('tema')}>
                  {TEMI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Link Substack</label>
              <input className="mb-input" type="url" placeholder="https://..." value={form.link} onChange={set('link')} />
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Tempo impiegato — {form.tempo_impiegato_ore} ore</label>
              <div className="mb-slider-wrap">
                <input type="range" min={0.5} max={20} step={0.5} className="mb-slider"
                  value={form.tempo_impiegato_ore} onChange={setN('tempo_impiegato_ore')} />
                <span className="mb-slider-val">{form.tempo_impiegato_ore}h</span>
              </div>
            </div>
            <div className="mb-form-row">
              <div className="mb-form-field">
                <label className="mb-form-label">Sentimento prima — {form.sentimento_prima}/10</label>
                <div className="mb-slider-wrap">
                  <input type="range" min={1} max={10} className="mb-slider"
                    value={form.sentimento_prima} onChange={setN('sentimento_prima')} />
                  <span className="mb-slider-val">{form.sentimento_prima}</span>
                </div>
              </div>
              <div className="mb-form-field">
                <label className="mb-form-label">Sentimento dopo — {form.sentimento_dopo}/10</label>
                <div className="mb-slider-wrap">
                  <input type="range" min={1} max={10} className="mb-slider"
                    value={form.sentimento_dopo} onChange={setN('sentimento_dopo')} />
                  <span className="mb-slider-val">{form.sentimento_dopo}</span>
                </div>
              </div>
            </div>
            <div className="mb-form-field">
              <label className="mb-form-label">Quote preferita</label>
              <textarea className="mb-textarea" placeholder="Una frase del pezzo che ti è venuta bene..." rows={2}
                value={form.quote_preferita} onChange={set('quote_preferita')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mb-btn" onClick={save} disabled={!form.titolo.trim()}>
                Salva pubblicazione
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-dr-section">
        {entries.length === 0 ? (
          <div className="mb-empty">Nessuna pubblicazione ancora. Pubblica il tuo primo pezzo.</div>
        ) : (
          <div className="mb-list">
            {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map(e => {
              const days = daysSince(e.date);
              const needs7gg = days >= 7 && e['sentimento_+7gg'] == null;
              const isOpen   = expanded === e.id;
              return (
                <div key={e.id} className="mb-list-item" style={{ flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="mb-list-item-body">
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className="mb-badge mb-badge--pronta" style={{ background: 'rgba(74,155,110,0.15)', color: 'var(--color-success)' }}>
                          {e.tipo}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
                          {e.tema} · {fmtDate(e.date)}
                        </span>
                      </div>
                      <div
                        className="mb-list-item-title"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(ex => ex === e.id ? null : e.id)}
                      >
                        {e.titolo}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {e.link && (
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--mb-accent)', textDecoration: 'none', padding: '4px 8px', border: '1px solid var(--mb-accent-muted)', borderRadius: 8 }}
                        >
                          ↗
                        </a>
                      )}
                      <button className="mb-delete-btn" onClick={() => remove(e.id)}>×</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-line)' }}>
                      <div className="mb-sentiment-row">
                        <SentimentBar label="Prima" value={e.sentimento_prima} />
                        <SentimentBar label="Dopo" value={e.sentimento_dopo} />
                        {e['sentimento_+7gg'] != null && (
                          <SentimentBar label="+7gg" value={e['sentimento_+7gg']} />
                        )}
                        {e.tempo_impiegato_ore != null && (
                          <SentimentBar label="Ore" value={`${e.tempo_impiegato_ore}h`} />
                        )}
                      </div>
                      {e.quote_preferita && (
                        <blockquote
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: 15,
                            color: 'var(--color-ink)',
                            margin: '12px 0 0',
                            lineHeight: 1.65,
                            borderLeft: '2px solid var(--mb-accent-muted)',
                            paddingLeft: 12,
                          }}
                        >
                          "{e.quote_preferita}"
                        </blockquote>
                      )}
                    </div>
                  )}

                  {needs7gg && (
                    <Slider7gg pub={e} onSave={(val) => save7gg(e.id, val)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
