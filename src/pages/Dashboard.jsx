import { useState, useMemo } from 'react';
import './Dashboard.css';

const KEY = 'dash_daily_v2';

/* ── Check definitions ─────────────────────────────────────────── */
const CORPO_CHECKS = [
  { k: 'rucking', label: 'Rucking fatto'                        },
  { k: 'sonno7',  label: 'Sonno 7h+'                            },
  { k: 'orario',  label: 'Stesso orario di ieri'                },
  { k: 'lettura', label: 'Lettura o contenuto costruttivo'      },
];

const MONEY_CHECKS = [
  { k: 'outreach',        label: 'Almeno 3 nuovi contatti outreach'           },
  { k: 'produttivo',      label: 'Almeno 4 ore su lavoro che genera reddito'  },
  { k: 'followup',        label: 'Follow-up su almeno una proposta aperta'    },
  { k: 'imparato',        label: 'Ho imparato qualcosa di nuovo sul settore'  },
  { k: 'no_lavori_bassi', label: 'Ho evitato lavori sotto i 500€'             },
];

const RELAZIONI_CHECKS = [
  { k: 'gesto',     label: 'Gesto concreto per la compagna'    },
  { k: 'ascolto',   label: 'Ho ascoltato senza telefono'        },
  { k: 'familiare', label: 'Contattato un familiare'            },
  { k: 'tribu',     label: 'Follow-up con qualcuno della tribù' },
];

const LIBERTA_CHECKS = [
  { k: 'tempo_me',    label: 'Almeno 30 min solo per me'            },
  { k: 'no_scroll',   label: 'Ho evitato scroll passivo > 30 min'   },
  { k: 'progetto',    label: 'Ho lavorato su un progetto personale'  },
  { k: 'aria_aperta', label: 'Sono uscito o respirato aria aperta'   },
];

const TOTAL_CHECKS = CORPO_CHECKS.length + MONEY_CHECKS.length + RELAZIONI_CHECKS.length + LIBERTA_CHECKS.length;

/* ── Helpers ────────────────────────────────────────────────────── */
function today() { return new Date().toISOString().split('T')[0]; }

function greeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Buongiorno';
  if (h >= 12 && h < 18) return 'Buon pomeriggio';
  if (h >= 18 && h < 23) return 'Buona sera';
  return 'Buonanotte';
}

function fmtDateFull() {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function sectionDone(data, checks) {
  return checks.filter(c => !!data?.[c.k]).length;
}

function globalScore(entry) {
  if (!entry) return 0;
  const done =
    sectionDone(entry.corpo,     CORPO_CHECKS)     +
    sectionDone(entry.money,     MONEY_CHECKS)     +
    sectionDone(entry.relazioni, RELAZIONI_CHECKS) +
    sectionDone(entry.liberta,   LIBERTA_CHECKS);
  return Math.round((done / TOTAL_CHECKS) * 100) / 10;
}

function sectionStatus(done, total, greenAt, yellowAt) {
  if (done >= greenAt)  return 'green';
  if (done >= yellowAt) return 'yellow';
  return 'red';
}

function calcCurrentStreak(allEntries, minScore) {
  const byDate = Object.fromEntries(allEntries.map(e => [e.date, e]));
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0];
    const e   = byDate[key];
    if (e && globalScore(e) >= minScore) { count++; d.setDate(d.getDate() - 1); }
    else if (i === 0)                    { d.setDate(d.getDate() - 1); }
    else break;
  }
  return count;
}

function calcBestStreak(allEntries, minScore) {
  const qualified = allEntries.filter(e => globalScore(e) >= minScore)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!qualified.length) return 0;
  let best = 1, curr = 1;
  for (let i = 1; i < qualified.length; i++) {
    const diff = Math.floor((new Date(qualified[i].date) - new Date(qualified[i-1].date)) / 86400000);
    if (diff === 1) { curr++; if (curr > best) best = curr; }
    else curr = 1;
  }
  return best;
}

function calcKeyStreak(allEntries, section, key) {
  const byDate = Object.fromEntries(allEntries.map(e => [e.date, e]));
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = d.toISOString().split('T')[0];
    const e = byDate[k];
    if (e?.[section]?.[key]) { count++; d.setDate(d.getDate() - 1); }
    else if (i === 0)        { d.setDate(d.getDate() - 1); }
    else break;
  }
  return count;
}

