import { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/',                  label: 'Dashboard',         color: '#9E9589' },
  { to: '/corpo-mente',       label: 'Corpo & Mente',     color: '#2BB3A8' },
  { to: '/money-lavoro',      label: 'Money & Lavoro',    color: '#FF6B35' },
  { to: '/relazioni',         label: 'Relazioni',         color: '#E0428A' },
  { to: '/liberta',           label: 'Libertà',           color: '#9B5CD9' },
  { to: '/progetto-digitale', label: 'Progetto Digitale', color: '#D4E04A' },
];

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function NavBar({ logout }) {
  const navRef  = useRef(null);
  const location = useLocation();

  /* Auto-center active item on mobile */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector('[aria-current="page"]');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [location.pathname]);

  /* Set per-tab accent color on :root for GrainMesh overlay */
  useEffect(() => {
    const link = LINKS.find(l =>
      l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)
    );
    if (link) {
      document.documentElement.style.setProperty('--gm-tab-accent', link.color);
    }
  }, [location.pathname]);

  return (
    <header className="topnav-wrap">
      <nav className="topnav-pill" ref={navRef} aria-label="Navigazione principale">
        {LINKS.map(({ to, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `topnav-item${isActive ? ' topnav-item--active' : ''}`}
            style={({ isActive }) => isActive ? { '--item-color': color } : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="topnav-dot" aria-hidden="true" />}
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button className="topnav-logout" onClick={logout} aria-label="Esci">
        <LogoutIcon />
        <span className="topnav-logout-label">Esci</span>
      </button>
    </header>
  );
}
