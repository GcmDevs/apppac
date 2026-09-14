import { getAuthSession } from '@/lib/auth';
import type { MoodRecord } from '@/types/mood';
import type { InfluenceValue, MoodValue } from '@/types/mood';

export const MOOD_RECORDS_STORAGE_KEY = 'eklipse_mood_records';
const API_BASE_URL = 'https://eklipse.grupoclinicamedicos.com:8104';

type BackendMoodRecord = {
  id: number;
  pacienteId: number;
  estadoAnimoCode: number;
  factorEstadoAnimoCode: number;
  descripcionFactorEstadoAnimo: string | null;
  comentarioAdicional: string | null;
  createdAt: string;
};

type RegisterMoodRecordPayload = {
  patientId: string;
  mood: MoodValue;
  influence: InfluenceValue;
  otherInfluence: string;
  comment: string;
};

export function getMoodRecords() {
  const raw = localStorage.getItem(MOOD_RECORDS_STORAGE_KEY);

  if (!raw) {
    return [] as MoodRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as MoodRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(MOOD_RECORDS_STORAGE_KEY);
    return [] as MoodRecord[];
  }
}

export async function fetchTodayMoodRecord(patientId: string) {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para consultar el registro.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/estado-animo/today`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  const record = (await response.json()) as BackendMoodRecord | null;

  return record ? backendRecordToMoodRecord(record, patientId) : null;
}

export async function fetchMoodHistory(patientId: string) {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para consultar el historial.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/estado-animo/history`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  const records = (await response.json()) as BackendMoodRecord[];

  return records.map(record => backendRecordToMoodRecord(record, patientId));
}

export async function registerMoodRecord({
  patientId,
  mood,
  influence,
  otherInfluence,
  comment,
}: RegisterMoodRecordPayload) {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para guardar el registro.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/estado-animo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      estadoAnimoCode: moodToCode(mood),
      factorEstadoAnimoCode: influenceToCode(influence),
      descripcionFactorEstadoAnimo: otherInfluence.trim() || undefined,
      comentarioAdicional: comment.trim() || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  const savedRecord = (await response.json()) as BackendMoodRecord;

  return backendRecordToMoodRecord(savedRecord, patientId, mood, influence);
}

function moodToCode(mood: MoodValue) {
  if (mood === 'Tranquilo(a)') return 1;
  if (mood === 'Alegre') return 2;
  if (mood === 'Preocupado(a)') return 3;
  if (mood === 'Triste') return 4;
  if (mood === 'Cansado(a)') return 5;
  return 6;
}

function influenceToCode(influence: InfluenceValue) {
  if (influence === 'Dolor fisico') return 1;
  if (influence === 'Cansancio') return 2;
  if (influence === 'Preocupacion por resultados') return 3;
  if (influence === 'Familia o red de apoyo') return 4;
  if (influence === 'Efectos del tratamiento') return 5;
  return 6;
}

function codeToMood(code: number): MoodValue {
  if (code === 1) return 'Tranquilo(a)';
  if (code === 2) return 'Alegre';
  if (code === 3) return 'Preocupado(a)';
  if (code === 4) return 'Triste';
  if (code === 5) return 'Cansado(a)';
  return 'Desmotivado(a)';
}

function codeToInfluence(code: number): InfluenceValue {
  if (code === 1) return 'Dolor fisico';
  if (code === 2) return 'Cansancio';
  if (code === 3) return 'Preocupacion por resultados';
  if (code === 4) return 'Familia o red de apoyo';
  if (code === 5) return 'Efectos del tratamiento';
  return 'Otro';
}

function backendRecordToMoodRecord(
  record: BackendMoodRecord,
  patientId: string,
  mood = codeToMood(record.estadoAnimoCode),
  influence = codeToInfluence(record.factorEstadoAnimoCode)
) {
  return {
    id: String(record.id),
    patientId,
    mood,
    influence,
    otherInfluence: record.descripcionFactorEstadoAnimo ?? '',
    comment: record.comentarioAdicional ?? '',
    createdAt: record.createdAt,
  } satisfies MoodRecord;
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

  return 'No pudimos guardar el registro. Intentalo nuevamente.';
}
