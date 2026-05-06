import './primitives.css';

export default function BentoCard({
  size = 'md',
  title,
  eyebrow,
  action,
  children,
  className = '',
  onClick,
  style,
  compact = false,
}) {
  const clickProps = onClick
    ? { onClick, role: 'button', tabIndex: 0, onKeyDown: e => e.key === 'Enter' && onClick() }
    : {};

  return (
    <div
      className={`bento-card bento-card--${size} ${onClick ? 'bento-card--clickable' : ''} ${className}`}
      style={style}
      {...clickProps}
    >
      {(eyebrow || title || action) && (
        <div className="bento-card__header">
          <div className="bento-card__titles">
            {eyebrow && <div className="bento-card__eyebrow">{eyebrow}</div>}
            {title   && <span className="bento-card__title">{title}</span>}
          </div>
          {action && <div className="bento-card__action">{action}</div>}
        </div>
      )}
      <div className={`bento-card__body${compact ? ' bento-card__body--compact' : ''}`}>{children}</div>
    </div>
  );
}
