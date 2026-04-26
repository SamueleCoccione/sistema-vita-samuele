// Sistema di Vita — Dashboard screen
// Daily checkin with score, streaks, and section checks

const CORPO_CHECKS = [
  { k: 'rucking', label: 'Rucking fatto' },
  { k: 'sonno7',  label: 'Sonno 7h+' },
  { k: 'orario',  label: 'Stesso orario di ieri' },
  { k: 'lettura', label: 'Lettura o contenuto costruttivo' },
];
const MONEY_CHECKS = [
  { k: 'outreach',        label: 'Almeno 3 nuovi contatti outreach' },
  { k: 'produttivo',      label: 'Almeno 4 ore su lavoro che genera reddito' },
  { k: 'followup',        label: 'Follow-up su almeno una proposta aperta' },
  { k: 'imparato',        label: 'Ho imparato qualcosa di nuovo sul settore' },
  { k: 'no_lavori_bassi', label: 'Ho evitato lavori sotto i 500€' },
];
const RELAZIONI_CHECKS = [
  { k: 'gesto',     label: 'Gesto concreto per la compagna' },
  { k: 'ascolto',   label: 'Ho ascoltato senza telefono' },
  { k: 'familiare', label: 'Contattato un familiare' },
  { k: 'tribu',     label: 'Follow-up con qualcuno della tribù' },
];
const LIBERTA_CHECKS = [
  { k: 'tempo_me',    label: 'Almeno 30 min solo per me' },
  { k: 'no_scroll',   label: 'Ho evitato scroll passivo > 30 min' },
  { k: 'progetto',    label: 'Ho lavorato su un progetto personale' },
  { k: 'aria_aperta', label: 'Sono uscito o respirato aria aperta' },
];

const TOTAL = CORPO_CHECKS.length + MONEY_CHECKS.length + RELAZIONI_CHECKS.length + LIBERTA_CHECKS.length;

const DEMO_ENTRY = {
  corpo:     { rucking: true, sonno7: true, orario: false, lettura: false },
  money:     { outreach: true, produttivo: true, followup: false, imparato: true, no_lavori_bassi: true },
  relazioni: { gesto: false, ascolto: true, familiare: false, tribu: false },
  liberta:   { tempo_me: true, no_scroll: false, progetto: false, aria_aperta: true },
};

function countDone(obj, checks) {
  return checks.filter(c => !!obj?.[c.k]).length;
}

function globalScore(entry) {
  const done = countDone(entry.corpo, CORPO_CHECKS)
    + countDone(entry.money, MONEY_CHECKS)
    + countDone(entry.relazioni, RELAZIONI_CHECKS)
    + countDone(entry.liberta, LIBERTA_CHECKS);
  return Math.round((done / TOTAL) * 100) / 10;
}

function sectionStatus(done, total, greenAt, yellowAt) {
  if (done >= greenAt)  return 'green';
  if (done >= yellowAt) return 'yellow';
  return 'red';
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Buongiorno';
  if (h >= 12 && h < 18) return 'Buon pomeriggio';
  if (h >= 18 && h < 23) return 'Buona sera';
  return 'Buonanotte';
}

