import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  ChevronRight,
  HeartHandshake,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getEventInvitationAccent,
  getEventInvitationDateLabel,
  getEventInvitationTimeLabel,
  getEventInvitationTimingStatus,
  type EventInvitationAccent,
  upsertEventInvitation,
} from '@/lib/event-invitations';
import {
  getMyEventInvitations,
  onEventInvitationUpdated,
  onNewEventInvitation,
} from '@/lib/events';
import type { NewEventInvitation } from '@/types/event';

type InvitationTab = 'all' | 'upcoming' | 'past';

const tabs: Array<{ id: InvitationTab; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'past', label: 'Pasadas' },
];

export function InvitationsPage() {
  const [activeTab, setActiveTab] = useState<InvitationTab>('all');
  const [invitations, setInvitations] = useState<NewEventInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      .catch(loadError => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible consultar tus invitaciones.'
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribeNew();
      unsubscribeUpdated();
    };
  }, []);

  const visibleInvitations = useMemo(() => {
    const orderedInvitations = [...invitations].sort((left, right) => {
      const leftStatus = getEventInvitationTimingStatus(left);
      const rightStatus = getEventInvitationTimingStatus(right);
      if (leftStatus !== rightStatus) return leftStatus === 'upcoming' ? -1 : 1;

      const direction = leftStatus === 'upcoming' ? 1 : -1;
      return (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) * direction;
    });

    return activeTab === 'all'
      ? orderedInvitations
      : orderedInvitations.filter(
          invitation => getEventInvitationTimingStatus(invitation) === activeTab
        );
  }, [activeTab, invitations]);
  const upcomingCount = invitations.filter(
    invitation => getEventInvitationTimingStatus(invitation) === 'upcoming'
  ).length;

  return (
    <main className='page-shell invitation-page'>
      <section className='invitation-shell'>
        <header className='invitation-topbar'>
          <Link to='/inicio' className='invitation-back-link' aria-label='Volver al inicio'>
            <ArrowLeft size={18} />
          </Link>
          <h1>Invitaciones</h1>
          <span className='invitation-topbar-mark' aria-hidden='true'>
            <BellRing size={18} />
          </span>
        </header>

        <section className='invitation-intro' aria-labelledby='invitation-intro-title'>
          <div className='invitation-intro-icon' aria-hidden='true'>
            <CalendarDays size={22} />
          </div>
          <div>
            <p className='eyebrow'>Eventos y actividades</p>
            <h2 id='invitation-intro-title'>Encuentros pensados para ti</h2>
            <p>Revisa los detalles y confirma si puedes asistir.</p>
          </div>
          <span className='invitation-upcoming-count'>
            {upcomingCount} {upcomingCount === 1 ? 'próxima' : 'próximas'}
          </span>
        </section>

        <nav className='invitation-tabs' aria-label='Filtros de invitaciones'>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                className={isActive ? 'invitation-tab invitation-tab-active' : 'invitation-tab'}
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className='invitation-list' aria-live='polite'>
          {isLoading ? (
            <article className='admin-empty-state invitation-state-card'>
              <strong>Consultando tus invitaciones...</strong>
            </article>
          ) : null}

          {!isLoading && error ? (
            <article className='admin-empty-state invitation-state-card' role='alert'>
              <strong>No pudimos cargar tus invitaciones.</strong>
              <span>{error}</span>
            </article>
          ) : null}

          {!isLoading && !error
            ? visibleInvitations.map(invitation => {
                const accent = getEventInvitationAccent(invitation.invitationId);
                const timingStatus = getEventInvitationTimingStatus(invitation);
                return (
                  <Link
                    key={invitation.invitationId}
                    to={`/invitaciones/${invitation.invitationId}`}
                    className={`invitation-list-card invitation-list-card-${accent}`}
                  >
                    <div
                      className={`invitation-list-icon invitation-list-icon-${accent}`}
                      aria-hidden='true'
                    >
                      {getInvitationIcon(accent)}
                    </div>

                    <div className='invitation-list-copy'>
                      <strong>{invitation.title}</strong>
                      <span className='invitation-list-time'>
                        <CalendarDays size={14} aria-hidden='true' />
                        {`${getEventInvitationDateLabel(invitation)} · ${getEventInvitationTimeLabel(invitation)}`}
                      </span>
                      <span className='invitation-list-location'>
                        <MapPin size={14} aria-hidden='true' />
                        {invitation.location}
                      </span>
                    </div>

                    <div className='invitation-list-end'>
                      <span
                        className={
                          timingStatus === 'upcoming'
                            ? `invitation-status-pill invitation-status-pill-${accent}`
                            : 'invitation-status-pill invitation-status-pill-past'
                        }
                      >
                        {timingStatus === 'upcoming' ? 'Próxima' : 'Pasada'}
                      </span>
                      <ChevronRight size={16} aria-hidden='true' />
                    </div>
                  </Link>
                );
              })
            : null}

          {!isLoading && !error && visibleInvitations.length === 0 ? (
            <article className='admin-empty-state invitation-state-card'>
              <strong>
                No tienes invitaciones{' '}
                {activeTab === 'all'
                  ? 'registradas'
                  : activeTab === 'upcoming'
                    ? 'próximas'
                    : 'pasadas'}
                .
              </strong>
              <span>Cuando te inviten a un evento aparecerá en esta sección.</span>
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function getInvitationIcon(accent: EventInvitationAccent) {
  if (accent === 'purple') return <Users size={18} />;
  if (accent === 'amber') return <HeartHandshake size={18} />;
  if (accent === 'rose') return <Sparkles size={18} />;
  return <CalendarDays size={18} />;
}
