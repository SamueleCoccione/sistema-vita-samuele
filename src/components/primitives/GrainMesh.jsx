import { useId } from 'react';
import './primitives.css';

/**
 * variant="default" — absolute, strong mesh.
 * variant="muted"   — blurred + attenuated, placed behind bento cards.
 * showAccent        — renders the per-tab accent color overlay (only on the strong layer).
 */
export default function GrainMesh({ variant = 'default', showAccent = false }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className={`gm-root${variant !== 'default' ? ` gm-root--${variant}` : ''}`} aria-hidden="true">
      {showAccent && <div className="gm-accent" />}
      <svg className="gm-noise" xmlns="http://www.w3.org/2000/svg">
        <filter id={`gm-n-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#gm-n-${uid})`} />
      </svg>
    </div>
  );
}
