import { useState, useMemo } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard       from '../../../components/primitives/BentoCard';
import DomainEyebrow   from '../../../components/primitives/DomainEyebrow';
import DetailDrawer    from '../../../components/primitives/DetailDrawer';
import NutritionDrawer from '../drawers/NutritionDrawer';
import './modules.css';

const TARGETS = { kcal: 2100, protein: 130, carbs: 210, fat: 65 };

function todayStr() { return new Date().toISOString().split('T')[0]; }

function pct(val, target) { return Math.min(100, Math.round((val / target) * 100)); }

function proteinMessage(proteinG) {
  const ratio = proteinG / TARGETS.protein;
  if (ratio < 0.30) return 'Inizia con una fonte proteica 💪';
  if (ratio < 0.60) return 'Buon inizio. Punta a proteine nel prossimo pasto.';
  if (ratio < 1.00) return 'Quasi al target proteico. Ottimo.';
  return 'Target proteico raggiunto ✓';
}

const ForkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

/* ── Protein progress bar ── */
function ProteinBar({ value, target, height = 6 }) {
  const p = pct(value, target);
  const color = p >= 100 ? 'var(--color-success)' : 'var(--color-teal)';
  return (
    <div style={{ width: '100%', height, background: 'var(--color-line)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width 600ms ease-out' }} />
    </div>
  );
}

/* ── SizeS ── */
function SizeS({ totals }) {
  const { protein, kcal } = totals;
  const protPct = pct(protein, TARGETS.protein);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1, color: 'var(--color-ink)' }}>
          {Math.round(protein)}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
          /{TARGETS.protein}g prot.
        </span>
      </div>
      <ProteinBar value={protein} target={TARGETS.protein} height={5} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-muted)', marginTop: 'auto' }}>
        {kcal > 0 ? `${Math.round(kcal)} kcal` : 'Nessun pasto loggato'}
      </span>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ totals }) {
  const { protein, kcal, carbs, fat } = totals;
  const msg = proteinMessage(protein);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {/* Protein hero */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--color-ink)' }}>
            {Math.round(protein)}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>
            / {TARGETS.protein}g
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', marginLeft: 2 }}>
            proteine
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProteinBar value={protein} target={TARGETS.protein} height={7} />
        </div>
      </div>

      {/* Secondary macros */}
      <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-line)', paddingTop: 8 }}>
        {[
          { label: 'Kcal',  val: kcal,  target: TARGETS.kcal,  color: 'var(--color-flame)' },
          { label: 'Carbo', val: carbs, target: TARGETS.carbs, color: 'var(--color-flame)', unit: 'g' },
          { label: 'Grassi',val: fat,   target: TARGETS.fat,   color: 'var(--color-magenta)', unit: 'g' },
        ].map(({ label, val, target, color, unit = '' }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(val)}{unit}/{target}{unit}
            </span>
            <div style={{ width: '100%', height: 3, background: 'var(--color-line)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct(val, target)}%`, background: color, borderRadius: 999, transition: 'width 600ms ease-out' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Contextual message */}
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5, marginTop: 'auto' }}>
        {msg}
      </p>
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ totals, todayLog }) {
  const { protein, kcal, carbs, fat } = totals;
  const msg = proteinMessage(protein);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {/* Protein hero */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--color-ink)' }}>
            {Math.round(protein)}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>
            / {TARGETS.protein}g proteine
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProteinBar value={protein} target={TARGETS.protein} height={7} />
        </div>
      </div>

      {/* Secondary macros */}
      <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-line)', paddingTop: 8 }}>
        {[
          { label: 'Kcal',   val: kcal,  target: TARGETS.kcal,  color: 'var(--color-flame)' },
          { label: 'Carbo',  val: carbs, target: TARGETS.carbs, color: 'var(--color-flame)', unit: 'g' },
          { label: 'Grassi', val: fat,   target: TARGETS.fat,   color: 'var(--color-magenta)', unit: 'g' },
        ].map(({ label, val, target, color, unit = '' }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(val)}{unit}/{target}{unit}
            </span>
            <div style={{ width: '100%', height: 3, background: 'var(--color-line)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct(val, target)}%`, background: color, borderRadius: 999, transition: 'width 600ms ease-out' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Today's meals */}
      {todayLog.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid var(--color-line)', paddingTop: 8 }}>
          {todayLog.slice(0, 4).map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{e.emoji || '🍽'}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.nome}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-teal)', flexShrink: 0 }}>
                {e.protein_g}g P
              </span>
            </div>
          ))}
          {todayLog.length > 4 && (
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)' }}>
              +{todayLog.length - 4} altri pasti
            </span>
          )}
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', margin: '0 0 0', lineHeight: 1.5, marginTop: 'auto' }}>
        {msg}
      </p>
    </div>
  );
}

/* ── main export ── */
export default function NutritionTodayModule({ size = 'M' }) {
  const [log]  = useFirebaseState('sv_nutrition_log', []);
  const [open, setOpen] = useState(false);

  const today = todayStr();

  const { totals, todayLog } = useMemo(() => {
    const todayLog = log.filter(e => e.date === today);
    const totals = {
      kcal:    todayLog.reduce((s, e) => s + (e.kcal      || 0), 0),
      protein: todayLog.reduce((s, e) => s + (e.protein_g || 0), 0),
      carbs:   todayLog.reduce((s, e) => s + (e.carbs_g   || 0), 0),
      fat:     todayLog.reduce((s, e) => s + (e.fat_g     || 0), 0),
    };
    return { totals, todayLog };
  }, [log, today]);

  const eyebrow = (
    <DomainEyebrow
      domain="nutrition"
      label="Nutrizione"
      icon={size !== 'S' ? <ForkIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Log</button>
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
          {size === 'S' && <SizeS totals={totals} />}
          {size === 'M' && <SizeM totals={totals} />}
          {size === 'L' && <SizeL totals={totals} todayLog={todayLog} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Nutrizione"
        headerStats={[
          { label: 'Proteine',    value: `${Math.round(totals.protein)}/${TARGETS.protein}`, unit: 'g' },
          { label: 'Kcal',        value: `${Math.round(totals.kcal)}/${TARGETS.kcal}` },
          { label: 'Carboidrati', value: `${Math.round(totals.carbs)}/${TARGETS.carbs}`, unit: 'g' },
          { label: 'Grassi',      value: `${Math.round(totals.fat)}/${TARGETS.fat}`, unit: 'g' },
        ]}
        accentColor="var(--color-teal)"
      >
        <NutritionDrawer />
      </DetailDrawer>
    </>
  );
}
