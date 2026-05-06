import { useEffect } from 'react';
import './primitives.css';

export default function FullModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fmodal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fmodal-panel">
        {/* Header dark — stesso DNA della navbar */}
        <div className="fmodal-header">
          <button className="fmodal-back" onClick={onClose} aria-label="Indietro">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Indietro</span>
          </button>
          <span className="fmodal-title">{title}</span>
          <button className="fmodal-close" onClick={onClose} aria-label="Chiudi">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {/* Body scrollabile — sfondo carta premium */}
        <div className="fmodal-body">{children}</div>
        {/* Grain overlay */}
        <div className="fmodal-grain" aria-hidden="true" />
      </div>
    </div>
  );
}