function calcSectionStreak(allEntries, checks, section) {
  const byDate = Object.fromEntries(allEntries.map(e => [e.date, e]));
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = d.toISOString().split('T')[0];
    const e = byDate[k];
    if (e && sectionDone(e[section], checks) === checks.length) {
      count++; d.setDate(d.getDate() - 1);
    } else if (i === 0) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return count;
}

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

const EMPTY = {
  date:      today(),
  corpo:     { rucking: false, sonno7: false, orario: false, lettura: false, ore: '', qualita: '' },
  money:     { outreach: false, produttivo: false, followup: false, imparato: false, no_lavori_bassi: false },
  relazioni: { gesto: false, ascolto: false, familiare: false, tribu: false },
  liberta:   { tempo_me: false, no_scroll: false, progetto: false, aria_aperta: false },
};

/* ── Component ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const [allEntries, setAllEntries] = useState(load);
  const td          = today();
  const storedToday = allEntries.find(e => e.date === td);
  const [entry, setEntry] = useState(storedToday ? { ...EMPTY, ...storedToday } : { ...EMPTY });

  const persist = (next) => {
    setEntry(next);
    const updated = storedToday
      ? allEntries.map(e => e.date === td ? next : e)
      : [...allEntries, next];
    setAllEntries(updated);
    localStorage.setItem(KEY, JSON.stringify(updated));
  };

  const toggle = (section, key) =>
    persist({ ...entry, [section]: { ...entry[section], [key]: !entry[section]?.[key] } });

  const setSleep = (field, val) =>
    persist({ ...entry, corpo: { ...entry.corpo, [field]: val } });

  /* computed */
  const allWithToday = useMemo(() => {
    const base = allEntries.filter(e => e.date !== td);
    return [...base, entry];
  }, [allEntries, entry, td]);

  const score         = useMemo(() => globalScore(entry), [entry]);
  const scoreColor    = score >= 8 ? 'green' : score >= 5 ? 'yellow' : 'red';
  const currentStreak = useMemo(() => calcCurrentStreak(allWithToday, 6), [allWithToday]);
  const bestStreak    = useMemo(() => Math.max(calcBestStreak(allWithToday, 6), currentStreak), [allWithToday, currentStreak]);

  const ruckingStreak   = useMemo(() => calcKeyStreak(allWithToday, 'corpo', 'rucking'),           [allWithToday]);
  const gestoStreak     = useMemo(() => calcKeyStreak(allWithToday, 'relazioni', 'gesto'),          [allWithToday]);
  const moneyStreak     = useMemo(() => calcSectionStreak(allWithToday, MONEY_CHECKS, 'money'),     [allWithToday]);
  const relazioniStreak = useMemo(() => calcSectionStreak(allWithToday, RELAZIONI_CHECKS, 'relazioni'), [allWithToday]);

  const corpoDone     = sectionDone(entry.corpo,     CORPO_CHECKS);
  const moneyDone     = sectionDone(entry.money,     MONEY_CHECKS);
  const relazioniDone = sectionDone(entry.relazioni, RELAZIONI_CHECKS);
  const libertaDone   = sectionDone(entry.liberta,   LIBERTA_CHECKS);

  return (
    <div className="db-page">

      {/* ── HEADER */}
      <div className="db-header">
        <div className="db-header-main">
          <div>
            <div className="db-date">{fmtDateFull()}</div>
            <div className="db-greeting">{greeting()}, Samuele</div>
          </div>
          <div className="db-score-wrap">
            <div className={`db-score db-score-${scoreColor}`}>
              {score.toFixed(1)}<span className="db-score-den">/10</span>
            </div>
            <div className="db-score-lbl">punteggio giornaliero</div>
          </div>
        </div>
        <div className="db-streak-row">
          <div className="db-streak-item">
            <span className="db-streak-val">{currentStreak}</span>
            <span className="db-streak-lbl">streak attuale</span>
          </div>
          <div className="db-streak-sep" />
          <div className="db-streak-item">
            <span className="db-streak-val">{bestStreak}</span>
            <span className="db-streak-lbl">record personale</span>
          </div>
          <span className="db-streak-hint">giorni consecutivi con score ≥ 6/10</span>
        </div>
      </div>

      {/* ── SEZIONE 1 — CORPO & MENTE */}
      <Section
        title="Corpo & Mente"
        done={corpoDone}
        total={CORPO_CHECKS.length}
        status={sectionStatus(corpoDone, 4, 4, 2)}
      >
        {CORPO_CHECKS.map(c => (
          <Check
            key={c.k}
            label={c.label}
            checked={!!entry.corpo?.[c.k]}
            onClick={() => toggle('corpo', c.k)}
            badge={c.k === 'rucking' && ruckingStreak > 0 ? `${ruckingStreak}g` : null}
          />
        ))}
        <div className="db-sleep-row">
          <span className="db-sleep-lbl">Sonno</span>
          <input
            type="number"
            className="db-sleep-input"
            value={entry.corpo?.ore ?? ''}
            onChange={e => setSleep('ore', e.target.value)}
            placeholder="h"
            min="0"
            max="14"
            step="0.5"
          />
          <span className="db-sleep-unit">ore</span>
          {['fresco', 'normale', 'stanco'].map(q => (
            <button
              key={q}
              className={`db-qual-btn${entry.corpo?.qualita === q ? ' db-qual-' + q : ''}`}
              onClick={() => setSleep('qualita', entry.corpo?.qualita === q ? '' : q)}
            >
              {q}
            </button>
          ))}
        </div>
      </Section>

      {/* ── SEZIONE 2 — MONEY & LAVORO */}
      <Section
        title="Money & Lavoro"
        done={moneyDone}
        total={MONEY_CHECKS.length}
        status={sectionStatus(moneyDone, 5, 5, 3)}
        streak={moneyStreak}
        streakLabel="giorni completi"
        alert={!entry.money?.outreach ? 'Nessun contatto oggi. I clienti non arrivano da soli.' : null}
      >
        {MONEY_CHECKS.map(c => (
          <Check
            key={c.k}
            label={c.label}
            checked={!!entry.money?.[c.k]}
            onClick={() => toggle('money', c.k)}
          />
        ))}
      </Section>

      {/* ── SEZIONE 3 — RELAZIONI */}
      <Section
        title="Relazioni"
        done={relazioniDone}
        total={RELAZIONI_CHECKS.length}
        status={sectionStatus(relazioniDone, 4, 4, 2)}
        streak={relazioniStreak > 0 ? gestoStreak : 0}
        streakLabel="giorni con gesto"
        alert={!entry.relazioni?.gesto ? 'Nessun gesto oggi. Lei conta.' : null}
      >
        {RELAZIONI_CHECKS.map(c => (
          <Check
            key={c.k}
            label={c.label}
            checked={!!entry.relazioni?.[c.k]}
            onClick={() => toggle('relazioni', c.k)}
          />
        ))}
      </Section>

      {/* ── SEZIONE 4 — LIBERTÀ */}
      <Section
        title="Libertà"
        done={libertaDone}
        total={LIBERTA_CHECKS.length}
        status={sectionStatus(libertaDone, 4, 4, 2)}
      >
        {LIBERTA_CHECKS.map(c => (
          <Check
            key={c.k}
            label={c.label}
            checked={!!entry.liberta?.[c.k]}
            onClick={() => toggle('liberta', c.k)}
          />
        ))}
      </Section>

    </div>
  );
}

/* ── Local sub-components ───────────────────────────────────────── */
function Section({ title, done, total, status, streak, streakLabel, alert, children }) {
  return (
    <div className={`db-card db-card-${status}`}>
      <div className="db-card-head">
        <span className="db-card-title">{title}</span>
        <div className="db-card-meta">
          {streak > 0 && (
            <span className="db-sec-streak">{streak}g {streakLabel}</span>
          )}
          <span className={`db-badge db-badge-${status}`}>{done}/{total}</span>
        </div>
      </div>
      {alert && <div className="db-alert">{alert}</div>}
      <div className="db-checks">{children}</div>
    </div>
  );
}

function Check({ label, checked, onClick, badge }) {
  return (
    <div className={`db-check${checked ? ' on' : ''}`} onClick={onClick}>
      <span className="db-check-box">{checked ? '✓' : '○'}</span>
      <span className="db-check-lbl">{label}</span>
      {badge && <span className="db-check-badge">{badge}</span>}
    </div>
  );
}
