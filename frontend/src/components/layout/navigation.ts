import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  CalendarDays,
  CircleHelp,
  History,
  House,
  LayoutDashboard,
  MessageCircle,
  Smile,
  UserRound,
  Users,
} from 'lucide-react';
import type { UserRole } from '@/types/auth';

export type NavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
  title: string;
  icon: LucideIcon;
};

export const patientNavigationItems: NavigationItem[] = [
  {
    to: '/inicio',
    label: 'Inicio',
    shortLabel: 'Inicio',
    title: 'Inicio',
    icon: House,
  },
  {
    to: '/estado-animo',
    label: 'Como me siento hoy',
    shortLabel: 'Animo',
    title: 'Como me siento hoy',
    icon: Smile,
  },
  {
    to: '/sintomas',
    label: 'Reportar sintomas',
    shortLabel: 'Sintomas',
    title: 'Reportar sintomas',
    icon: Activity,
  },
  {
    to: '/invitaciones',
    label: 'Invitaciones',
    shortLabel: 'Invitaciones',
    title: 'Invitaciones',
    icon: CalendarDays,
  },
  {
    to: '/chat',
    label: 'Mensajes',
    shortLabel: 'Chat',
    title: 'Mensajes',
    icon: MessageCircle,
  },
  {
    to: '/historial',
    label: 'Mi historial',
    shortLabel: 'Historial',
    title: 'Mi historial',
    icon: History,
  },
  {
    to: '/preguntas-frecuentes',
    label: 'Preguntas frecuentes',
    shortLabel: 'Ayuda',
    title: 'Preguntas frecuentes',
    icon: CircleHelp,
  },
  {
    to: '/perfil',
    label: 'Mi perfil',
    shortLabel: 'Perfil',
    title: 'Mi perfil',
    icon: UserRound,
  },
];

export const adminNavigationItems: NavigationItem[] = [
  {
    to: '/admin/inicio',
    label: 'Inicio',
    shortLabel: 'Inicio',
    title: 'Panel clinico',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/pacientes',
    label: 'Pacientes',
    shortLabel: 'Pacientes',
    title: 'Monitoreo de pacientes',
    icon: Users,
  },
  {
    to: '/admin/eventos',
    label: 'Eventos',
    shortLabel: 'Eventos',
    title: 'Gestión de eventos',
    icon: CalendarDays,
  },
  {
    to: '/admin/perfil',
    label: 'Mi perfil',
    shortLabel: 'Perfil',
    title: 'Perfil administrador',
    icon: UserRound,
  },
];

export function getNavigationItemsByRole(role: UserRole) {
  return role === 'admin' ? adminNavigationItems : patientNavigationItems;
}

export function getPageTitle(pathname: string, role: UserRole) {
  const navigationItems = getNavigationItemsByRole(role);
  const exactMatch = navigationItems.find(entry => entry.to === pathname);

  if (exactMatch) {
    return exactMatch.title;
  }

  if (role === 'admin' && pathname.startsWith('/admin/pacientes/')) {
    return 'Detalle del paciente';
  }

  if (role === 'admin' && pathname === '/admin/eventos/nuevo') {
    return 'Crear evento';
  }

  if (role === 'admin' && pathname.includes('/admin/eventos/') && pathname.endsWith('/editar')) {
    return 'Modificar evento';
  }

  return 'Ruta no encontrada';
}
