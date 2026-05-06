import './primitives.css';

export default function MiniStatRow({ stats = [] }) {
  return (
    <div className="mini-stat-row">
      {stats.map((s, i) => (
        <div key={i} className="mini-stat-row__item">
          <span className="mini-stat-row__label">{s.label}</span>
          <div className="mini-stat-row__value-wrap">
            <span className="mini-stat-row__value">{s.value}</span>
            {s.unit && <span className="mini-stat-row__unit">{s.unit}</span>}
            {s.delta != null && (
              <span
                className="mini-stat-row__delta"
                style={{ color: parseFloat(s.delta) >= 0 ? 'var(--color-success)' : 'var(--color-flame)' }}
              >
                {parseFloat(s.delta) >= 0 ? '+' : ''}{s.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
