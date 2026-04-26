import { useState, useMemo, useEffect } from 'react';
import './Dashboard.css';
import { useFirebaseState } from '../hooks/useFirebaseState';
import { migrationDone, migrateFromLocalStorage } from '../utils/migrateLocalStorage';

const KEY = 'dash_daily_v2';

/* ── Check definitions ─────────────────────────────────────────── */
const CORPO_CHECKS = [
  { k: 'sveglia',   label: 'Sveglia presto'                   },
  { k: 'sonno7',    label: 'Sonno 7h+'                        },
  { k: 'colazione', label: 'Colazione'                        },
  { k: 'lettura',   label: 'Lettura o contenuto costruttivo'  },
  { k: 'rucking',   label: 'Rucking'                          },
  { k: 'igiene',    label: 'Igiene personale'                 },
  { k: 'vestirsi',  label: 'Vestirsi'                         },
  { k: 'casa',      label: 'Cura della casa'                  },
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

function groupByMonth(entries) {
  const months = {};
  entries.forEach(e => {
    const mk = e.date.slice(0, 7);
    if (!months[mk]) months[mk] = [];
    months[mk].push(e);
  });
  return Object.entries(months)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mk, es]) => [mk, es.slice().sort((a, b) => b.date.localeCompare(a.date))]);
}

function fmtMonth(mk) {
  const [y, m] = mk.split('-');
  const s = new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDayLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' });
}

const EMPTY = {
  date:      today(),
  corpo:     { sveglia: false, sonno7: false, colazione: false, lettura: false, rucking: false, igiene: false, vestirsi: false, casa: false, ore: '', qualita: '' },
  money:     { outreach: false, produttivo: false, followup: false, imparato: false, no_lavori_bassi: false },
  relazioni: { gesto: false, ascolto: false, familiare: false, tribu: false },
  liberta:   { tempo_me: false, no_scroll: false, progetto: false, aria_aperta: false },
};

/* ── Component ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const [showMigration, setShowMigration] = useState(!migrationDone());
  const [migrating,     setMigrating]     = useState(false);
  const [migrLog,       setMigrLog]       = useState('');

  const runMigration = async () => {
    setMigrating(true);
    setMigrLog('Migrazione in corso…');
    try {
      const res = await migrateFromLocalStorage((key, done, total) =>
        setMigrLog(`${done}/${total} — ${key}`)
      );
      setMigrLog(`✓ Migrati ${res.migrated} valori da localStorage a Firebase`);
      setTimeout(() => setShowMigration(false), 2500);
    } catch (err) {
      setMigrLog(`Errore: ${err.message}`);
      setMigrating(false);
    }
  };

  const [allEntries, setAllEntries, allLoaded] = useFirebaseState(KEY, []);
  const td = today();
  const [entry, setEntry] = useState({ ...EMPTY });

  useEffect(() => {
    if (!allLoaded) return;
    const storedToday = allEntries.find(e => e.date === td);
    if (storedToday) setEntry({ ...EMPTY, ...storedToday });
  }, [allLoaded]);

  const persist = (next) => {
    setEntry(next);
    const exists = allEntries.find(e => e.date === td);
    const updated = exists
      ? allEntries.map(e => e.date === td ? next : e)
      : [...allEntries, next];
    setAllEntries(updated);
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

      {/* ── MIGRATION BANNER (one-time) */}
      {showMigration && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>
            {migrLog || 'Dati esistenti in localStorage trovati — migra su Firebase per sincronizzarli su tutti i dispositivi.'}
          </span>
          {!migrating && !migrLog.startsWith('✓') && (
            <button className="cm-btn" style={{ fontSize: 12 }} onClick={runMigration}>
              Migra dati da localStorage
            </button>
          )}
          {!migrating && (
            <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11 }} onClick={() => {
              localStorage.setItem('sv_migrated_v1', '1');
              setShowMigration(false);
            }}>
              Salta
            </button>
          )}
        </div>
      )}

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
        status={sectionStatus(corpoDone, 8, 7, 4)}
      >
        {CORPO_CHECKS.flatMap(c => {
          const check = (
            <Check
              key={c.k}
              label={c.label}
              checked={!!entry.corpo?.[c.k]}
              onClick={() => toggle('corpo', c.k)}
              badge={c.k === 'rucking' && ruckingStreak > 0 ? `${ruckingStreak}g` : null}
            />
          );
          if (c.k !== 'sonno7') return [check];
          return [
            check,
            <div key="sleep-detail" className="db-sleep-row">
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
                >{q}</button>
              ))}
            </div>,
          ];
        })}
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

      <StatsPanel entries={allWithToday} />
      <HistoryPanel entries={allWithToday} />

    </div>
  );
}

