import { useId } from 'react';
import './primitives.css';

export default function ProgressRing({
  value = 0,
  size = 80,
  thickness = 8,
  gradient = 'magenta',
  className = '',
}) {
  const id = useId().replace(/:/g, '');
  const r    = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(Math.max(value, 0), 100);
  const offset = circ * (1 - pct / 100);

  const gradients = {
    magenta: ['#E0428A', '#FF6B35'],
    teal:    ['#2BB3A8', '#4A9B6E'],
  };
  const [c1, c2] = gradients[gradient] ?? gradients.magenta;
  const gradId = `pr-grad-${id}`;

  return (
    <svg
      className={`progress-ring ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(31,24,18,0.08)"
        strokeWidth={thickness}
      />
      {/* fill */}
      <circle
        className="progress-ring__fill"
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
