import './primitives.css';

function FlameIcon({ color }) {
  return (
    <svg className="streak-counter__flame" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 2C10 2 6 6 6 10.5C6 12.985 7.79 15 10 15C12.21 15 14 12.985 14 10.5C14 9 13.5 8 12.5 7C12.5 7 12 9 11 9C11 9 12 7 10 2Z"
        fill={color}
        opacity="0.9"
      />
      <path
        d="M10 17.5C11.105 17.5 12 16.605 12 15.5C12 14.395 11 13.5 10 13C9 13.5 8 14.395 8 15.5C8 16.605 8.895 17.5 10 17.5Z"
        fill={color}
        opacity="0.7"
      />
    </svg>
  );
}

function flameColor(days) {
  if (days >= 30) return 'var(--color-magenta)';
  if (days >= 14) return 'var(--color-flame)';
  if (days >= 7)  return 'var(--color-flame)';
  return '#FF9A6C';
}

export default function StreakCounter({ days = 0 }) {
  const isMilestone = days === 7 || days === 14 || days === 30 || days === 100;
  const color = flameColor(days);

  return (
    <div className={`streak-counter ${isMilestone ? 'streak-counter--milestone' : ''}`}>
      <FlameIcon color={color} />
      <span className="streak-counter__number" style={{ color }}>{days}</span>
      <span className="streak-counter__label">giorni di fila</span>
    </div>
  );
}
