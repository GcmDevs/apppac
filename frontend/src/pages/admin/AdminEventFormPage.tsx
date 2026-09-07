import { CalendarPlus, Info, PencilLine, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuthSession } from '@/lib/auth';
import { createEvent, getEventAudience, getMyCreatedEvents, updateEvent } from '@/lib/events';
import type { EventAudienceArea } from '@/types/event';

type EventFormState = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  organizerDescription: string;
};

type FormFeedback = {
  kind: 'error' | 'success';
  message: string;
} | null;

export function AdminEventFormPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const numericEventId = Number(eventId);
  const isEditing = eventId !== undefined;
  const session = getAuthSession();
  const [form, setForm] = useState<EventFormState>(createInitialForm);
  const [feedback, setFeedback] = useState<FormFeedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditing);
  const [areas, setAreas] = useState<EventAudienceArea[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<Set<number>>(new Set());
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<number>>(new Set());
  const [patientQuery, setPatientQuery] = useState('');
  const [isLoadingAudience, setIsLoadingAudience] = useState(!isEditing);

  useEffect(() => {
    if (isEditing) return;
    let active = true;

    getEventAudience()
      .then(result => {
        if (active) setAreas(result);
      })
      .catch(error => {
        if (active) {
          setFeedback({
            kind: 'error',
            message: error instanceof Error ? error.message : 'No fue posible cargar las áreas.',
          });
        }
      })
      .finally(() => {
        if (active) setIsLoadingAudience(false);
      });

    return () => {
      active = false;
    };
  }, [isEditing]);

  const selectedPatients = useMemo(() => {
    const patients = new Map<number, EventAudienceArea['patients'][number]>();
    for (const area of areas) {
      for (const patient of area.patients) {
        if (selectedPatientIds.has(patient.userId)) patients.set(patient.userId, patient);
      }
    }
    const query = patientQuery.trim().toLocaleLowerCase('es');
    return [...patients.values()]
      .filter(
        patient =>
          !query ||
          patient.fullName.toLocaleLowerCase('es').includes(query) ||
          patient.document.toLocaleLowerCase('es').includes(query)
      )
      .sort((left, right) => left.fullName.localeCompare(right.fullName, 'es'));
  }, [areas, patientQuery, selectedPatientIds]);

  const toggleArea = (area: EventAudienceArea) => {
    const selecting = !selectedAreaIds.has(area.id);
    const nextAreaIds = new Set(selectedAreaIds);
    selecting ? nextAreaIds.add(area.id) : nextAreaIds.delete(area.id);

    const nextPatientIds = new Set(selectedPatientIds);
    if (selecting) {
      area.patients.forEach(patient => nextPatientIds.add(patient.userId));
    } else {
      const patientsKeptByOtherAreas = new Set(
        areas
          .filter(current => nextAreaIds.has(current.id))
          .flatMap(current => current.patients.map(patient => patient.userId))
      );
      area.patients.forEach(patient => {
        if (!patientsKeptByOtherAreas.has(patient.userId)) nextPatientIds.delete(patient.userId);
      });
    }

    setSelectedAreaIds(nextAreaIds);
    setSelectedPatientIds(nextPatientIds);
    setFeedback(null);
  };

  useEffect(() => {
    if (!isEditing) return;
    let active = true;

    getMyCreatedEvents()
      .then(events => {
        if (!active) return;
        const event = events.find(current => current.id === numericEventId);
        if (!event) {
          setFeedback({
            kind: 'error',
            message: 'El evento no existe o no fue registrado por este usuario.',
          });
          return;
        }

        setForm({
          title: event.title,
          description: event.description,
          location: event.location,
          startsAt: toDateTimeLocalValue(new Date(event.startsAt)),
          endsAt: toDateTimeLocalValue(new Date(event.endsAt)),
          organizerDescription: event.organizerDescription,
        });
      })
      .catch(error => {
        if (active) {
          setFeedback({
            kind: 'error',
            message: error instanceof Error ? error.message : 'No fue posible cargar el evento.',
          });
        }
      })
      .finally(() => {
        if (active) setIsLoadingEvent(false);
      });

    return () => {
      active = false;
    };
  }, [isEditing, numericEventId]);

  const updateField = (field: keyof EventFormState, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setFeedback(null);
  };

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setFeedback({ kind: 'error', message: 'Selecciona un rango de fechas válido.' });
      return;
    }

    if (endsAt <= startsAt) {
      setFeedback({
        kind: 'error',
        message: 'La fecha de finalización debe ser posterior a la fecha de inicio.',
      });
      return;
    }

    if (!isEditing && selectedPatientIds.size === 0) {
      setFeedback({ kind: 'error', message: 'Selecciona al menos un paciente para invitar.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        organizerDescription: form.organizerDescription.trim(),
      };
      const savedEvent = isEditing
        ? await updateEvent({ ...eventInput, eventId: numericEventId })
        : await createEvent({ ...eventInput, inviteeUserIds: [...selectedPatientIds] });

      if (!isEditing) {
        setForm(createInitialForm());
        setSelectedAreaIds(new Set());
        setSelectedPatientIds(new Set());
        setPatientQuery('');
      }
      setFeedback({
        kind: 'success',
        message: isEditing
          ? `Evento actualizado. Se notificó el cambio a ${savedEvent.connectedUsersCount} paciente${savedEvent.connectedUsersCount === 1 ? '' : 's'} invitado${savedEvent.connectedUsersCount === 1 ? '' : 's'} y conectado${savedEvent.connectedUsersCount === 1 ? '' : 's'}.`
          : `Evento creado con ${savedEvent.invitedUsersCount} invitación${savedEvent.invitedUsersCount === 1 ? '' : 'es'} para pacientes registrados. Se entregó en tiempo real a ${savedEvent.connectedUsersCount} paciente${savedEvent.connectedUsersCount === 1 ? '' : 's'} invitado${savedEvent.connectedUsersCount === 1 ? '' : 's'} y conectado${savedEvent.connectedUsersCount === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : `No fue posible ${isEditing ? 'modificar' : 'crear'} el evento.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='page-shell admin-page'>
      <section className='admin-page-header'>
        <div>
          <p className='eyebrow'>Eventos</p>
          <h2>{isEditing ? 'Modificar evento' : 'Crear un nuevo evento'}</h2>
          <p>
            {isEditing
              ? 'Actualiza la información que verán los pacientes invitados.'
              : 'Define la información pública y el rango de fechas del evento.'}
          </p>
        </div>
        <span className='event-header-icon' aria-hidden='true'>
          <CalendarPlus size={24} />
        </span>
      </section>

      <aside className='event-owner-note'>
        <Info size={19} aria-hidden='true' />
        <div>
          <strong>Propietario privado</strong>
          <span>
            El evento {isEditing ? 'está' : 'se asociará'} al usuario autenticado{' '}
            {session?.user.name ?? ''}. Este dato no se muestra como información pública del
            organizador.
          </span>
        </div>
      </aside>

      <form className='admin-form' onSubmit={handleSubmit}>
        <section className='admin-form-grid'>
          <label className='field-group'>
            <span>Título</span>
            <input
              className='admin-input'
              value={form.title}
              maxLength={160}
              onChange={event => updateField('title', event.target.value)}
              placeholder='Nombre del evento'
              required
            />
          </label>

          <label className='field-group'>
            <span>Organizador visible al público</span>
            <input
              className='admin-input'
              value={form.organizerDescription}
              maxLength={200}
              onChange={event => updateField('organizerDescription', event.target.value)}
              placeholder='Ej. Equipo de Bienestar Eklipse'
              required
            />
          </label>

          <label className='field-group admin-field-span'>
            <span>Descripción</span>
            <textarea
              className='admin-input admin-textarea'
              value={form.description}
              onChange={event => updateField('description', event.target.value)}
              placeholder='Describe el propósito y los detalles importantes del evento'
              required
            />
          </label>

          <label className='field-group admin-field-span'>
            <span>Lugar</span>
            <input
              className='admin-input'
              value={form.location}
              maxLength={250}
              onChange={event => updateField('location', event.target.value)}
              placeholder='Dirección, sede o enlace de conexión'
              required
            />
          </label>

          <label className='field-group'>
            <span>Fecha y hora de inicio</span>
            <input
              type='datetime-local'
              className='admin-input'
              value={form.startsAt}
              onChange={event => updateField('startsAt', event.target.value)}
              required
            />
          </label>

          <label className='field-group'>
            <span>Fecha y hora de finalización</span>
            <input
              type='datetime-local'
              className='admin-input'
              value={form.endsAt}
              min={form.startsAt}
              onChange={event => updateField('endsAt', event.target.value)}
              required
            />
          </label>
        </section>

        {!isEditing ? <section className='admin-panel event-invite-panel'>
          <header className='admin-panel-header'>
            <div>
              <h3>Seleccionar invitados por área</h3>
              <p>
                Elige una o varias áreas. Sus pacientes se agregarán a la lista y podrás descartar
                individualmente a quienes no quieras invitar.
              </p>
            </div>
            <Users size={20} aria-hidden='true' />
          </header>

          {isLoadingAudience ? (
            <p className='event-audience-status'>Cargando áreas y pacientes...</p>
          ) : areas.length === 0 ? (
            <p className='event-audience-status'>No hay áreas con pacientes disponibles.</p>
          ) : (
            <>
              <div className='event-area-grid'>
                {areas.map(area => (
                  <label className='event-area-option' key={area.id}>
                    <input
                      type='checkbox'
                      checked={selectedAreaIds.has(area.id)}
                      disabled={area.patients.length === 0}
                      onChange={() => toggleArea(area)}
                    />
                    <span>
                      <strong>{area.name}</strong>
                      <small>
                        {area.patients.length} paciente{area.patients.length === 1 ? '' : 's'}
                      </small>
                    </span>
                  </label>
                ))}
              </div>

              <div className='event-selected-header'>
                <div>
                  <strong>{selectedPatientIds.size} pacientes seleccionados</strong>
                  <small>Desmarca cualquier paciente que quieras descartar.</small>
                </div>
                {selectedPatientIds.size > 0 ? (
                  <label className='event-patient-search'>
                    <Search size={16} aria-hidden='true' />
                    <input
                      type='search'
                      value={patientQuery}
                      onChange={event => setPatientQuery(event.target.value)}
                      placeholder='Buscar nombre o documento'
                    />
                  </label>
                ) : null}
              </div>

              {selectedPatientIds.size > 0 ? (
                <div className='event-patient-list'>
                  {selectedPatients.map(patient => (
                    <label className='event-patient-option' key={patient.userId}>
                      <input
                        type='checkbox'
                        checked
                        onChange={() => {
                          const next = new Set(selectedPatientIds);
                          next.delete(patient.userId);
                          setSelectedPatientIds(next);
                        }}
                      />
                      <span>
                        <strong>{patient.fullName}</strong>
                        <small>{patient.document}</small>
                      </span>
                    </label>
                  ))}
                  {selectedPatients.length === 0 ? (
                    <p className='event-audience-status'>No hay coincidencias con la búsqueda.</p>
                  ) : null}
                </div>
              ) : (
                <p className='event-audience-status'>Selecciona un área para agregar pacientes.</p>
              )}
            </>
          )}
        </section> : (
          <section className='admin-panel event-invite-panel'>
            <header className='admin-panel-header'>
              <div>
                <h3>Invitados del evento</h3>
                <p>Los cambios se notificarán a los pacientes que ya fueron invitados.</p>
              </div>
              <Users size={20} aria-hidden='true' />
            </header>
          </section>
        )}

        {feedback ? (
          <div
            className={`event-form-feedback event-form-feedback-${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className='form-actions admin-form-actions'>
          <button
            type='submit'
            className='primary-button admin-inline-action'
            disabled={isSubmitting || isLoadingEvent || isLoadingAudience}
          >
            {isEditing ? (
              <PencilLine size={17} aria-hidden='true' />
            ) : (
              <CalendarPlus size={17} aria-hidden='true' />
            )}
            {isSubmitting
              ? isEditing
                ? 'Guardando cambios...'
                : 'Creando evento...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear evento'}
          </button>
          <button
            type='button'
            className='secondary-button admin-inline-action'
            disabled={isSubmitting || isLoadingEvent}
            onClick={() => {
              if (isEditing) {
                navigate('/admin/eventos');
              } else {
                setForm(createInitialForm());
                setSelectedAreaIds(new Set());
                setSelectedPatientIds(new Set());
                setPatientQuery('');
                setFeedback(null);
              }
            }}
          >
            {isEditing ? 'Cancelar' : 'Limpiar'}
          </button>
        </div>
      </form>
    </main>
  );
}

function createInitialForm(): EventFormState {
  const startsAt = new Date();
  startsAt.setMinutes(0, 0, 0);
  startsAt.setHours(startsAt.getHours() + 1);

  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);

  return {
    title: '',
    description: '',
    location: '',
    startsAt: toDateTimeLocalValue(startsAt),
    endsAt: toDateTimeLocalValue(endsAt),
    organizerDescription: '',
  };
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
