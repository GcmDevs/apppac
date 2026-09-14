import { io, type Socket } from 'socket.io-client';
import { getAuthSession } from '@/lib/auth';
import type {
  CreateEventInput,
  CreatedEvent,
  EventActionAck,
  EventAudienceArea,
  NewEventInvitation,
  RegisteredEvent,
  UpdateEventInput,
  UpdatedEvent,
} from '@/types/event';

export const EVENT_SOCKET_EVENTS = {
  create: 'events:event:create',
  audienceList: 'events:audience:list',
  listCreated: 'events:event:list-created',
  update: 'events:event:update',
  invitationCreated: 'events:invitation:new',
  invitationList: 'events:invitation:list',
  invitationRespond: 'events:invitation:respond',
  invitationUpdated: 'events:invitation:updated',
} as const;

const PATIENTS_FRONTEND_CLIENT = 'pacientes-frontend';
const SOCKET_URL = 'https://cloud.grupoclinicamedicos.com/socket';
const EVENT_ACK_TIMEOUT_MS = 12_000;

let eventSocket: Socket | null = null;
let eventSocketToken = '';

export function connectEventSocket(): Socket {
  const token = getAuthSession()?.token;
  if (!token) throw new Error('No hay una sesión autenticada para conectar con eventos.');

  if (eventSocket && eventSocketToken !== token) {
    eventSocket.disconnect();
    eventSocket = null;
  }

  if (!eventSocket) {
    eventSocketToken = token;
    eventSocket = io(SOCKET_URL, {
      auth: { token, clientApp: PATIENTS_FRONTEND_CLIENT },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  if (!eventSocket.connected) eventSocket.connect();
  return eventSocket;
}

export function disconnectEventSocket(): void {
  eventSocket?.disconnect();
  eventSocket = null;
  eventSocketToken = '';
}

export function createEvent(input: CreateEventInput): Promise<CreatedEvent> {
  const socket = connectEventSocket();

  return new Promise((resolve, reject) => {
    socket
      .timeout(EVENT_ACK_TIMEOUT_MS)
      .emit(
        EVENT_SOCKET_EVENTS.create,
        input,
        (timeoutError: Error | null, response?: EventActionAck<CreatedEvent>) => {
          if (timeoutError) {
            reject(new Error('El servidor de eventos no respondió. Verifica la conexión.'));
            return;
          }
          if (!response?.ok || !response.data) {
            reject(new Error(response?.error ?? 'No fue posible crear el evento.'));
            return;
          }

          resolve(response.data);
        }
      );
  });
}

export function getMyCreatedEvents(): Promise<RegisteredEvent[]> {
  return emitEventRequest<RegisteredEvent[]>(EVENT_SOCKET_EVENTS.listCreated);
}

export function getEventAudience(): Promise<EventAudienceArea[]> {
  return emitEventRequest<EventAudienceArea[]>(EVENT_SOCKET_EVENTS.audienceList);
}

export function updateEvent(input: UpdateEventInput): Promise<UpdatedEvent> {
  return emitEventRequest<UpdatedEvent>(EVENT_SOCKET_EVENTS.update, input);
}

export function onNewEventInvitation(
  listener: (invitation: NewEventInvitation) => void
): () => void {
  const socket = connectEventSocket();
  const handleInvitation = (invitation: NewEventInvitation) => listener(invitation);

  socket.on(EVENT_SOCKET_EVENTS.invitationCreated, handleInvitation);
  return () => socket.off(EVENT_SOCKET_EVENTS.invitationCreated, handleInvitation);
}

export function getMyEventInvitations(): Promise<NewEventInvitation[]> {
  return emitEventRequest<NewEventInvitation[]>(EVENT_SOCKET_EVENTS.invitationList);
}

export function respondToEventInvitation(
  invitationId: number,
  status: 2 | 3
): Promise<NewEventInvitation> {
  return emitEventRequest<NewEventInvitation>(EVENT_SOCKET_EVENTS.invitationRespond, {
    invitationId,
    status,
  });
}

export function onEventInvitationUpdated(
  listener: (invitation: NewEventInvitation) => void
): () => void {
  const socket = connectEventSocket();
  const handleInvitation = (invitation: NewEventInvitation) => listener(invitation);

  socket.on(EVENT_SOCKET_EVENTS.invitationUpdated, handleInvitation);
  return () => socket.off(EVENT_SOCKET_EVENTS.invitationUpdated, handleInvitation);
}

function emitEventRequest<T>(event: string, payload?: unknown): Promise<T> {
  const socket = connectEventSocket();

  return new Promise((resolve, reject) => {
    const acknowledge = (timeoutError: Error | null, response?: EventActionAck<T>) => {
      if (timeoutError) {
        reject(new Error('El servidor de eventos no respondió. Verifica la conexión.'));
        return;
      }
      if (!response?.ok || response.data === undefined) {
        reject(new Error(response?.error ?? 'No fue posible completar la solicitud.'));
        return;
      }

      resolve(response.data);
    };

    if (payload === undefined) {
      socket.timeout(EVENT_ACK_TIMEOUT_MS).emit(event, acknowledge);
      return;
    }

    socket.timeout(EVENT_ACK_TIMEOUT_MS).emit(event, payload, acknowledge);
  });
}
