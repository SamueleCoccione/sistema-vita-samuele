import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/corpo-mente', label: 'Corpo & Mente' },
  { to: '/money-lavoro', label: 'Money & Lavoro' },
  { to: '/relazioni', label: 'Relazioni' },
  { to: '/liberta', label: 'Libertà' },
  { to: '/progetto-digitale', label: 'Progetto Digitale' },
];

export default function NavBar({ logout }) {
  return (
    <nav>
      {links.map(({ to, label }) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {label}
        </NavLink>
      ))}
      <button
        onClick={logout}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: 'var(--nav-link)',
          fontSize: 11,
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '0 12px',
          height: '100%',
        }}
        onMouseEnter={e => e.target.style.color = 'var(--nav-hover)'}
        onMouseLeave={e => e.target.style.color = 'var(--nav-link)'}
      >
        Esci
      </button>
    </nav>
  );
}
