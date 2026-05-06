import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard            from '../../../components/primitives/BentoCard';
import DomainEyebrow        from '../../../components/primitives/DomainEyebrow';
import TrendPill            from '../../../components/primitives/TrendPill';
import Sparkline            from '../../../components/primitives/Sparkline';
import MiniStatRow          from '../../../components/primitives/MiniStatRow';
import EmptyState           from '../../../components/primitives/EmptyState';
import DetailDrawer         from '../../../components/primitives/DetailDrawer';
import ProgressiCorpoDrawer from '../drawers/ProgressiCorpoDrawer';
import './modules.css';

const RulerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z" />
    <path d="m14 7 3 3" />
    <path d="m10 11 3 3" />
    <path d="m6 15 3 3" />
  </svg>
);

function deltaTrend(current, prev) {
  if (current == null || prev == null) return null;
  const d = +(current - prev).toFixed(1);
  return { num: d, label: `${d >= 0 ? '+' : ''}${d}` };
}

function bmi(weight, height = 178) {
  if (!weight || !height) return null;
  return +(weight / ((height / 100) ** 2)).toFixed(1);
}

/* ── SizeS ── */
function SizeS({ latest, prev }) {
  const delta = deltaTrend(latest?.weight, prev?.weight);
  const dir   = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
  const tone  = delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      {latest ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1, color: 'var(--color-ink)' }}>
              {latest.weight ?? '—'}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)' }}>kg</span>
            {delta && <TrendPill direction={dir} tone={tone} value={`${delta.label} kg`} />}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
            Vita {latest.waist ?? '—'} · Fianchi {latest.hips ?? '—'} cm
          </div>
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessuna misura
        </span>
      )}
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ latest, prev, sorted }) {
  const fields = [
    { key: 'weight', label: 'Peso',    unit: 'kg' },
    { key: 'waist',  label: 'Vita',    unit: 'cm' },
    { key: 'hips',   label: 'Fianchi', unit: 'cm' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {latest ? (
        <>
          <div className="mod-measures-grid">
            {fields.map(({ key, label, unit }) => {
              const val   = latest[key];
              const delta = deltaTrend(val, prev?.[key]);
              const dir   = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
              const tone  = key === 'weight'
                ? (delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral')
                : (delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral');
              return (
                <div key={key} className="mod-measure-item">
                  <span className="mod-measure-value">{val ?? '—'}</span>
                  <span className="mod-measure-label">{label} {unit}</span>
                  {delta && <TrendPill direction={dir} tone={tone} value={`${delta.label} ${unit}`} />}
                </div>
              );
            })}
          </div>
          <MiniStatRow stats={[
            { label: 'Rilevazioni', value: sorted.length },
            { label: 'BMI', value: bmi(latest.weight) ?? '—' },
          ]} />
        </>
      ) : (
        <EmptyState
          illustration="📏"
          title="Nessuna misura registrata"
          description="Prendi le misure ogni lunedì insieme alla foto."
        />
      )}
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ latest, prev, sorted }) {
  const weightSpark = sorted.slice(-10).map(e => e.weight ?? 0);
  const waistSpark  = sorted.slice(-10).map(e => e.waist  ?? 0);

  const fields = [
    { key: 'weight', label: 'Peso',    unit: 'kg' },
    { key: 'waist',  label: 'Vita',    unit: 'cm' },
    { key: 'hips',   label: 'Fianchi', unit: 'cm' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {latest ? (
        <>
          <div className="mod-measures-grid">
            {fields.map(({ key, label, unit }) => {
              const val   = latest[key];
              const delta = deltaTrend(val, prev?.[key]);
              const dir   = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
              const tone  = delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral';
              return (
                <div key={key} className="mod-measure-item">
                  <span className="mod-measure-value">{val ?? '—'}</span>
                  <span className="mod-measure-label">{label} {unit}</span>
                  {delta && <TrendPill direction={dir} tone={tone} value={`${delta.label} ${unit}`} />}
                </div>
              );
            })}
          </div>

          {weightSpark.some(v => v > 0) && (
            <div>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
                Trend peso
              </p>
              <Sparkline data={weightSpark} accent="var(--color-teal)" variant="area" height={32} />
            </div>
          )}

          <MiniStatRow stats={[
            { label: 'Rilevazioni', value: sorted.length },
            { label: 'BMI',         value: bmi(latest.weight) ?? '—' },
            { label: 'Altezza',     value: '178', unit: ' cm' },
          ]} />
        </>
      ) : (
        <EmptyState
          illustration="📏"
          title="Nessuna misura registrata"
          description="Prendi le misure ogni lunedì insieme alla foto."
        />
      )}
    </div>
  );
}

/* ── main export ── */
export default function BodyMeasuresModule({ size = 'M' }) {
  const [measures] = useFirebaseState('sv_body_measures', []);
  const [open, setOpen] = useState(false);

  const sorted = useMemo(() =>
    [...measures].sort((a, b) => a.date.localeCompare(b.date)),
    [measures],
  );
  const latest = sorted.at(-1);
  const prev   = sorted.at(-2);

  const eyebrow = (
    <DomainEyebrow
      domain="fitness"
      label="Misure"
      icon={size !== 'S' ? <RulerIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Aggiorna</button>
  );

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        action={action}
        className="mod-card"
        compact={size === 'S'}
        onClick={() => setOpen(true)}
      >
        <div className="mod-body">
          {size === 'S' && <SizeS latest={latest} prev={prev} />}
          {size === 'M' && <SizeM latest={latest} prev={prev} sorted={sorted} />}
          {size === 'L' && <SizeL latest={latest} prev={prev} sorted={sorted} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Misure corpo"
        headerStats={[
          { label: 'Peso',        value: latest?.weight ?? '—', unit: latest?.weight ? ' kg' : '' },
          { label: 'Vita',        value: latest?.waist  ?? '—', unit: latest?.waist  ? ' cm' : '' },
          { label: 'Fianchi',     value: latest?.hips   ?? '—', unit: latest?.hips   ? ' cm' : '' },
          { label: 'Rilevazioni', value: sorted.length },
        ]}
        accentColor="var(--color-teal)"
      >
        <ProgressiCorpoDrawer />
      </DetailDrawer>
    </>
  );
}
