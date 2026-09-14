import {
  defaultMockPatient,
  findMockPatientByDocument,
  findMockPatientById,
} from '@/data/mockPatient';
import type { AuthSession, AuthUser, UserRole } from '@/types/auth';
import type { Patient } from '@/types/patient';

const AUTH_STORAGE_KEY = 'eklipse-auth-session';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8104';
const AUTH_CONTEXT = import.meta.env.VITE_AUTH_CONTEXT ?? 'ALTACENTRO';

export type AppPacienteRol = 'USUARIO' | 'PACIENTE';

type LoginPayload = {
  document: string;
  password: string;
  authAsUser: boolean;
  keepSignedIn: boolean;
};

type LoginResponse = {
  token: string;
  passwordIsReset: boolean;
  sexo: 'M' | 'F' | null;
};

type TokenPayload = {
  jti?: string;
  dcm?: string;
  fnm?: string;
  rol?: AppPacienteRol;
};

export async function authenticateUser({
  document,
  password,
  authAsUser,
  keepSignedIn,
}: LoginPayload): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/v1/sec/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: AUTH_CONTEXT,
      username: document,
      password,
      authAsUser,
    }),
  });

  if (!response.ok) {
    throw new Error(await getLoginErrorMessage(response));
  }

  const data = (await response.json()) as LoginResponse;
  const tokenPayload = decodeTokenPayload(data.token);

  return {
    user: createAuthUser(document, tokenPayload, data.sexo),
    keepSignedIn,
    token: data.token,
    passwordIsReset: data.passwordIsReset,
  };
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as AuthSession;
    if (session.user.role === 'admin') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated() {
  return getAuthSession() !== null;
}

export function getCurrentUserRole(): UserRole | null {
  return getAuthSession()?.user.role ?? null;
}

export function isAdminSession() {
  return getCurrentUserRole() === 'admin';
}

export function isPatientSession() {
  return getCurrentUserRole() === 'patient';
}

export function getDefaultRouteForRole(_role: UserRole | null) {
  return '/inicio';
}

export async function updatePassword(newPassword: string): Promise<void> {
  const token = getAuthSession()?.token;
  if (!token) throw new Error('Tu sesión terminó. Ingresa nuevamente.');

  const response = await fetch(`${API_BASE_URL}/v1/sec/auth/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) throw new Error(await getLoginErrorMessage(response));
}

export function getCurrentPatient(): Patient {
  const session = getAuthSession();

  if (!session || !session.user.patientId) {
    return defaultMockPatient;
  }

  return findMockPatientById(session.user.patientId) ?? defaultMockPatient;
}

async function getLoginErrorMessage(response: Response) {
  try {
    const errorBody = (await response.json()) as {
      message?: string | string[];
    };
    const message = errorBody.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (message) {
      return message;
    }
  } catch {
    // The API can return an empty or non-JSON error body.
  }

  return 'Los datos ingresados no coinciden. Verifica tu acceso.';
}

function decodeTokenPayload(token: string): TokenPayload {
  const [, payload] = token.split('.');

  if (!payload) {
    return {};
  }

  try {
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decodedPayload = window.atob(normalizedPayload);
    const bytes = Uint8Array.from(decodedPayload, character => character.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes)) as TokenPayload;
  } catch {
    return {};
  }
}

function createAuthUser(
  document: string,
  tokenPayload: TokenPayload,
  sexo: LoginResponse['sexo']
): AuthUser {
  const patientDocument = tokenPayload.dcm ?? document;
  const patient = findMockPatientByDocument(patientDocument);
  const fullName = tokenPayload.fnm ?? patient?.shortName ?? patientDocument;
  const isAdmin = tokenPayload.rol === 'USUARIO';

  return {
    id: tokenPayload.jti ?? patient?.id ?? patientDocument,
    role: isAdmin ? 'admin' : 'patient',
    patientId: isAdmin ? null : (patient?.id ?? null),
    document: patientDocument,
    name: fullName,
    initials: getInitials(fullName),
    avatarVariant:
      sexo === 'M'
        ? 'male'
        : sexo === 'F'
          ? 'female'
          : patient?.sex === 'Masculino'
            ? 'male'
            : 'female',
  };
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return initials || 'EP';
}
