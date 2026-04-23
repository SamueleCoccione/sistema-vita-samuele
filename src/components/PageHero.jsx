import './PageHero.css';

export default function PageHero({ title }) {
  return (
    <div className="ph">
      <div className="ph-grain" />
      <h1 className="ph-title">{title}</h1>
    </div>
  );
}
