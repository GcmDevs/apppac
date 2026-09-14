import type { BodyRegion, BodyRegionCode, BodyRegionId } from '@/types/symptoms';

export const BODY_REGION_CODES = {
  oral: 1,
  respiratory: 2,
  digestive: 3,
  urinary: 4,
  skin: 5,
} as const satisfies Record<BodyRegionId, BodyRegionCode>;

export const bodyRegions: BodyRegion[] = [
  {
    id: 'oral',
    code: BODY_REGION_CODES.oral,
    label: 'Salud oral',
    description: 'Boca, lengua, garganta y dificultad para comer o tragar.',
    bodyArea: 'head',
  },
  {
    id: 'respiratory',
    code: BODY_REGION_CODES.respiratory,
    label: 'Respiracion',
    description: 'Molestias relacionadas con el pecho o el aire al respirar.',
    bodyArea: 'chest',
  },
  {
    id: 'digestive',
    code: BODY_REGION_CODES.digestive,
    label: 'Digestivo',
    description: 'Estomago, abdomen y cambios en digestion o evacuacion.',
    bodyArea: 'abdomen',
  },
  {
    id: 'urinary',
    code: BODY_REGION_CODES.urinary,
    label: 'Problemas urinarios',
    description: 'Molestias al orinar o cambios en la frecuencia.',
    bodyArea: 'pelvis',
  },
  {
    id: 'skin',
    code: BODY_REGION_CODES.skin,
    label: 'Piel',
    description: 'Comezon, sarpullido, heridas o cambios visibles en la piel.',
    bodyArea: 'arms',
  },
];

export function findBodyRegionByCode(code: number) {
  return bodyRegions.find(region => region.code === code) ?? null;
}
