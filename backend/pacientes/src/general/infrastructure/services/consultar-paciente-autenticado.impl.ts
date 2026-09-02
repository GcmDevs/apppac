import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PerfilPacienteOrm } from '@gen/general/infrastructure/orm';
import { PerfilPacienteResponseDto } from '@gen/general/presentation/dtos';

@Injectable()
export class ConsultarPacienteAutenticadoImpl extends BaseSource {
  public async execute(): Promise<PerfilPacienteResponseDto> {
    const pacienteRp = this.conn.getRepository(PerfilPacienteOrm);
    const paciente = await pacienteRp
      .createQueryBuilder('paciente')
      .select('paciente.OID', 'id')
      .addSelect(
        `CASE paciente.PACTIPDOC
          WHEN 0 THEN 'NINGUNO' WHEN 1 THEN 'CC' WHEN 2 THEN 'CE' WHEN 3 THEN 'TI'
          WHEN 4 THEN 'RC' WHEN 5 THEN 'PA' WHEN 6 THEN 'ASI' WHEN 7 THEN 'MSI'
          WHEN 8 THEN 'NUI' WHEN 9 THEN 'SC' WHEN 10 THEN 'CNV' WHEN 11 THEN 'CD'
          WHEN 12 THEN 'PEP' WHEN 14 THEN 'PPT' WHEN 15 THEN 'DE' WHEN 16 THEN 'NIT'
        END`,
        'tipoDocumento'
      )
      .addSelect('paciente.PACNUMDOC', 'identificacion')
      .addSelect('paciente.GPANOMCOM', 'nombrePaciente')
      .addSelect(`CASE paciente.GPASEXPAC WHEN 1 THEN 'M' WHEN 2 THEN 'F' END`, 'sexo')
      .addSelect('paciente.GPAFECNAC', 'fechaNacimiento')
      .addSelect(
        `CASE
          WHEN DATEDIFF(DAY, paciente.GPAFECNAC, GETDATE()) < 30 THEN DATEDIFF(DAY, paciente.GPAFECNAC, GETDATE())
          WHEN DATEDIFF(DAY, paciente.GPAFECNAC, GETDATE()) < 360 THEN DATEDIFF(MONTH, paciente.GPAFECNAC, GETDATE())
          ELSE DATEDIFF(YEAR, paciente.GPAFECNAC, GETDATE())
            - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, paciente.GPAFECNAC, GETDATE()), paciente.GPAFECNAC) > GETDATE() THEN 1 ELSE 0 END
        END`,
        'edad'
      )
      .addSelect(
        `CASE
          WHEN DATEDIFF(DAY, paciente.GPAFECNAC, GETDATE()) < 30 THEN 'Dias'
          WHEN DATEDIFF(DAY, paciente.GPAFECNAC, GETDATE()) < 360 THEN 'Meses'
          ELSE 'Años'
        END`,
        'unidadEdad'
      )
      .addSelect('municipio.MUNNOMMUN', 'municipioResidencia')
      .addSelect('departamento.DEPNOMDEP', 'departamentoResidencia')
      .addSelect('ingreso.AINCONSEC', 'ingreso')
      .addSelect('ingreso.AINFECING', 'fechaIngreso')
      .addSelect('sede.ACANOMBRE', 'sede')
      .leftJoin('GENBARRIO', 'barrio', 'paciente.GENBARRIO = barrio.OID')
      .leftJoin('GENMUNICI', 'municipio', 'barrio.DGNMUNICIPIO = municipio.OID')
      .leftJoin('GENDEPTO', 'departamento', 'municipio.GENDEPTO = departamento.OID')
      .leftJoin('ADNINGRESO', 'ingreso', 'ingreso.GENPACIEN = paciente.OID')
      .leftJoin('ADNCENATE', 'sede', 'ingreso.ADNCENATE = sede.OID')
      .where('paciente.OID = :patientId', { patientId: this.auth.patientId })
      .orderBy('ingreso.AINFECING', 'DESC')
      .take(1)
      .getRawOne<PerfilPacienteResponseDto>();

    if (!paciente) {
      throw new NotFoundException('No se encontro la informacion del paciente autenticado');
    }

    return paciente;
  }
}
