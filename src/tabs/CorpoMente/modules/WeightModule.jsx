import { useState, useMemo, useId } from 'react';
import {
  AreaChart, Area, ReferenceLine,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard     from '../../../components/primitives/BentoCard';
import DomainEyebrow from '../../../components/primitives/DomainEyebrow';
import TrendPill     from '../../../components/primitives/TrendPill';
import Sparkline     from '../../../components/primitives/Sparkline';
import MiniStatRow   from '../../../components/primitives/MiniStatRow';
import DetailDrawer  from '../../../components/primitives/DetailDrawer';
import WeightDrawer  from '../drawers/WeightDrawer';
import './modules.css';

const WEIGHT_TARGET = 75;

function fmtDateShort(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function closestBefore(sorted, daysAgo) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  const cutStr = cutoff.toISOString().split('T')[0];
  const before = sorted.filter(e => e.date <= cutStr);
  return before.at(-1) ?? null;
}

function deltaStr(latest, ref) {
  if (!latest || !ref) return null;
  const d = +(latest.weight - ref.weight).toFixed(1);
  return { num: d, label: `${d >= 0 ? '+' : ''}${d} kg` };
}

/* ── scale icon ── */
const ScaleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z" />
    <path d="M12 7v5l3 3" />
  </svg>
);

/* ── SizeS ── */
function SizeS({ stats }) {
  const { latest, delta } = stats;
  const dir  = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
  const tone = delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
      {latest ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
              {latest.weight}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)' }}>kg</span>
            {delta && <TrendPill direction={dir} tone={tone} value={delta.label} />}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
            {fmtDateShort(latest.date)}
          </span>
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessun dato
        </span>
      )}
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ stats }) {
  const { latest, delta, delta7, delta30, sparkData, sorted } = stats;
  const dir  = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
  const tone = delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral';

  const miniStats = [
    { label: '7 giorni', value: delta7 ? delta7.label : '—' },
    { label: '30 giorni', value: delta30 ? delta30.label : '—' },
    { label: 'Target', value: `${WEIGHT_TARGET} kg` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {latest ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1, color: 'var(--color-ink)' }}>
              {latest.weight}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--color-ink-muted)' }}>kg</span>
            {delta && <TrendPill direction={dir} tone={tone} value={delta.label} />}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
            {fmtDateShort(latest.date)} · {sorted.length} rilevazion{sorted.length !== 1 ? 'i' : 'e'}
          </span>

          {sparkData.some(v => v > 0) && (
            <Sparkline data={sparkData} accent="var(--color-teal)" variant="area" height={34} />
          )}

          <MiniStatRow stats={miniStats} />
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessun dato — aggiungi la prima rilevazione.
        </span>
      )}
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ stats }) {
  const gradId = useId();
  const { latest, delta, delta7, delta30, sparkData, sorted, chartData90, pctToTarget } = stats;
  const dir  = delta && delta.num < 0 ? 'down' : delta && delta.num > 0 ? 'up' : 'flat';
  const tone = delta && delta.num < 0 ? 'positive' : delta && delta.num > 0 ? 'negative' : 'neutral';

  const miniStats = [
    { label: '7 giorni', value: delta7 ? delta7.label : '—' },
    { label: '30 giorni', value: delta30 ? delta30.label : '—' },
    { label: 'Target', value: `${WEIGHT_TARGET} kg` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {latest ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1, color: 'var(--color-ink)' }}>
              {latest.weight}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--color-ink-muted)' }}>kg</span>
            {delta && <TrendPill direction={dir} tone={tone} value={delta.label} />}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
            {fmtDateShort(latest.date)} · {sorted.length} rilevazion{sorted.length !== 1 ? 'i' : 'e'}
          </span>

          {sparkData.some(v => v > 0) && (
            <Sparkline data={sparkData} accent="var(--color-teal)" variant="area" height={28} />
          )}

          <MiniStatRow stats={miniStats} />

          {chartData90.length >= 2 && (
            <div style={{ marginTop: 4 }}>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={chartData90} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2BB3A8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2BB3A8" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="kg"
                    stroke="#2BB3A8"
                    strokeWidth={2}
                    fill={`url(#${gradId})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    y={WEIGHT_TARGET}
                    stroke="rgba(43,179,168,0.5)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-line)',
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                    }}
                    formatter={v => [`${v} kg`]}
                    labelFormatter={() => ''}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {pctToTarget !== null && (
            <p style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: 13, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5,
            }}>
              {pctToTarget >= 100
                ? `Target ${WEIGHT_TARGET} kg raggiunto`
                : `Sei al ${pctToTarget}% del percorso verso ${WEIGHT_TARGET} kg`}
            </p>
          )}
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
          Nessun dato — aggiungi la prima rilevazione.
        </span>
      )}
    </div>
  );
}

/* ── main export ── */
export default function WeightModule({ size = 'M' }) {
  const [entries] = useFirebaseState('sv_weight', []);
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  const stats = useMemo(() => {
    const latest   = sorted.at(-1) ?? null;
    const prev     = sorted.at(-2) ?? null;
    const delta    = deltaStr(latest, prev);
    const ref7     = closestBefore(sorted, 7);
    const ref30    = closestBefore(sorted, 30);
    const delta7   = deltaStr(latest, ref7);
    const delta30  = deltaStr(latest, ref30);

    const sparkData = sorted.slice(-14).map(e => e.weight);
    const chartData90 = sorted.slice(-90).map(e => ({ date: e.date, kg: e.weight }));

    const refStart = sorted.at(0)?.weight ?? null;
    const pctToTarget =
      refStart != null && refStart > WEIGHT_TARGET && latest != null
        ? Math.min(100, Math.max(0, Math.round(((refStart - latest.weight) / (refStart - WEIGHT_TARGET)) * 100)))
        : null;

    return { latest, prev, delta, delta7, delta30, sparkData, chartData90, pctToTarget, sorted };
  }, [sorted]);

  const eyebrow = (
    <DomainEyebrow
      domain="fitness"
      label="Peso"
      icon={size !== 'S' ? <ScaleIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Storico
    </button>
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
          {size === 'S' && <SizeS stats={stats} />}
          {size === 'M' && <SizeM stats={stats} />}
          {size === 'L' && <SizeL stats={stats} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Peso corporeo"
        headerStats={[
          { label: 'Ultimo rilevato', value: stats.latest?.weight ?? '—', unit: ' kg' },
          { label: 'Variazione',      value: stats.delta?.label ?? '—' },
          { label: 'Rilevazioni',     value: sorted.length },
          { label: 'Target',          value: WEIGHT_TARGET, unit: ' kg' },
        ]}
        accentColor="#2BB3A8"
      >
        <WeightDrawer />
      </DetailDrawer>
    </>
  );
}
