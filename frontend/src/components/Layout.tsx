import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/play', label: 'Play' },
  { to: '/explore', label: 'Explore' },
  { to: '/editor', label: 'Editor' },
  { to: '/login', label: 'Login' },
];

export default function Layout() {
  return (
    <>
      <header>
        <nav aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
