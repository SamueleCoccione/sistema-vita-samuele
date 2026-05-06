import './primitives.css';

const TONES = {
  positive: { bg: 'rgba(74,155,110,0.12)',  color: 'var(--color-success)' },
  negative: { bg: 'rgba(255,107,53,0.12)',  color: 'var(--color-flame)'  },
  neutral:  { bg: 'rgba(107,93,82,0.10)',   color: 'var(--color-ink-muted)' },
};

export default function TrendPill({ direction = 'flat', tone = 'neutral', value }) {
  const { bg, color } = TONES[tone] ?? TONES.neutral;
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  return (
    <span className="trend-pill" style={{ background: bg, color }}>
      {arrow} {value}
    </span>
  );
}
