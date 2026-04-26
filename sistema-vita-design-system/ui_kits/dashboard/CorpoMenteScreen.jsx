// Sistema di Vita — Corpo & Mente screen

const BOOKS_DEMO = [
  { id: 1, title: 'Atomic Habits', author: 'James Clear', status: 'done', pages: 320, read: 320, rating: 5 },
  { id: 2, title: 'Deep Work', author: 'Cal Newport', status: 'reading', pages: 296, read: 180, rating: 4 },
  { id: 3, title: 'Il Principe', author: 'Machiavelli', status: 'to-read', pages: 240, read: 0, rating: 0 },
];

const STATUS_LABEL = { reading: 'In lettura', done: 'Finito', 'to-read': 'Da leggere', abandoned: 'Abbandonato' };
const STATUS_STYLE = {
  reading:   { background: '#c8f564', color: '#1a1a1a' },
  done:      { background: '#1a1a1a', color: '#f5f3ef' },
  'to-read': { border: '1px solid #b0ac9f', color: '#6e6a62' },
  abandoned: { border: '1px solid #d4d0c8', color: '#b8b4ac' },
};

const WEIGHT_DEMO = [
  { date: '2025-04-18', val: 79.2 },
  { date: '2025-04-19', val: 78.9 },
  { date: '2025-04-20', val: 79.0 },
  { date: '2025-04-21', val: 78.7 },
  { date: '2025-04-22', val: 78.5 },
  { date: '2025-04-23', val: 78.3 },
  { date: '2025-04-24', val: 78.5 },
];

const JOURNAL_DEMO = [
  { date: '2025-04-24', text: 'Ottima giornata. Rucking completato alle 7, 5km con 10kg. Lettura di Deep Work per 45 minuti. Energia alta tutta la mattina.' },
  { date: '2025-04-23', text: 'Sonno leggermente disturbato ma recuperato bene. Ho chiamato mia madre, bella chiacchierata. Progetto digitale avanzato.' },
];

// ── Helpers ──

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
    : { background: '#c8f564', color: '#1a1a1a', border: 'none', filter: hover ? 'brightness(1.08)' : 'none' };
  return React.createElement('button', {
    onClick, onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: {
      ...base,
      padding: '9px 16px', fontSize: '10px', fontWeight: '800',
      letterSpacing: '0.12em', textTransform: 'uppercase',
      cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0,
      whiteSpace: 'nowrap', transition: 'filter 0.12s',
    }
  }, children);
}

function ProgressBar({ pct, thick }) {
  return React.createElement('div', {
    style: { height: thick ? '3px' : '2px', background: '#d4d0c8', position: 'relative', overflow: 'hidden' }
  },
    React.createElement('div', {
      style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#c8f564', transition: 'width 0.35s ease' }
    })
  );
}

// ── Corpo & Mente Screen ──

