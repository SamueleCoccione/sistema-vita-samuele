import './primitives.css';

export default function EmptyState({ illustration = '✦', title, description, cta, onCta }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">{illustration}</span>
      {title       && <p className="empty-state__title">{title}</p>}
      {description && <p className="empty-state__desc">{description}</p>}
      {cta         && <button className="empty-state__cta" onClick={onCta}>{cta}</button>}
    </div>
  );
}
