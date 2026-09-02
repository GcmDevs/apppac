import { getAuthSession } from '@/lib/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8104';

export type PatientProfile = {
  id: number;
  tipoDocumento: string | null;
  identificacion: string;
  nombrePaciente: string;
  sexo: 'M' | 'F' | null;
  fechaNacimiento: string;
  edad: number;
  unidadEdad: 'Dias' | 'Meses' | 'Años';
  municipioResidencia: string | null;
  departamentoResidencia: string | null;
  ingreso: number | null;
  fechaIngreso: string | null;
  sede: string | null;
};

export async function fetchPatientProfile(signal?: AbortSignal): Promise<PatientProfile> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para consultar el perfil.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/pacientes/me`, {
    headers: { Authorization: `Bearer ${session.token}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  return (await response.json()) as PatientProfile;
}

async function getApiErrorMessage(response: Response) {
  try {
    const errorBody = (await response.json()) as { message?: string | string[] };
    const message = errorBody.message;
    if (response.status === 401 || response.status === 403) {
      return 'Tu sesión ya no está disponible. Ingresa nuevamente para consultar tu perfil.';
    }
    if (response.status === 404) {
      return 'Aún no encontramos información de perfil para tu cuenta.';
    }
    return 'No pudimos cargar tu perfil en este momento. Inténtalo nuevamente.';
  } catch {
    return 'No pudimos cargar el perfil. Intentalo nuevamente.';
  }
}
