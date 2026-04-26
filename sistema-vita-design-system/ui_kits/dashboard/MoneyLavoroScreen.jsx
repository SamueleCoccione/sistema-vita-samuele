// Sistema di Vita — Money & Lavoro screen

const PATRIMONIO_DEMO = {
  circolante: { cash: 1200, bbva: 3400, unicredit: 2100 },
  emergenza: { revolut: 5000, scalable: 8200 },
  investimenti: { obbligazioni: 12000, azioni_crypto: 4500 },
};

const TRANSAZIONI_DEMO = [
  { id: 1, date: '2025-04-24', desc: 'Supermercato Esselunga', cat: 'Food', conto: 'BBVA', importo: -87.40 },
  { id: 2, date: '2025-04-23', desc: 'Cliente web project — acconto', cat: 'Freelance', conto: 'Unicredit', importo: +1500 },
  { id: 3, date: '2025-04-22', desc: 'Bolletta gas', cat: 'Bills', conto: 'BBVA', importo: -62.00 },
  { id: 4, date: '2025-04-21', desc: 'Cena con amici', cat: 'Extra_Drink', conto: 'BBVA', importo: -43.50 },
  { id: 5, date: '2025-04-20', desc: 'Abbonamento Scalable', cat: 'Investimenti', conto: 'Unicredit', importo: -200 },
];

const CRM_DEMO = [
  { id: 1, nome: 'Studio Rossi Arch.', fase: 'Proposta inviata', valore: 3200, data: '2025-04-20' },
  { id: 2, nome: 'TechStartup Milano', fase: 'Primo contatto', valore: 800, data: '2025-04-22' },
  { id: 3, nome: 'Consulting SRL', fase: 'In trattativa', valore: 5500, data: '2025-04-18' },
];

const FASE_STYLE = {
  'Primo contatto': { background: '#ede9e2', color: '#6e6a62', border: '1px solid #d4d0c8' },
  'Proposta inviata': { background: 'rgba(212,168,32,0.12)', color: '#7a5800', border: '1px solid #d4a820' },
  'In trattativa':    { background: 'rgba(90,170,58,0.12)',  color: '#3a7a1a', border: '1px solid #5aaa3a' },
};

const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);

