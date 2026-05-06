import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SIZES = [
  { key: 'S', label: 'Piccolo' },
  { key: 'M', label: 'Medio'   },
  { key: 'L', label: 'Grande'  },
];

export default function SortableWidget({ id, size, isEditMode, onSizeChange, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => { if (!isEditMode) setMenuOpen(false); }, [isEditMode]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-size={size}
      className="sortable-widget"
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
    >
      <div className={`sw-inner${isEditMode ? ' sw-inner--edit' : ''}${isDragging ? ' sw-inner--dragging' : ''}`}>
        {isEditMode && (
          <div className="sw-edit-overlay" ref={menuRef}>
            <button
              className="sw-menu-btn"
              aria-label="Ridimensiona widget"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              onPointerDown={e => e.stopPropagation()}
            >
              ···
            </button>
            {menuOpen && (
              <div className="sw-menu-popover" role="menu">
                {SIZES.map(s => (
                  <button
                    key={s.key}
                    role="menuitem"
                    className={`sw-menu-item${size === s.key ? ' sw-menu-item--active' : ''}`}
                    onClick={e => { e.stopPropagation(); onSizeChange(id, s.key); setMenuOpen(false); }}
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <span className="sw-menu-item-key">{s.key}</span>
                    <span className="sw-menu-item-label">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={`sw-content${isEditMode ? ' sw-content--locked' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
