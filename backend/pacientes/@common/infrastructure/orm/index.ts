import { _PrivSecAuthOrm } from './authority.orm';
import { _PrivSecModuleOrm } from './module.orm';
import { _PrivSecRoleOrm } from './role.orm';
import { _PrivSecSubModuleOrm } from './sub-module.orm';
import { _PrivSecUserOrm } from './user.orm';
import { _PrivSecPacAsUserOrm } from './pacient-as-user.orm';
import { _PrivSecPatientOrm } from './pacient.orm';
import { _PrivSecPacAreaOrm } from './patient-area.orm';

export const _PRIV_ORM_AUTH_SEC_ENTITIES = [
  _PrivSecPacAsUserOrm,
  _PrivSecAuthOrm,
  _PrivSecModuleOrm,
  _PrivSecRoleOrm,
  _PrivSecSubModuleOrm,
  _PrivSecUserOrm,
  _PrivSecPacAreaOrm,
  _PrivSecPatientOrm,
];
