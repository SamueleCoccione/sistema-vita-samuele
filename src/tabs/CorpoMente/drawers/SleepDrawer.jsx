import './drawers.css';

export default function SleepDrawer() {
  return (
    <div className="dr-content">
      <section className="dr-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
        <span style={{ fontSize: 48 }}>🌙</span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--color-ink)', margin: 0, textAlign: 'center' }}>
          Tracking sonno non attivo
        </h3>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.65, textAlign: 'center', maxWidth: 360, margin: 0 }}>
          Importa i dati da Apple Health XML per visualizzare le tue statistiche di sonno: ore totali, fasi, HRV e consistenza settimanale.
        </p>
        <button
          onClick={() => alert('Import Apple Health — prossimamente.')}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '10px 24px',
            background: 'var(--color-teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Importa Health
        </button>
        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
          {['Ore totali / notte', 'Sonno profondo', 'HRV medio', 'Consistenza 7gg'].map(label => (
            <div
              key={label}
              style={{
                background: 'var(--color-surface-alt, #EDE9E2)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-line)', fontWeight: 400 }}>—</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
