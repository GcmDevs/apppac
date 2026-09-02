import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuthSession, getAuthSession } from '@/lib/auth';
import { EventSocketBridge } from '@/components/events/EventSocketBridge';
import { getEventInvitationTimingStatus, upsertEventInvitation } from '@/lib/event-invitations';
import {
  getMyEventInvitations,
  onEventInvitationUpdated,
  onNewEventInvitation,
} from '@/lib/events';
import type { NewEventInvitation } from '@/types/event';
import { AppHeader } from './AppHeader';
import { getPageTitle } from './navigation';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { patientNavigationItems } from './navigation';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [invitations, setInvitations] = useState<NewEventInvitation[]>([]);
  const session = getAuthSession();
  const isFocusRoute = location.pathname === '/sintomas' || location.pathname === '/estado-animo';

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;
    const receiveInvitation = (invitation: NewEventInvitation) => {
      if (active) setInvitations(current => upsertEventInvitation(current, invitation));
    };
    const unsubscribeNew = onNewEventInvitation(receiveInvitation);
    const unsubscribeUpdated = onEventInvitationUpdated(receiveInvitation);

    getMyEventInvitations()
      .then(data => {
        if (active) setInvitations(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      unsubscribeNew();
      unsubscribeUpdated();
    };
  }, []);

  const handleLogout = () => {
    setMobileOpen(false);
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  const userName = session?.user.name ?? 'Maria';
  const initials = session?.user.initials ?? 'MR';
  const invitationBadgeCount = invitations.filter(
    invitation => getEventInvitationTimingStatus(invitation) === 'upcoming'
  ).length;

  return (
    <div className="app-layout">
      <EventSocketBridge />
      <Sidebar
        mobileOpen={mobileOpen}
        navigationItems={patientNavigationItems}
        brandTitle='Eklipse Paciente'
        brandSubtitle='Tu bienestar, nuestro apoyo'
        badgeCount={invitationBadgeCount}
        roleLabel='Paciente'
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className="app-content">
        {isFocusRoute ? null : (
          <AppHeader
            pageTitle={getPageTitle(location.pathname, 'patient')}
            userName={userName}
            initials={initials}
            onOpenMobileMenu={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
        )}

        <div className="app-main">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
