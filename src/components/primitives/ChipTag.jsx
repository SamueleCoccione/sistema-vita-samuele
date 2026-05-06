import './primitives.css';

export default function ChipTag({ tone = 'neutral', children }) {
  return (
    <span className={`chip-tag chip-tag--${tone}`}>{children}</span>
  );
}
