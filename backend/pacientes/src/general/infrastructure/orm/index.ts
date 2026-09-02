import { IntensidadSintomaOrm } from './intensidad-sintoma.orm';
import { PacienteOrm } from './paciente.orm';
import { PerfilPacienteOrm } from './perfil-paciente.orm';
import { RegistroEstadoAnimoOrm } from './registro-estado-animo.orm';
import { RegistroSintomaOrm } from './registro-sintoma.orm';
import { SintomaOrm } from './sintoma.orm';

export * from './intensidad-sintoma.orm';
export * from './paciente.orm';
export * from './perfil-paciente.orm';
export * from './registro-estado-animo.orm';
export * from './registro-sintoma.orm';
export * from './sintoma.orm';

export const ORM_GENERAL_ENTITIES = [
  IntensidadSintomaOrm,
  PacienteOrm,
  PerfilPacienteOrm,
  RegistroEstadoAnimoOrm,
  RegistroSintomaOrm,
  SintomaOrm,
];
