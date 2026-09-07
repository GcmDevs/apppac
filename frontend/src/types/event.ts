export type EventAttendanceStatus = 1 | 2 | 3;

export type EventInput = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  organizerDescription: string;
};

export type CreateEventInput = EventInput & {
  inviteeUserIds: number[];
};

export type UpdateEventInput = EventInput & {
  eventId: number;
};

export type NewEvent = EventInput & {
  id: number;
  createdAt: string;
};

export type EventAudiencePatient = {
  userId: number;
  document: string;
  fullName: string;
};

export type EventAudienceArea = {
  id: number;
  code: string;
  name: string;
  patients: EventAudiencePatient[];
};

export type NewEventInvitation = NewEvent & {
  invitationId: number;
  status: EventAttendanceStatus;
  invitedAt: string;
  respondedAt: string | null;
};

export type CreatedEvent = NewEvent & {
  connectedUsersCount: number;
  invitedUsersCount: number;
};

export type RegisteredEvent = NewEvent & {
  updatedAt: string;
  invitedUsersCount: number;
  pendingUsersCount: number;
  attendingUsersCount: number;
  notAttendingUsersCount: number;
};

export type UpdatedEvent = RegisteredEvent & {
  connectedUsersCount: number;
};

export type EventActionAck<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
