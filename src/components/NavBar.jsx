import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/corpo-mente', label: 'Corpo & Mente' },
  { to: '/money-lavoro', label: 'Money & Lavoro' },
  { to: '/relazioni', label: 'Relazioni' },
  { to: '/liberta', label: 'Libertà' },
  { to: '/progetto-digitale', label: 'Progetto Digitale' },
];

export default function NavBar() {
  return (
    <nav>
      {links.map(({ to, label }) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
