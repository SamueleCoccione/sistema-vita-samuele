import './primitives.css';

export default function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-title">
      {eyebrow && <span className="section-title__eyebrow">{eyebrow}</span>}
      <h2 className="section-title__text">{title}</h2>
    </div>
  );
}
