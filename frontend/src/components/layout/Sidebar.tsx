import {
  Headset,
  LogOut,
  Sprout,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { NavigationItem } from './navigation'

type SidebarProps = {
  mobileOpen: boolean
  navigationItems: NavigationItem[]
  brandTitle: string
  brandSubtitle: string
  badgeCount?: number
  roleLabel: string
  onCloseMobile: () => void
  onLogout: () => void
}

export function Sidebar({
  mobileOpen,
  navigationItems,
  brandTitle,
  brandSubtitle,
  badgeCount = 0,
  roleLabel,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const navigationGroups =
    roleLabel === 'Paciente'
      ? [
          {
            label: 'Seguimiento',
            paths: ['/inicio', '/estado-animo', '/sintomas', '/historial'],
          },
          {
            label: 'Conexión',
            paths: ['/invitaciones', '/chat'],
          },
          {
            label: 'Cuenta',
            paths: ['/preguntas-frecuentes', '/perfil'],
          },
        ]
      : [
          {
            label: 'Navegación',
            paths: navigationItems.map(item => item.to),
          },
        ];

  return (
    <>
      <div
        className={mobileOpen ? 'drawer-backdrop drawer-backdrop-open' : 'drawer-backdrop'}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={mobileOpen ? 'sidebar sidebar-mobile-open' : 'sidebar'}
        aria-label="Navegacion principal"
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-mark brand-mark-small" aria-hidden="true">
              <Sprout size={18} />
            </div>
            <div className="sidebar-brand-copy">
              <strong>{brandTitle}</strong>
              <span>{brandSubtitle}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Secciones de navegación">
          {navigationGroups.map(group => {
            const groupItems = navigationItems.filter(item => group.paths.includes(item.to));

            if (!groupItems.length) {
              return null;
            }

            return (
              <section className="sidebar-nav-group" key={group.label} aria-label={group.label}>
                <p className="sidebar-nav-label">{group.label}</p>
                <ul>
                  {groupItems.map(item => {
                    const Icon = item.icon;
                    const hasInvitationBadge = badgeCount > 0 && item.to.includes('/invitaciones');

                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end
                          title={item.label}
                          aria-label={
                            hasInvitationBadge ? `${item.label}, ${badgeCount} activas` : item.label
                          }
                          className={({ isActive }) =>
                            isActive
                              ? 'sidebar-link sidebar-link-active'
                              : 'sidebar-link'
                          }
                          onClick={onCloseMobile}
                        >
                          <Icon size={19} aria-hidden="true" />
                          <span className="sidebar-link-text">{item.label}</span>
                          {hasInvitationBadge ? (
                            <span className="sidebar-link-badge" aria-hidden="true">
                              {badgeCount}
                            </span>
                          ) : null}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/preguntas-frecuentes"
            className="sidebar-help-card"
            onClick={onCloseMobile}
          >
            <span className="sidebar-help-icon" aria-hidden="true">
              <Headset size={18} />
            </span>
            <span className="sidebar-help-copy">
              <strong>¿Necesitas ayuda?</strong>
              <small>
                {roleLabel === 'Administrador'
                  ? 'Administra y acompaña con claridad'
                  : 'Estamos aquí para ti'}
              </small>
            </span>
          </NavLink>

          <button
            type="button"
            className="sidebar-link sidebar-link-button"
            title="Cerrar sesión"
            onClick={onLogout}
          >
            <span className="sidebar-link-icon-wrap">
              <LogOut size={18} aria-hidden="true" className="logout-icon" />
            </span>
            <span className="sidebar-link-text">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
