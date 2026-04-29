import { NavLink } from 'react-router-dom';

const links = [
  {
    to: '/', label: 'Home', labelFull: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/corpo-mente', label: 'Corpo', labelFull: 'Corpo & Mente',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    to: '/money-lavoro', label: 'Money', labelFull: 'Money & Lavoro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    to: '/relazioni', label: 'Social', labelFull: 'Relazioni',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/liberta', label: 'Libertà', labelFull: 'Libertà',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    to: '/progetto-digitale', label: 'Progetto', labelFull: 'Progetto Digitale',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
];

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function NavBar({ logout }) {
  return (
    <>
      {/* ── Desktop top nav ── */}
      <nav className="nav-desktop">
        {links.map(({ to, labelFull }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {labelFull}
          </NavLink>
        ))}
        <button className="nav-logout-btn" onClick={logout}>Esci</button>
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="nav-mobile-bar">
        <span className="nav-mobile-title">Sistema di Vita</span>
        <button className="nav-mobile-logout" onClick={logout}>
          <LogoutIcon />
        </button>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="nav-bottom">
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav-bottom-item">
            <span className="nav-bottom-icon">{icon}</span>
            <span className="nav-bottom-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
