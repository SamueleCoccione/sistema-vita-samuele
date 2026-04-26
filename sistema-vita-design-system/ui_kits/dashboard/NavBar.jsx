// Sistema di Vita — NavBar component
// Shared navigation bar

const NAV_LINKS = [
  { id: 'dashboard',        label: 'Dashboard'         },
  { id: 'corpo-mente',      label: 'Corpo & Mente'     },
  { id: 'money-lavoro',     label: 'Money & Lavoro'    },
  { id: 'relazioni',        label: 'Relazioni'         },
  { id: 'liberta',          label: 'Libertà'           },
  { id: 'progetto-digitale',label: 'Progetto Digitale' },
];

function NavBar({ active, onNav }) {
  return React.createElement('nav', { style: navBarStyles.nav },
    NAV_LINKS.map(({ id, label }) =>
      React.createElement('a', {
        key: id,
        href: '#',
        onClick: (e) => { e.preventDefault(); onNav(id); },
        style: {
          ...navBarStyles.link,
          ...(active === id ? navBarStyles.linkActive : {}),
        },
        onMouseEnter: (e) => { if (active !== id) e.target.style.color = '#ffffff'; },
        onMouseLeave: (e) => { if (active !== id) e.target.style.color = '#555555'; },
      }, label)
    )
  );
}

const navBarStyles = {
  nav: {
    display: 'flex',
    background: '#1a1a1a',
    borderBottom: 'none',
    flexWrap: 'wrap',
  },
  link: {
    textDecoration: 'none',
    color: '#555555',
    padding: '14px 22px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    borderRight: '1px solid #2a2a2a',
    transition: 'color 0.12s',
    cursor: 'pointer',
  },
  linkActive: {
    color: '#c8f564',
  },
};

Object.assign(window, { NavBar });
