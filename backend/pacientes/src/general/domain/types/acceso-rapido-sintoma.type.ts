export type AccesoRapidoSintomaCode = 'DOLOR' | 'NAUSEAS' | 'FATIGA' | 'FIEBRE';

const ACCESOS_RAPIDOS_POR_SINTOMA_ID: Readonly<Record<number, readonly AccesoRapidoSintomaCode[]>> =
  {
    8: ['DOLOR'],
    12: ['DOLOR'],
    13: ['NAUSEAS'],
    22: ['FATIGA'],
    23: ['FIEBRE'],
  };

export function accesosRapidosSintomaById(sintomaId: number): AccesoRapidoSintomaCode[] {
  return [...(ACCESOS_RAPIDOS_POR_SINTOMA_ID[sintomaId] ?? [])];
}