/* ── StatsPanel ─────────────────────────────────────────────────── */
function StatsPanel({ entries }) {
  if (entries.length === 0) return null;
  const avg = entries.reduce((s, e) => s + globalScore(e), 0) / entries.length;
  const areaAvg = (checks, section) =>
    Math.round(entries.reduce((s, e) => s + sectionDone(e[section], checks) / checks.length, 0) / entries.length * 100);
  const avgColor = avg >= 8 ? 'green' : avg >= 5 ? 'yellow' : 'red';
  const areas = [
    { label: 'Corpo & Mente',   pct: areaAvg(CORPO_CHECKS,     'corpo'),     color: 'var(--chart-blue)'   },
    { label: 'Money & Lavoro',  pct: areaAvg(MONEY_CHECKS,     'money'),     color: 'var(--score-yellow)' },
    { label: 'Relazioni',       pct: areaAvg(RELAZIONI_CHECKS, 'relazioni'), color: '#c8a0e0'              },
    { label: 'Libertà',         pct: areaAvg(LIBERTA_CHECKS,   'liberta'),   color: 'var(--chart-orange)' },
  ];
  return (
    <div className="db-stats-panel">
      <div className="db-stats-head">
        <span className="db-stats-title">Statistiche</span>
        <span className="db-stats-meta">{entries.length} {entries.length === 1 ? 'giornata' : 'giornate'} tracciate</span>
      </div>
      <div className="db-stats-avg-row">
        <span className={`db-stats-avg-num db-stats-avg-${avgColor}`}>{avg.toFixed(1)}</span>
        <span className="db-stats-avg-den">/10</span>
        <span className="db-stats-avg-lbl">media globale</span>
      </div>
      <div className="db-stats-areas">
        {areas.map(a => (
          <div key={a.label} className="db-stats-area">
            <span className="db-stats-area-lbl">{a.label}</span>
            <div className="db-stats-area-bar">
              <div className="db-stats-area-fill" style={{ width: `${a.pct}%`, background: a.color }} />
            </div>
            <span className="db-stats-area-pct">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── HistoryPanel ────────────────────────────────────────────────── */
function HistoryPanel({ entries }) {
  const months     = groupByMonth(entries);
  const currentMk  = new Date().toISOString().slice(0, 7);
  const td         = new Date().toISOString().split('T')[0];
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMk]));
  const [openDays,   setOpenDays]   = useState(new Set());

  if (entries.length === 0) return null;

  const toggleMonth = mk => setOpenMonths(s => { const n = new Set(s); n.has(mk) ? n.delete(mk) : n.add(mk); return n; });
  const toggleDay   = dk => setOpenDays(s => { const n = new Set(s); n.has(dk) ? n.delete(dk) : n.add(dk); return n; });

  return (
    <div className="db-history">
      <div className="db-history-hd">Storico</div>
      <div className="db-hist-months">
        {months.map(([mk, es]) => {
          const isOpen    = openMonths.has(mk);
          const monthAvg  = es.reduce((s, e) => s + globalScore(e), 0) / es.length;
          const isCurrent = mk === currentMk;
          return (
            <div key={mk} className="db-hist-month">
              <button className={`db-hist-month-head${isOpen ? ' open' : ''}`} onClick={() => toggleMonth(mk)}>
                <span className="db-hist-month-lbl">{fmtMonth(mk)}</span>
                {isCurrent && <span className="db-hist-cur">in corso</span>}
                <span className="db-hist-month-cnt">{es.length}g</span>
                <span className="db-hist-month-avg">{monthAvg.toFixed(1)}/10</span>
                <span className="db-hist-chev">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="db-hist-days">
                  {es.map(e => {
                    const score      = globalScore(e);
                    const scoreColor = score >= 8 ? 'green' : score >= 5 ? 'yellow' : 'red';
                    const isToday    = e.date === td;
                    const isDayOpen  = openDays.has(e.date);
                    const areaFracs  = [
                      { pct: sectionDone(e.corpo,     CORPO_CHECKS)     / CORPO_CHECKS.length,     color: 'var(--chart-blue)'   },
                      { pct: sectionDone(e.money,     MONEY_CHECKS)     / MONEY_CHECKS.length,     color: 'var(--score-yellow)' },
                      { pct: sectionDone(e.relazioni, RELAZIONI_CHECKS) / RELAZIONI_CHECKS.length, color: '#c8a0e0'              },
                      { pct: sectionDone(e.liberta,   LIBERTA_CHECKS)   / LIBERTA_CHECKS.length,   color: 'var(--chart-orange)' },
                    ];
                    return (
                      <div key={e.date} className={`db-hist-day${isDayOpen ? ' open' : ''}`}>
                        <div className="db-hist-day-head" onClick={() => toggleDay(e.date)}>
                          <span className="db-hist-day-lbl">
                            {isToday ? 'Oggi' : fmtDayLabel(e.date)}
                          </span>
                          <span className={`db-hist-score db-hist-score-${scoreColor}`}>{score.toFixed(1)}</span>
                          <div className="db-hist-bars">
                            {areaFracs.map((a, i) => (
                              <div key={i} className="db-hist-bar-wrap">
                                <div className="db-hist-bar-fill" style={{ height: `${a.pct * 100}%`, background: a.color }} />
                              </div>
                            ))}
                          </div>
                          <span className="db-hist-chev">{isDayOpen ? '▲' : '▼'}</span>
                        </div>
                        {isDayOpen && (
                          <div className="db-hist-day-body">
                            {[
                              { section: 'corpo',     checks: CORPO_CHECKS,     label: 'Corpo & Mente'  },
                              { section: 'money',     checks: MONEY_CHECKS,     label: 'Money & Lavoro' },
                              { section: 'relazioni', checks: RELAZIONI_CHECKS, label: 'Relazioni'      },
                              { section: 'liberta',   checks: LIBERTA_CHECKS,   label: 'Libertà'        },
                            ].map(({ section, checks, label }) => (
                              <div key={section} className="db-hist-area-block">
                                <div className="db-hist-area-title">{label}</div>
                                {checks.map(c => (
                                  <div key={c.k} className={`db-hist-chk${e[section]?.[c.k] ? ' on' : ''}`}>
                                    <span className="db-hist-chk-dot" />
                                    <span>{c.label}</span>
                                  </div>
                                ))}
                                {section === 'corpo' && (e.corpo?.ore || e.corpo?.qualita) && (
                                  <div className="db-hist-sleep">
                                    {e.corpo.ore && <span>{e.corpo.ore}h sonno</span>}
                                    {e.corpo.qualita && (
                                      <span className={`db-hist-qual db-hist-qual-${e.corpo.qualita}`}>
                                        {e.corpo.qualita}
                                      </span>
                                    )}
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
            </div>
          );
        })}
      </div>
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
      <span className="db-check-box">
        <span className="db-check-circle" />
        <svg className="db-check-mark" width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="db-check-lbl">{label}</span>
      {badge && <span className="db-check-badge">{badge}</span>}
    </div>
  );
}