function CorpoMenteScreen() {
  const [tab, setTab] = React.useState('tutti');
  const [journalText, setJournalText] = React.useState('');
  const [journals, setJournals] = React.useState(JOURNAL_DEMO);

  const maxW = WEIGHT_DEMO.reduce((m, r) => Math.max(m, r.val), 0);
  const minW = WEIGHT_DEMO.reduce((m, r) => Math.min(m, r.val), 999);

  const filteredBooks = tab === 'tutti' ? BOOKS_DEMO
    : BOOKS_DEMO.filter(b => b.status === tab);

  const addJournal = () => {
    if (!journalText.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    setJournals([{ date: today, text: journalText.trim() }, ...journals]);
    setJournalText('');
  };

  return React.createElement('div', { style: { background: '#f5f3ef', color: '#1a1a1a', fontFamily: 'system-ui,-apple-system,sans-serif' } },

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
      }, 'Corpo &\nMente')
    ),

    // ── PESO section ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Peso & Misure' }),
      React.createElement('div', { style: { padding: '36px 48px' } },
        React.createElement('div', { style: { display: 'flex', gap: '48px', marginBottom: '28px' } },
          ...[['Peso attuale', '78.5 kg'], ['Δ 7 giorni', '−0.7 kg'], ['Obiettivo', '76.0 kg']].map(([lbl, val]) =>
            React.createElement('div', { key: lbl },
              React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e6a62', marginBottom: '5px' } }, lbl),
              React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: '1' } }, val)
            )
          )
        ),
        // Weight history bars
        React.createElement('div', { style: { maxWidth: '400px' } },
          WEIGHT_DEMO.map((r, i) => {
            const range = maxW - minW || 1;
            const pct = 30 + ((r.val - minW) / range) * 70;
            return React.createElement('div', {
              key: i,
              style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', borderBottom: '1px solid #d4d0c8' }
            },
              React.createElement('span', { style: { fontSize: '11px', color: '#6e6a62', width: '80px', flexShrink: 0 } },
                new Date(r.date).toLocaleDateString('it-IT', { day:'numeric', month:'short' })
              ),
              React.createElement('div', { style: { flex: 1, height: '3px', background: '#d4d0c8', position: 'relative', overflow: 'hidden' } },
                React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#c8f564' } })
              ),
              React.createElement('span', { style: { fontSize: '12px', fontWeight: 600, color: '#1a1a1a', width: '48px', textAlign: 'right', flexShrink: 0 } }, `${r.val}`)
            );
          })
        )
      )
    ),

    // ── LIBRI section ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Libri' }),
      React.createElement('div', { style: { padding: '28px 48px' } },
        // Tabs
        React.createElement('div', { style: { display: 'flex', gap: '1px', marginBottom: '20px' } },
          [['tutti','Tutti'], ['reading','In lettura'], ['done','Finiti'], ['to-read','Da leggere']].map(([id, label]) =>
            React.createElement('button', {
              key: id,
              onClick: () => setTab(id),
              style: {
                background: tab === id ? '#c8f564' : 'transparent',
                color: tab === id ? '#1a1a1a' : '#6e6a62',
                border: '1px solid', borderColor: tab === id ? '#c8f564' : '#d4d0c8',
                padding: '5px 12px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.10em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0,
              }
            }, label)
          )
        ),
        // Book rows
        filteredBooks.map(book => {
          const pct = book.pages > 0 ? (book.read / book.pages) * 100 : 0;
          return React.createElement('div', { key: book.id, style: { borderTop: '1px solid #d4d0c8' } },
            React.createElement('div', {
              style: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', cursor: 'pointer' }
            },
              React.createElement('div', { style: { width: '48px', height: '64px', background: '#ede9e2', border: '1px solid #d4d0c8', flexShrink: 0 } }),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', { style: { fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' } }, book.title),
                React.createElement('div', { style: { fontSize: '12px', color: '#6e6a62' } }, book.author),
                book.status === 'reading' && React.createElement('div', { style: { marginTop: '8px' } },
                  React.createElement(ProgressBar, { pct }),
                  React.createElement('span', { style: { fontSize: '10px', color: '#6e6a62', marginTop: '4px', display: 'block', letterSpacing: '0.04em' } }, `${book.read} / ${book.pages} pag`)
                )
              ),
              React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 } },
                React.createElement('span', {
                  style: { fontSize: '9px', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', padding: '3px 8px', whiteSpace: 'nowrap', ...STATUS_STYLE[book.status] }
                }, STATUS_LABEL[book.status]),
                book.rating > 0 && React.createElement('div', { style: { display: 'flex', gap: '2px' } },
                  [1,2,3,4,5].map(s =>
                    React.createElement('span', {
                      key: s,
                      style: { fontSize: '14px', color: s <= book.rating ? '#6e6a62' : '#b8b4ac' }
                    }, '★')
                  )
                )
              )
            )
          );
        })
      )
    ),

    // ── JOURNAL section ──
    React.createElement('div', { style: { borderBottom: '1px solid #d4d0c8' } },
      React.createElement(SectionHead, { title: 'Journal' }),
      React.createElement('div', { style: { padding: '28px 48px' } },
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('textarea', {
            value: journalText,
            onChange: e => setJournalText(e.target.value),
            placeholder: 'Scrivi qualcosa...',
            style: {
              width: '100%', background: 'transparent', border: '1px solid #d4d0c8',
              color: '#1a1a1a', padding: '9px 11px', fontSize: '13px',
              fontFamily: 'inherit', outline: 'none', borderRadius: 0,
              resize: 'vertical', minHeight: '80px', lineHeight: '1.55',
            }
          }),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' } },
            React.createElement('span', { style: { fontSize: '11px', color: '#b8b4ac', fontWeight: 700, letterSpacing: '0.06em' } },
              `${journalText.length} / 500`
            ),
            React.createElement(Btn, { onClick: addJournal }, 'Salva')
          )
        ),
        journals.map((j, i) =>
          React.createElement('div', {
            key: i,
            style: {
              display: 'grid', gridTemplateColumns: '160px 1fr auto',
              gap: '20px', alignItems: 'start', padding: '14px 0',
              borderBottom: '1px solid #d4d0c8',
            }
          },
            React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6e6a62', paddingTop: '2px' } },
              new Date(j.date).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' })
            ),
            React.createElement('span', { style: { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.55' } }, j.text)
          )
        )
      )
    )
  );
}

Object.assign(window, { CorpoMenteScreen });