function fmtDate() {
  return new Date().toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ── Sub-components ──

// Inject check animation styles once
if (!document.getElementById('sv-check-styles')) {
  const s = document.createElement('style');
  s.id = 'sv-check-styles';
  s.textContent = `
    @keyframes sv-pop {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.78); }
      70%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    @keyframes sv-check-in {
      0%   { opacity:0; transform: scale(0.2) rotate(-15deg); }
      60%  { opacity:1; transform: scale(1.2) rotate(4deg); }
      100% { opacity:1; transform: scale(1) rotate(0deg); }
    }
    @keyframes sv-ripple {
      0%   { transform: scale(0.6); opacity: 0.5; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .sv-check-box { position:relative; overflow:visible !important; }
    .sv-check-mark { animation: sv-check-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .sv-check-pop  { animation: sv-pop 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .sv-ripple-ring {
      position:absolute; inset:-4px;
      border-radius:50%;
      border: 2px solid rgba(200,245,100,0.6);
      animation: sv-ripple 0.4s ease-out forwards;
      pointer-events:none;
    }
  `;
  document.head.appendChild(s);
}

function CheckRow({ label, checked, badge, onToggle }) {
  const [hover, setHover] = React.useState(false);
  const [animKey, setAnimKey] = React.useState(0);
  const [showRipple, setShowRipple] = React.useState(false);

  const handleClick = () => {
    setAnimKey(k => k + 1);
    if (!checked) setShowRipple(true);
    setTimeout(() => setShowRipple(false), 450);
    onToggle();
  };

  return React.createElement('div', {
    onClick: handleClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '11px 8px', cursor: 'pointer',
      borderBottom: '1px solid #d4d0c8',
      background: checked ? 'rgba(200,245,100,0.10)' : hover ? 'rgba(0,0,0,0.02)' : 'transparent',
      transition: 'background 0.15s',
      userSelect: 'none',
    }
  },
    // Checkbox
    React.createElement('span', {
      key: animKey,
      className: 'sv-check-box' + (animKey > 0 ? ' sv-check-pop' : ''),
      style: {
        width: '22px', height: '22px', flexShrink: 0,
        borderRadius: '6px',
        border: `1.5px solid ${checked ? '#c8f564' : hover ? '#b0ac9f' : '#d4d0c8'}`,
        background: checked ? '#c8f564' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: checked ? '0 0 0 3px rgba(200,245,100,0.25)' : hover ? '0 0 0 3px rgba(200,245,100,0.12)' : 'none',
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
      }
    },
      showRipple && React.createElement('span', { className: 'sv-ripple-ring' }),
      checked
        ? React.createElement('svg', {
            className: 'sv-check-mark',
            width: '12', height: '9', viewBox: '0 0 12 9', fill: 'none'
          },
            React.createElement('path', {
              d: 'M1 4L4.5 7.5L11 1',
              stroke: '#1a1a1a', strokeWidth: '1.8',
              strokeLinecap: 'round', strokeLinejoin: 'round'
            })
          )
        : React.createElement('span', {
            style: {
              width: '7px', height: '7px', borderRadius: '50%',
              border: '1.5px solid #d4d0c8',
              transition: 'border-color 0.15s',
            }
          })
    ),
    // Label
    React.createElement('span', {
      style: {
        fontSize: '13px', flex: 1,
        color: checked ? '#1a1a1a' : '#6e6a62',
        fontWeight: checked ? '500' : '400',
        transition: 'color 0.15s',
      }
    }, label),
    badge && React.createElement('span', {
      style: {
        fontSize: '9px', fontWeight: '800', letterSpacing: '0.08em',
        background: '#c8f564', color: '#1a1a1a',
        padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
      }
    }, badge)
  );
}

function SectionCard({ title, done, total, status, streak, streakLabel, alert, children }) {
  const borderColor = status === 'green' ? '#5aaa3a' : status === 'yellow' ? '#d4a820' : '#b94040';
  const badgeBg = status === 'green' ? 'rgba(90,170,58,0.12)' : status === 'yellow' ? 'rgba(212,168,32,0.12)' : 'rgba(185,64,64,0.08)';
  const badgeColor = status === 'green' ? '#3a7a1a' : status === 'yellow' ? '#7a5800' : '#b94040';

  return React.createElement('div', {
    style: {
      border: '1px solid #d4d0c8',
      borderTopWidth: '3px',
      borderTopColor: borderColor,
      background: '#f5f3ef',
      marginBottom: '12px',
    }
  },
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 12px', borderBottom: '1px solid #d4d0c8', gap: '12px',
      }
    },
      React.createElement('span', {
        style: { fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a' }
      }, title),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
        streak > 0 && React.createElement('span', {
          style: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: '#6e6a62', border: '1px solid #d4d0c8', padding: '2px 8px' }
        }, `${streak}g ${streakLabel}`),
        React.createElement('span', {
          style: {
            fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em',
            padding: '3px 10px', border: `1px solid ${borderColor}`,
            background: badgeBg, color: badgeColor,
          }
        }, `${done}/${total}`)
      )
    ),
    alert && React.createElement('div', {
      style: {
        fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em',
        color: '#b94040', background: 'rgba(185,64,64,0.05)',
        borderBottom: '1px solid rgba(185,64,64,0.15)', padding: '8px 18px',
      }
    }, alert),
    React.createElement('div', {
      style: { padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }
    }, children)
  );
}

