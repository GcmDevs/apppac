import { getAuthSession } from '@/lib/auth';
import { defaultMockPatient } from '@/data/mockPatient';
import type { BodyRegionCode, SymptomRecord } from '@/types/symptoms';

export const SYMPTOM_RECORDS_STORAGE_KEY = 'eklipse_symptom_records';
const API_BASE_URL = 'https://eklipse.grupoclinicamedicos.com:8104';

type RegisterSymptomRecordPayload = {
  regionCorporalCode: BodyRegionCode;
  sintomaId: number;
  intensidadId: number;
};

export type BackendSymptomRecord = RegisterSymptomRecordPayload & {
  id: number;
  pacienteId: number;
  createdAt: string;
};

export function getSymptomRecords() {
  const raw = localStorage.getItem(SYMPTOM_RECORDS_STORAGE_KEY);

  if (!raw) {
    return [] as SymptomRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as SymptomRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(SYMPTOM_RECORDS_STORAGE_KEY);
    return [] as SymptomRecord[];
  }
}

export function saveSymptomRecord(record: SymptomRecord) {
  const current = getSymptomRecords();
  localStorage.setItem(SYMPTOM_RECORDS_STORAGE_KEY, JSON.stringify([record, ...current]));
}

export async function registerSymptomRecord(
  payload: RegisterSymptomRecordPayload
): Promise<BackendSymptomRecord> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para guardar el registro.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/sintomas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  return (await response.json()) as BackendSymptomRecord;
}

export function getPatientSymptomRecords(patientId = defaultMockPatient.id) {
  return getSymptomRecords().filter(record => record.patientId === patientId);
}

async function getApiErrorMessage(response: Response) {
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

  return 'No pudimos guardar el sintoma. Intentalo nuevamente.';
}
