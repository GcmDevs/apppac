import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  FileHeart,
  MessageCircleHeart,
  SmilePlus,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import homePortraitWoman from '@/assets/home-portrait-female.png';
import homePortraitMan from '@/assets/home-portrait-male.png';
import { announcements } from '@/data/announcements';
import { getAuthSession } from '@/lib/auth';
import {
  getEventInvitationDateLabel,
  getEventInvitationTimingStatus,
  upsertEventInvitation,
} from '@/lib/event-invitations';
import {
  getMyEventInvitations,
  onEventInvitationUpdated,
  onNewEventInvitation,
} from '@/lib/events';
import type { NewEventInvitation } from '@/types/event';

export function HomePage() {
  const [invitations, setInvitations] = useState<NewEventInvitation[]>([]);
  const session = getAuthSession();
  const userName = session?.user.name ?? 'Paciente';
  const avatarVariant = session?.user.avatarVariant ?? 'female';
  const heroImage = avatarVariant === 'male' ? homePortraitMan : homePortraitWoman;
  const welcomeLabel = avatarVariant === 'male' ? 'Bienvenido' : 'Bienvenida';
  const upcomingInvitations = invitations
    .filter(invitation => getEventInvitationTimingStatus(invitation) === 'upcoming')
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const featuredInvitation = upcomingInvitations[0] ?? null;
  const dateLabel = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

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

  return (
    <main className='page-shell home-dashboard'>
      <section className='home-hero-panel home-hero-panel-redesign'>
        <div className='home-hero-copy'>
          <div className='home-hero-kicker'>
            <Sparkles size={16} aria-hidden='true' />
            <span>Tu espacio de bienestar</span>
          </div>
          <h2>
            {welcomeLabel}, {userName}!
          </h2>
          <p>
            Aquí puedes registrar cómo te sientes, hacer seguimiento a tus síntomas y mantenerte
            al día durante tu proceso.
          </p>
          <div className='home-hero-actions'>
            <Link to='/estado-animo' className='home-primary-action'>
              <SmilePlus size={18} aria-hidden='true' />
              ¿Cómo te sientes hoy?
              <ArrowRight size={17} aria-hidden='true' />
            </Link>
            <Link to='/sintomas' className='home-secondary-action'>
              Registrar síntomas
            </Link>
          </div>
        </div>

        <div className='home-hero-visual' aria-hidden='true'>
          <img src={heroImage} alt='' className='home-hero-image' />
        </div>
      </section>

      <section className='home-status-strip' aria-label='Resumen general'>
        <p>Hoy es {dateLabel}</p>
        <div>
          <span className='home-status-dot' aria-hidden='true' />
          Tu información está al día
        </div>
      </section>

      <section className='home-action-grid' aria-label='Acciones principales'>
        <Link to='/sintomas' className='home-action-card home-action-card-symptoms'>
          <span className='home-action-icon' aria-hidden='true'>
            <Activity size={22} />
          </span>
          <span className='home-action-copy'>
            <strong>Registrar síntomas</strong>
            <small>Cuéntanos qué necesitas hoy.</small>
          </span>
          <ChevronRight size={19} aria-hidden='true' />
        </Link>
        <Link to='/historial' className='home-action-card home-action-card-history'>
          <span className='home-action-icon' aria-hidden='true'>
            <FileHeart size={22} />
          </span>
          <span className='home-action-copy'>
            <strong>Ver mi historial</strong>
            <small>Consulta tus registros anteriores.</small>
          </span>
          <ChevronRight size={19} aria-hidden='true' />
        </Link>
      </section>

      <section className='home-content-grid'>
        <section className='home-invitations-panel' aria-labelledby='home-invitations-title'>
          <div className='home-section-heading'>
            <div>
              <p className='eyebrow'>Para ti</p>
              <h3 id='home-invitations-title'>Próximas actividades</h3>
            </div>
            <Link to='/invitaciones' className='home-section-link'>
              Ver todas <ArrowRight size={16} aria-hidden='true' />
            </Link>
          </div>
          <p className='home-section-description'>Encuentros y actividades para acompañarte.</p>

          {featuredInvitation ? (
            <Link
              to={`/invitaciones/${featuredInvitation.invitationId}`}
              className='home-featured-invitation'
            >
              <div className='home-featured-icon' aria-hidden='true'>
                <CalendarDays size={20} />
              </div>
              <div className='home-featured-copy'>
                <span className='home-event-label'>Próximo encuentro</span>
                <strong>{featuredInvitation.title}</strong>
                <p>{featuredInvitation.description}</p>
                <span>Fecha: {getEventInvitationDateLabel(featuredInvitation)}</span>
              </div>
              <ChevronRight size={18} aria-hidden='true' />
            </Link>
          ) : (
            <Link to='/invitaciones' className='home-featured-invitation home-featured-invitation-empty'>
              <div className='home-featured-icon' aria-hidden='true'>
                <CalendarDays size={20} />
              </div>
              <div className='home-featured-copy'>
                <strong>No tienes actividades pendientes</strong>
                <p>Te avisaremos cuando haya un nuevo encuentro para ti.</p>
              </div>
              <ChevronRight size={18} aria-hidden='true' />
            </Link>
          )}
        </section>

        <aside className='home-support-card' aria-labelledby='home-support-title'>
          <span className='home-support-icon' aria-hidden='true'>
            <MessageCircleHeart size={23} />
          </span>
          <p className='eyebrow'>Acompañamiento</p>
          <h3 id='home-support-title'>¿Necesitas ayuda?</h3>
          <p>Si tienes una inquietud, escríbenos por el canal de mensajes.</p>
          <Link to='/chat' className='home-support-link'>
            Ir a mensajes <ArrowRight size={16} aria-hidden='true' />
          </Link>
        </aside>
      </section>

      <section className='home-announcements' aria-labelledby='home-announcements-title'>
        <div className='home-section-heading'>
          <div>
            <p className='eyebrow'>Información útil</p>
            <h3 id='home-announcements-title'>Novedades para ti</h3>
          </div>
          <span className='home-announcements-count'>
            <Bell size={15} aria-hidden='true' /> {announcements.length} novedades
          </span>
        </div>
        <div className='home-announcement-list'>
          {announcements.slice(0, 2).map(announcement => (
            <article key={announcement.id} className='home-announcement-card'>
              <span className='home-announcement-category'>{announcement.category}</span>
              <h4>{announcement.title}</h4>
              <p>{announcement.description}</p>
              <small>{announcement.publishedAt}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
