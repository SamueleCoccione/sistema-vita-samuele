import './primitives.css';

const DOMAIN_COLORS = {
  fitness:   'var(--accent-fitness)',
  nutrition: 'var(--accent-nutrition)',
  mind:      'var(--accent-mind)',
  cinema:    'var(--accent-cinema)',
  rest:      'var(--accent-rest)',
  goal:      'var(--accent-goal)',
};

export default function DomainEyebrow({ domain, label, icon }) {
  const color = DOMAIN_COLORS[domain] || 'var(--color-ink-muted)';
  return (
    <div className="domain-eyebrow">
      <span className="domain-eyebrow__dot" style={{ background: color }} />
      <span className="domain-eyebrow__label">{label}</span>
      {icon && <span className="domain-eyebrow__icon">{icon}</span>}
    </div>
  );
}
