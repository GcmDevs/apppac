import { findBodyRegionByCode } from '@/data/bodyRegions';
import { getAuthSession } from '@/lib/auth';
import type { QuickAccessCode, SymptomDefinition } from '@/types/symptoms';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'https://eklipse.grupoclinicamedicos.com:8104';

type BackendSymptomIntensity = {
  id: number;
  descripcion: string;
};

type BackendSymptom = {
  id: number;
  descripcion: string;
  accesosRapidos: QuickAccessCode[];
  intensidad: BackendSymptomIntensity[];
};

type BackendBodyRegion = {
  regionCorporal: {
    code: number;
    forHumans: string;
  };
  sintomas: BackendSymptom[];
};

export async function fetchSymptomCatalog(signal?: AbortSignal): Promise<SymptomDefinition[]> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('No hay una sesion activa para consultar los sintomas.');
  }

  const response = await fetch(`${API_BASE_URL}/v1/gen/sintomas`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  const catalog = (await response.json()) as BackendBodyRegion[];

  if (!Array.isArray(catalog)) {
    throw new Error('El catalogo de sintomas recibido no tiene un formato valido.');
  }

  return catalog.flatMap(region => {
    const bodyRegion = findBodyRegionByCode(region.regionCorporal.code);

    if (!bodyRegion || !Array.isArray(region.sintomas)) {
      return [];
    }

    return region.sintomas.map(symptom => ({
      id: symptom.id,
      name: symptom.descripcion,
      regionId: bodyRegion.id,
      regionCode: bodyRegion.code,
      regionName: region.regionCorporal.forHumans || bodyRegion.label,
      quickAccessCodes: Array.isArray(symptom.accesosRapidos)
        ? symptom.accesosRapidos.filter(isQuickAccessCode)
        : [],
      intensities: (Array.isArray(symptom.intensidad) ? symptom.intensidad : []).map(
        (intensity, index) => ({
          id: intensity.id,
          label: intensity.descripcion,
          summaryLabel: intensity.descripcion,
          severityLevel: index + 1,
        })
      ),
    }));
  });
}

function isQuickAccessCode(value: string): value is QuickAccessCode {
  return value === 'DOLOR' || value === 'NAUSEAS' || value === 'FATIGA' || value === 'FIEBRE';
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

  return 'No pudimos cargar el catalogo de sintomas. Intentalo nuevamente.';
}
