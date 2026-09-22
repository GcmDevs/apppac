import { Activity, House, Smile, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/inicio', label: 'Inicio', icon: House },
  { to: '/sintomas', label: 'Síntomas', icon: Activity },
  { to: '/estado-animo', label: 'Ánimo', icon: Smile },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
];

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación principal">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => isActive ? 'mobile-bottom-nav-link is-active' : 'mobile-bottom-nav-link'}
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
          <span className="mobile-bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
