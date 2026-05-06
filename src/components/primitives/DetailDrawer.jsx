import { useEffect, useRef } from 'react';
import './DetailDrawer.css';

export default function DetailDrawer({
  isOpen,
  onClose,
  eyebrow = '',
  title,
  headerStats = [],
  primaryAction,
  secondaryAction,
  accentColor = '#2BB3A8',
  children,
}) {
  const panelRef    = useRef(null);
  const prevFocus   = useRef(null);
  const onCloseRef  = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;
    prevFocus.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const getFocusable = () => panel.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const els   = [...getFocusable()];
      const first = els[0];
      const last  = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };

    document.addEventListener('keydown', onKey);
    // Focus the panel container, not the first focusable element,
    // so typing in inputs inside the drawer is not hijacked.
    panel?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="dd-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="dd-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dd-title"
        tabIndex={-1}
      >
        {/* ── Header sticky ── */}
        <div className="dd-header">
          <div className="dd-header-top">
            <button className="dd-close" onClick={onClose} aria-label="Chiudi">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {eyebrow && <span className="dd-eyebrow">{eyebrow}</span>}
          </div>

          <h2 className="dd-title" id="dd-title">{title}</h2>

          {headerStats.length > 0 && (
            <div className="dd-stats">
              {headerStats.map((s, i) => (
                <div key={i} className="dd-stat">
                  <span className="dd-stat-val">
                    {s.value}
                    {s.unit && <span className="dd-stat-unit">{s.unit}</span>}
                  </span>
                  <span className="dd-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="dd-actions">
              {primaryAction && (
                <button
                  className="dd-btn-primary"
                  style={{ '--dd-accent': accentColor }}
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button className="dd-btn-secondary" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="dd-body">
          {children}
        </div>
      </div>
    </div>
  );
}