// ── Main Dashboard ──
function DashboardScreen() {
  const [entry, setEntry] = React.useState(DEMO_ENTRY);

  const toggle = (section, key) =>
    setEntry(e => ({ ...e, [section]: { ...e[section], [key]: !e[section]?.[key] } }));

  const score = globalScore(entry);
  const scoreColor = score >= 8 ? '#c8f564' : score >= 5 ? '#f0d060' : '#e07070';

  const corpoDone     = countDone(entry.corpo, CORPO_CHECKS);
  const moneyDone     = countDone(entry.money, MONEY_CHECKS);
  const relazioniDone = countDone(entry.relazioni, RELAZIONI_CHECKS);
  const libertaDone   = countDone(entry.liberta, LIBERTA_CHECKS);

  return React.createElement('div', {
    style: { maxWidth: '800px', margin: '0 auto', padding: '32px 24px 80px' }
  },
    // Header
    React.createElement('div', {
      style: {
        border: '1px solid #b0ac9f', background: '#1a1a1a',
        padding: '24px 28px 20px', marginBottom: '20px', color: '#fff',
      }
    },
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }
      },
        React.createElement('div', null,
          React.createElement('div', {
            style: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }
          }, fmtDate()),
          React.createElement('div', {
            style: { fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.1' }
          }, `${greeting()}, Samuele`)
        ),
        React.createElement('div', { style: { textAlign: 'right' } },
          React.createElement('div', {
            style: { fontSize: '48px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', color: scoreColor }
          }, `${score.toFixed(1)}`, React.createElement('span', {
            style: { fontSize: '18px', fontWeight: '400', opacity: '0.6' }
          }, '/10')),
          React.createElement('div', {
            style: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }
          }, 'punteggio giornaliero')
        )
      ),
      // Streak row
      React.createElement('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '16px',
        }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '6px' } },
          React.createElement('span', { style: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#c8f564', lineHeight: '1' } }, '7'),
          React.createElement('span', { style: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' } }, 'streak attuale')
        ),
        React.createElement('div', { style: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '6px' } },
          React.createElement('span', { style: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#c8f564', lineHeight: '1' } }, '14'),
          React.createElement('span', { style: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' } }, 'record personale')
        ),
        React.createElement('span', {
          style: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', marginLeft: 'auto' }
        }, 'giorni consecutivi con score ≥ 6/10')
      )
    ),

    // Sections
    React.createElement(SectionCard, {
      title: 'Corpo & Mente', done: corpoDone, total: CORPO_CHECKS.length,
      status: sectionStatus(corpoDone, 4, 4, 2), streak: 12, streakLabel: 'rucking',
    },
      CORPO_CHECKS.map(c => React.createElement(CheckRow, {
        key: c.k, label: c.label,
        checked: !!entry.corpo?.[c.k],
        badge: c.k === 'rucking' ? '12g' : null,
        onToggle: () => toggle('corpo', c.k),
      }))
    ),

    React.createElement(SectionCard, {
      title: 'Money & Lavoro', done: moneyDone, total: MONEY_CHECKS.length,
      status: sectionStatus(moneyDone, 5, 5, 3),
      alert: !entry.money?.outreach ? 'Nessun contatto oggi. I clienti non arrivano da soli.' : null,
    },
      MONEY_CHECKS.map(c => React.createElement(CheckRow, {
        key: c.k, label: c.label,
        checked: !!entry.money?.[c.k],
        onToggle: () => toggle('money', c.k),
      }))
    ),

    React.createElement(SectionCard, {
      title: 'Relazioni', done: relazioniDone, total: RELAZIONI_CHECKS.length,
      status: sectionStatus(relazioniDone, 4, 4, 2),
      alert: !entry.relazioni?.gesto ? 'Nessun gesto oggi. Lei conta.' : null,
    },
      RELAZIONI_CHECKS.map(c => React.createElement(CheckRow, {
        key: c.k, label: c.label,
        checked: !!entry.relazioni?.[c.k],
        onToggle: () => toggle('relazioni', c.k),
      }))
    ),

    React.createElement(SectionCard, {
      title: 'Libertà', done: libertaDone, total: LIBERTA_CHECKS.length,
      status: sectionStatus(libertaDone, 4, 4, 2),
    },
      LIBERTA_CHECKS.map(c => React.createElement(CheckRow, {
        key: c.k, label: c.label,
        checked: !!entry.liberta?.[c.k],
        onToggle: () => toggle('liberta', c.k),
      }))
    )
  );
}

Object.assign(window, { DashboardScreen });
