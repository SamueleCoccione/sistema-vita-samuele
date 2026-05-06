import { useState, useEffect, useRef } from 'react';
import './primitives.css';

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

export default function StatNumber({ value, size = 'md', unit, suffix, color, style }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const isInt  = Number.isInteger(Number(value));

  useEffect(() => {
    if (value === null || value === undefined) return;
    const end = parseFloat(value);
    const start = 0;
    const duration = 800;
    const t0 = performance.now();

    function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      const cur = start + (end - start) * easeOutCubic(p);
      setDisplay(isInt ? Math.round(cur) : parseFloat(cur.toFixed(1)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span className={`stat-number stat-number--${size}`} style={{ color, ...style }}>
      <span className="stat-number__value">{display}</span>
      {(unit || suffix) && <span className="stat-number__unit">{unit || suffix}</span>}
    </span>
  );
}
