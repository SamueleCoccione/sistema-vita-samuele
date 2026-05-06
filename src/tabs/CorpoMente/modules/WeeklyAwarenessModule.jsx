import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import BentoCard             from '../../../components/primitives/BentoCard';
import DomainEyebrow         from '../../../components/primitives/DomainEyebrow';
import ChipTag               from '../../../components/primitives/ChipTag';
import DetailDrawer          from '../../../components/primitives/DetailDrawer';
import WeeklyAwarenessDrawer from '../drawers/WeeklyAwarenessDrawer';
import { getMondayStr, weekRangeLong } from '../../../utils/weekRange';
import './modules.css';

const QUESTIONS = [
  { k: 'bevo_disagio',        short: 'Alcol disagio' },
  { k: 'mangiato_emotivo',    short: 'Eating emotivo' },
  { k: 'dormito_regolare',    short: 'Sonno regolare' },
  { k: 'pensieri_ricorrenti', short: 'Pensieri' },
];


const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

/* ── SizeS ── */
function SizeS({ answered, current }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: answered >= 3 ? 'var(--color-success)' : 'var(--color-ink-muted)' }}>
          {answered}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--color-ink-muted)', marginLeft: 2 }}>/4</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
            Domande
          </div>
          {answered === 4 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-success)', marginTop: 3 }}>
              ✓ Completato
            </div>
          )}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {weekRangeLong()}
      </div>
    </div>
  );
}

/* ── SizeM ── */
function SizeM({ answered, current, monday }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
          {weekRangeLong()}
        </span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: answered >= 3 ? 'var(--color-success)' : 'var(--color-ink-muted)' }}>
          {answered}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)', marginLeft: 2 }}>/4</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUESTIONS.map(q => {
          const val  = current?.answers?.[q.k];
          const tone = val === null || val === undefined ? 'neutral' : val === true ? 'warning' : 'success';
          const label = val === null || val === undefined ? q.short : val ? `Sì · ${q.short}` : `No · ${q.short}`;
          return <ChipTag key={q.k} tone={tone}>{label}</ChipTag>;
        })}
      </div>
    </div>
  );
}

/* ── SizeL ── */
function SizeL({ answered, current, monday, records }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
          {weekRangeLong()}
        </span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: answered >= 3 ? 'var(--color-success)' : 'var(--color-ink-muted)' }}>
          {answered}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)', marginLeft: 2 }}>/4</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUESTIONS.map(q => {
          const val  = current?.answers?.[q.k];
          const tone = val === null || val === undefined ? 'neutral' : val === true ? 'warning' : 'success';
          const label = val === null || val === undefined ? q.short : val ? `Sì · ${q.short}` : `No · ${q.short}`;
          return <ChipTag key={q.k} tone={tone}>{label}</ChipTag>;
        })}
      </div>
      {current?.note && (
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
          "{current.note.slice(0, 180)}{current.note.length > 180 ? '…' : ''}"
        </p>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 'auto' }}>
        {records.length} settiman{records.length !== 1 ? 'e' : 'a'} registrate
      </div>
    </div>
  );
}

/* ── main export ── */
export default function WeeklyAwarenessModule({ size = 'M' }) {
  const [records] = useFirebaseState('sv_weekly_awareness', []);
  const [open, setOpen] = useState(false);

  const monday  = getMondayStr();
  const current = records.find(r => r.week === monday);
  const answered = current
    ? Object.values(current.answers || {}).filter(v => v !== null && v !== undefined).length
    : 0;

  const eyebrow = (
    <DomainEyebrow
      domain="mind"
      label="Consapevolezza"
      icon={size !== 'S' ? <BrainIcon /> : undefined}
    />
  );

  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Rispondi</button>
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
          {size === 'S' && <SizeS answered={answered} current={current} />}
          {size === 'M' && <SizeM answered={answered} current={current} monday={monday} />}
          {size === 'L' && <SizeL answered={answered} current={current} monday={monday} records={records} />}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Corpo & Mente"
        title="Consapevolezza settimanale"
        headerStats={[
          { label: 'Domande',   value: `${answered}/4` },
          { label: 'Settimane', value: records.length },
        ]}
        accentColor="var(--color-magenta)"
      >
        <WeeklyAwarenessDrawer />
      </DetailDrawer>
    </>
  );
}
