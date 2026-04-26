import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const XP_KEY = 'lib_xp_log';

const LEVELS = [
  { min: 0,    max: 100,  title: 'Freelance Catena',      color: '#8a8680', text: '#fff' },
  { min: 101,  max: 300,  title: 'Apprendista Remoto',    color: '#4a7ab5', text: '#fff' },
  { min: 301,  max: 600,  title: 'Nomade Aspirante',      color: '#c8a830', text: '#1a1a1a' },
  { min: 601,  max: 1000, title: 'Knowledge Worker',      color: '#9a6ab5', text: '#fff' },
  { min: 1001, max: Infinity, title: 'Location Independent', color: '#c8f564', text: '#1a1a1a' },
];

const XP_POS = [
  { k: 'client_remote',  label: 'Acquisito cliente 100% remoto',        pts: 50 },
  { k: 'week_out',       label: 'Lavorato 1 settimana fuori Milano',    pts: 30 },
  { k: 'corso',          label: 'Completato corso o skill',              pts: 20 },
  { k: 'piattaforma',    label: 'Primo contatto su piattaforma intl.',  pts: 15 },
  { k: 'pubblicato',     label: 'Pubblicato lavoro online',              pts: 10 },
];

const XP_NEG = [
  { k: 'rifiutato',    label: 'Rifiutato opportunità remote per pigrizia', pts: -30 },
  { k: 'client_local', label: 'Accettato cliente locale evitabile',        pts: -20 },
  { k: 'zero_form',    label: 'Settimana zero formazione',                 pts: -10 },
];

function getLevel(total) {
  return LEVELS.find(l => total >= l.min && total <= l.max) || LEVELS[LEVELS.length - 1];
}

function fmtTs(ts) {
  return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function SistemaXP() {
  const [xpLog, setXpLog] = useFirebaseState(XP_KEY, []);
  const [pops, setPops] = useState([]);

  const saveLog = next => setXpLog(next);

  const total = xpLog.reduce((s, e) => s + e.pts, 0);
  const level = getLevel(total);

  const nextLevel = LEVELS.find(l => l.min > total);
  const levelPct  = nextLevel
    ? Math.round(((total - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const addXp = (action, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pop = { id: Date.now(), pts: action.pts, x: rect.left + rect.width / 2, y: rect.top + window.scrollY };
    setPops(prev => [...prev, pop]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== pop.id)), 1200);

    const entry = { id: Date.now(), pts: action.pts, label: action.label, ts: new Date().toISOString() };
    saveLog([entry, ...xpLog].slice(0, 100));
  };

  const removeXpEntry = id => saveLog(xpLog.filter(e => e.id !== id));

  return (
    <div className="lb-xp-wrap">
      {/* Floating pops */}
      {pops.map(pop => (
        <div
          key={pop.id}
          className={`lb-xp-pop ${pop.pts > 0 ? 'lb-xp-pop-pos' : 'lb-xp-pop-neg'}`}
          style={{ left: pop.x, top: pop.y }}
        >
          {pop.pts > 0 ? '+' : ''}{pop.pts} XP
        </div>
      ))}

      {/* Hero */}
      <div className="lb-xp-hero">
        <div className="lb-xp-main">
          <div className="lb-xp-num">{total}</div>
          <div className="lb-xp-num-lbl">punti XP totali</div>
        </div>
        <div>
          <div
            className="lb-level-badge"
            style={{ color: level.text, background: level.color, borderColor: level.color }}
          >
            {level.title}
          </div>
          {nextLevel && (
            <div className="lb-xp-next-lbl">{nextLevel.min - total} XP al prossimo livello</div>
          )}
          {nextLevel && (
            <div className="lb-xp-prog-bar" style={{ marginTop: 8, width: 200 }}>
              <div className="lb-xp-prog-fill" style={{ width: `${levelPct}%`, background: level.color, height: '100%' }} />
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
          <div style={{ marginBottom: 4 }}>Livelli:</div>
          {LEVELS.map(l => (
            <div key={l.title} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
              opacity: total >= l.min ? 1 : 0.35,
            }}>
              <span style={{ width: 8, height: 8, background: l.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: total >= l.min && total <= l.max ? 800 : 400 }}>{l.min}–{l.max === Infinity ? '∞' : l.max}</span>
              <span style={{ fontSize: 10 }}>{l.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Positive actions */}
      <div className="lb-xp-section-lbl">Azioni positive</div>
      <div className="lb-xp-btns">
        {XP_POS.map(a => (
          <button key={a.k} className="lb-xp-btn lb-xp-btn-pos" onClick={e => addXp(a, e)}>
            <span className="lb-xp-pts lb-xp-pts-pos">+{a.pts}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Negative actions */}
      <div className="lb-xp-section-lbl">Azioni negative (da registrare onestamente)</div>
      <div className="lb-xp-btns">
        {XP_NEG.map(a => (
          <button key={a.k} className="lb-xp-btn lb-xp-btn-neg" onClick={e => addXp(a, e)}>
            <span className="lb-xp-pts lb-xp-pts-neg">{a.pts}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Log */}
      {xpLog.length > 0 && (
        <>
          <div className="lb-xp-log-hd">Storico ({xpLog.length} azioni)</div>
          <div className="lb-xp-log">
            {xpLog.slice(0, 20).map(e => (
              <div key={e.id} className="lb-xp-log-row">
                <span className="lb-xp-log-ts">{fmtTs(e.ts)}</span>
                <span className="lb-xp-log-label">{e.label}</span>
                <span className={`lb-xp-log-pts ${e.pts > 0 ? 'lb-xp-pts-pos' : 'lb-xp-pts-neg'}`}>
                  {e.pts > 0 ? '+' : ''}{e.pts}
                </span>
                <button className="cm-icon-btn" style={{ fontSize: 12 }} onClick={() => removeXpEntry(e.id)}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