function SectionHead({ title, action }) {
  return React.createElement('div', {
    style: {
      padding: '20px 48px', borderBottom: '1px solid #d4d0c8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }
  },
    React.createElement('span', {
      style: { fontSize: '10px', fontWeight: '800', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6e6a62' }
    }, title),
    action
  );
}

function Btn({ children, ghost, onClick }) {
  const [hover, setHover] = React.useState(false);
  const base = ghost
    ? { background: 'transparent', color: hover ? '#1a1a1a' : '#6e6a62', border: `1px solid ${hover ? '#b0ac9f' : '#d4d0c8'}` }
    : { background: '#c8f564', color: '#1a1a1a', border: 'none' };
  return React.createElement('button', {
    onClick, onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: {
      ...base, padding: '9px 16px', fontSize: '10px', fontWeight: 800,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0, whiteSpace: 'nowrap',
    }
  }, children);
}

function MoneyLavoroScreen() {
  const totale = Object.values(PATRIMONIO_DEMO).flatMap(g => Object.values(g)).reduce((s, v) => s + v, 0);
  const circolante = Object.values(PATRIMONIO_DEMO.circolante).reduce((s, v) => s + v, 0);
  const runway = (circolante / 2000).toFixed(1);

  const GROUPS = [
    { label: 'Circolante', data: PATRIMONIO_DEMO.circolante, color: '#c8f564' },
    { label: 'Fondo Emergenza', data: PATRIMONIO_DEMO.emergenza, color: '#4a7ab5' },
    { label: 'Investimenti', data: PATRIMONIO_DEMO.investimenti, color: '#c87030' },
  ];

  const entrateMese = TRANSAZIONI_DEMO.filter(t => t.importo > 0).reduce((s, t) => s + t.importo, 0);
  const usciteMese  = TRANSAZIONI_DEMO.filter(t => t.importo < 0).reduce((s, t) => s + Math.abs(t.importo), 0);

  return React.createElement('div', {
    style: { background: '#f5f3ef', color: '#1a1a1a', fontFamily: 'system-ui,-apple-system,sans-serif' }
  },

    // Page Hero
    React.createElement('div', {
      style: {
        background: '#2d3a2e', position: 'relative', overflow: 'hidden',
        padding: '72px 48px 60px', borderBottom: '1px solid #1e281f', textAlign: 'center',
      }
    },
      React.createElement('div', {
        style: {
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          opacity: 0.30, mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMDAnIGhlaWdodD0nMjAwJz48ZmlsdGVyIGlkPSdnJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC43MiAwLjc2JyBudW1PY3RhdmVzPSc0JyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PGZlQ29sb3JNYXRyaXggdHlwZT0nc2F0dXJhdGUnIHZhbHVlcz0nMCcvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScyMDAnIGhlaWdodD0nMjAwJyBmaWx0ZXI9J3VybCgjZyknLz48L3N2Zz4=")`,
          backgroundRepeat: 'repeat', backgroundSize: '200px 200px',
        }
      }),
      React.createElement('h1', {
        style: { position: 'relative', zIndex: 2, fontSize: '64px', fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: '0.95', margin: 0 }
      }, 'Money &\nLavoro')
    ),

    // ── PATRIMONIO ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Patrimonio' }),
      React.createElement('div', { style: { padding: '36px 48px' } },
        // Hero stats
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'flex-start', gap: '48px', marginBottom: '32px', flexWrap: 'wrap' }
        },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, 'Patrimonio netto'),
            React.createElement('div', { style: { fontSize: '36px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: '1' } }, eur(totale))
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, 'Circolante'),
            React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: '1' } }, eur(circolante))
          ),
          React.createElement('div', { style: { border: '1px solid #d4d0c8', padding: '16px 20px', background: '#1a1a1a' } },
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' } }, 'Runway'),
            React.createElement('div', { style: { fontSize: '36px', fontWeight: 800, color: '#c8f564', letterSpacing: '-0.03em', lineHeight: '1' } }, runway),
            React.createElement('div', { style: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' } }, `mesi · €2.000/m`)
          )
        ),
        // Breakdown bars
        GROUPS.map(g => {
          const groupTotal = Object.values(g.data).reduce((s, v) => s + v, 0);
          return React.createElement('div', { key: g.label, style: { marginBottom: '16px' } },
            React.createElement('div', {
              style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }
            },
              React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62' } }, g.label),
              React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, color: '#6e6a62' } }, eur(groupTotal))
            ),
            Object.entries(g.data).map(([key, val]) => {
              const pct = totale > 0 ? (val / totale) * 100 : 0;
              return React.createElement('div', {
                key, style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }
              },
                React.createElement('span', { style: { fontSize: '12px', color: '#6e6a62', width: '120px', flexShrink: 0 } }, key.charAt(0).toUpperCase() + key.slice(1)),
                React.createElement('div', { style: { flex: 1, height: '2px', background: '#d4d0c8', position: 'relative', overflow: 'hidden' } },
                  React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: g.color } })
                ),
                React.createElement('span', { style: { fontSize: '11px', color: '#1a1a1a', width: '70px', textAlign: 'right', flexShrink: 0 } }, eur(val))
              );
            })
          );
        })
      )
    ),

    // ── ENTRATE & USCITE ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Entrate & Uscite' }),
      React.createElement('div', { style: { padding: '36px 48px' } },
        React.createElement('div', { style: { display: 'flex', gap: '48px', marginBottom: '28px' } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, 'Entrate aprile'),
            React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#3a7a1a', letterSpacing: '-0.03em', lineHeight: '1' } }, `+${eur(entrateMese)}`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, 'Uscite aprile'),
            React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#b94040', letterSpacing: '-0.03em', lineHeight: '1' } }, `−${eur(usciteMese)}`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, 'Saldo netto'),
            React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: '1' } }, eur(entrateMese - usciteMese))
          )
        ),
        // Transactions table
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
          React.createElement('thead', null,
            React.createElement('tr', null,
              ['Data','Descrizione','Categoria','Conto','Importo'].map(h =>
                React.createElement('th', {
                  key: h,
                  style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6e6a62', padding: '0 0 8px', textAlign: 'left', borderBottom: '1px solid #d4d0c8' }
                }, h)
              )
            )
          ),
          React.createElement('tbody', null,
            TRANSAZIONI_DEMO.map(t =>
              React.createElement('tr', { key: t.id },
                React.createElement('td', { style: { fontSize: '12px', color: '#6e6a62', padding: '10px 0', borderBottom: '1px solid #d4d0c8' } },
                  new Date(t.date).toLocaleDateString('it-IT', { day:'numeric', month:'short' })
                ),
                React.createElement('td', { style: { fontSize: '13px', color: '#1a1a1a', padding: '10px 0', borderBottom: '1px solid #d4d0c8', fontWeight: 500 } }, t.desc),
                React.createElement('td', { style: { fontSize: '11px', color: '#6e6a62', padding: '10px 0', borderBottom: '1px solid #d4d0c8' } }, t.cat),
                React.createElement('td', { style: { fontSize: '11px', color: '#6e6a62', padding: '10px 0', borderBottom: '1px solid #d4d0c8' } }, t.conto),
                React.createElement('td', {
                  style: {
                    fontSize: '13px', fontWeight: 700, padding: '10px 0', borderBottom: '1px solid #d4d0c8',
                    color: t.importo > 0 ? '#3a7a1a' : '#b94040',
                  }
                }, t.importo > 0 ? `+${eur(t.importo)}` : `−${eur(Math.abs(t.importo))}`)
              )
            )
          )
        )
      )
    ),

    // ── CRM ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Ricerca Clienti & Outreach' }),
      React.createElement('div', { style: { padding: '36px 48px' } },
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
          React.createElement('thead', null,
            React.createElement('tr', null,
              ['Cliente','Fase','Valore','Ultimo contatto'].map(h =>
                React.createElement('th', { key: h, style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6e6a62', padding: '0 0 8px', textAlign: 'left', borderBottom: '1px solid #d4d0c8' } }, h)
              )
            )
          ),
          React.createElement('tbody', null,
            CRM_DEMO.map(c =>
              React.createElement('tr', { key: c.id },
                React.createElement('td', { style: { fontSize: '13px', color: '#1a1a1a', padding: '12px 0', borderBottom: '1px solid #d4d0c8', fontWeight: 500 } }, c.nome),
                React.createElement('td', { style: { padding: '12px 0', borderBottom: '1px solid #d4d0c8' } },
                  React.createElement('span', {
                    style: { fontSize: '9px', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', padding: '3px 8px', whiteSpace: 'nowrap', ...FASE_STYLE[c.fase] }
                  }, c.fase)
                ),
                React.createElement('td', { style: { fontSize: '13px', fontWeight: 700, color: '#1a1a1a', padding: '12px 0', borderBottom: '1px solid #d4d0c8' } }, eur(c.valore)),
                React.createElement('td', { style: { fontSize: '12px', color: '#6e6a62', padding: '12px 0', borderBottom: '1px solid #d4d0c8' } },
                  new Date(c.data).toLocaleDateString('it-IT', { day:'numeric', month:'short' })
                )
              )
            )
          )
        )
      )
    ),

    // Download bar
    React.createElement('div', {
      style: { padding: '24px 48px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid #d4d0c8' }
    },
      React.createElement(Btn, { ghost: true }, '↓ Esporta dati tab'),
      React.createElement('span', { style: { fontSize: '11px', color: '#b8b4ac', letterSpacing: '0.06em' } },
        'JSON completo · per analisi con Claude Advisor'
      )
    )
  );
}

Object.assign(window, { MoneyLavoroScreen });
