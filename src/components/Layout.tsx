import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconBack, IconCat, IconGear, IconHeart, IconHome, IconLock, IconMusic, IconTv } from './icons';
import { Blossom } from './deco';
import { lockVault } from '../lib/vault';
import { useEffect } from 'react';
import { MiniPlayer } from './MiniPlayer';

const TITLES: Record<string, string> = {
  '/': 'Seoulmate',
  '/bts': 'BTS World',
  '/dramas': 'K-Drama Diary',
  '/gatito': 'Cat Café',
  '/nosotros': 'Nuestro capítulo',
  '/diario': 'Mi diario',
  '/ajustes': 'Ajustes',
};

const NAV = [
  { to: '/', label: 'Inicio', icon: IconHome },
  { to: '/bts', label: 'BTS', icon: IconMusic },
  { to: '/dramas', label: 'Dramas', icon: IconTv },
  { to: '/gatito', label: 'Gatito', icon: IconCat },
  { to: '/nosotros', label: 'Nosotros', icon: IconHeart },
];

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inNav = NAV.some((n) => n.to === pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app">
      <header className="topbar">
        {!inNav && (
          <button className="iconbtn" onClick={() => navigate('/')} aria-label="Volver al inicio">
            <IconBack />
          </button>
        )}
        <h1>
          {pathname === '/' && <Blossom size={22} />}
          {TITLES[pathname] ?? 'Seoulmate'}
        </h1>
        <NavLink to="/ajustes" className="iconbtn" aria-label="Ajustes">
          <IconGear />
        </NavLink>
        <button className="iconbtn" onClick={() => lockVault()} aria-label="Bloquear ahora" title="Bloquear">
          <IconLock />
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <MiniPlayer />
      <nav className="bottomnav" aria-label="Secciones">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="navdot">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
