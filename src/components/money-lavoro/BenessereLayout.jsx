import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard     from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import MiniStatRow   from '../primitives/MiniStatRow';
import ChipTag       from '../primitives/ChipTag';
import EmptyState    from '../primitives/EmptyState';
import DetailDrawer  from '../primitives/DetailDrawer';

const KEY    = 'ml_benessere';
const ACCENT = '#C4873D';

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function burnoutTone(v) {
  if (v >= 8) return 'magenta';
  if (v >= 6) return 'warning';
  return 'success';
}

function purposeTone(v) {
  if (v >= 7) return 'success';
  if (v >= 4) return 'neutral';
  return 'magenta';
}

function Slider({ label, value, onChange, hint }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="ml-slider-field">
      <div className="ml-slider-top">
        <span className="cm-label">{label}</span>
        <span className="ml-slider-val">{value}<span className="ml-slider-denom">/10</span></span>
      </div>
      {hint && <div className="ml-slider-hint">{hint}</div>}
      <div className="ml-slider-wrap">
        <input
          type="range" min={1} max={10} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="ml-slider"
          style={{ '--pct': `${pct}%` }}
        />
      </div>
      <div className="ml-slider-ticks"><span>basso</span><span>alto</span></div>
    </div>
  );
}

const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function BenessereLayout() {
  const [checks, setChecks] = useFirebaseState(KEY, []);
  const [open, setOpen] = useState(false);
  const [burnout, setBurnout] = useState(5);
  const [purpose, setPurpose] = useState(5);
  const [carico,  setCarico]  = useState(5);

  const savCheck = () => {
    setChecks([...checks, { id: Date.now(), date: new Date().toISOString().split('T')[0], burnout, purpose, carico }]);
  };

  const remove = id => setChecks(checks.filter(c => c.id !== id));

  const last = checks.length > 0 ? checks[checks.length - 1] : null;

  const chartData = [...checks].slice(-16).map(c => ({
    date:    fmtDate(c.date),
    burnout: c.burnout,
    purpose: c.purpose,
    carico:  c.carico,
  }));

  const eyebrow = (
    <DomainEyebrow domain="money" label="Benessere lavorativo" icon={<HeartIcon />} />
  );
  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Check-in
    </button>
  );

  const headerStats = last
    ? [
        { label: 'Burnout',  value: `${last.burnout}/10`  },
        { label: 'Purpose',  value: `${last.purpose}/10`  },
        { label: 'Carico',   value: `${last.carico}/10`   },
        { label: 'Check-in', value: checks.length          },
      ]
    : [
        { label: 'Burnout', value: '—' },
        { label: 'Purpose', value: '—' },
        { label: 'Carico',  value: '—' },
        { label: 'Check-in', value: 0  },
      ];

  return (
    <>
      <BentoCard eyebrow={eyebrow} action={action} className="mod-card" onClick={() => setOpen(true)}>
        <div className="mod-body">
          {!last ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span style={{ fontSize: 28 }}>🫀</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                Fai il primo check settimanale
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                  Ultimo check · {fmtDate(last.date)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ChipTag tone={burnoutTone(last.burnout)}>Burnout {last.burnout}</ChipTag>
                  <ChipTag tone={purposeTone(last.purpose)}>Purpose {last.purpose}</ChipTag>
                  <ChipTag tone="neutral">Carico {last.carico}</ChipTag>
                </div>
              </div>
              <MiniStatRow stats={[
                { label: 'Burnout',  value: `${last.burnout}/10`  },
                { label: 'Purpose',  value: `${last.purpose}/10`  },
                { label: 'Carico',   value: `${last.carico}/10`   },
              ]} />
            </div>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Money & Lavoro"
        title="Benessere lavorativo"
        headerStats={headerStats}
        primaryAction={{ label: 'Salva check', onClick: savCheck }}
        accentColor={ACCENT}
      >
        <div className="dr-content">

          {/* ── Slider form ── */}
          <section className="dr-section">
            <h3 className="dr-section-title">Check settimanale</h3>
            <div className="ml-bw-form">
              <Slider label="Burnout"          value={burnout} onChange={setBurnout} hint="Quanto ti senti esaurito questa settimana?" />
              <Slider label="Purpose"          value={purpose} onChange={setPurpose} hint="Quanto il lavoro ti dà senso e significato?" />
              <Slider label="Carico di lavoro" value={carico}  onChange={setCarico}  hint="Quanto senti il peso delle cose da fare?" />
            </div>
          </section>

          {/* ── Trend chart ── */}
          {checks.length >= 2 && (
            <section className="dr-section">
              <h3 className="dr-section-title">Correlazione burnout / purpose / carico</h3>
              <div className="dr-chart-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      domain={[1, 10]}
                      tick={{ fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false}
                      width={22} ticks={[1, 3, 5, 7, 10]}
                    />
                    <ReferenceLine y={7} stroke="var(--color-success)" strokeDasharray="4 3" strokeOpacity={0.4} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)', border: '1px solid var(--color-line)',
                        fontSize: 12, borderRadius: 8, fontFamily: 'inherit',
                      }}
                    />
                    <Line type="monotone" dataKey="burnout" stroke="var(--color-magenta)" strokeWidth={2} dot={{ r: 3 }} name="Burnout" />
                    <Line type="monotone" dataKey="purpose" stroke="var(--color-success)"  strokeWidth={2} dot={{ r: 3 }} name="Purpose" />
                    <Line type="monotone" dataKey="carico"  stroke="var(--color-ink-muted)" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} name="Carico" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {checks.length < 2 && (
            <section className="dr-section">
              <EmptyState
                illustration="📈"
                title="Grafico non ancora disponibile"
                description="Aggiungi almeno 2 check settimanali per vedere il trend"
              />
            </section>
          )}

          {/* ── Storico ── */}
          {checks.length > 0 && (
            <section className="dr-section">
              <h3 className="dr-section-title">Storico check</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...checks].reverse().slice(0, 10).map(c => (
                  <div key={c.id} className="ml-bw-row">
                    <span className="ml-history-date">{c.date}</span>
                    <ChipTag tone={burnoutTone(c.burnout)}>B {c.burnout}</ChipTag>
                    <ChipTag tone={purposeTone(c.purpose)}>P {c.purpose}</ChipTag>
                    <ChipTag tone="neutral">C {c.carico}</ChipTag>
                    <button className="cm-icon-btn" onClick={() => remove(c.id)}>×</button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </DetailDrawer>
    </>
  );
}
