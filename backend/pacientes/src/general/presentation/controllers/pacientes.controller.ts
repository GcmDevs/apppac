import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { ConsultarPacienteAutenticadoImpl } from '@gen/general/infrastructure/services';
import { PerfilPacienteResponseDto } from '@gen/general/presentation/dtos';

@CommonGuards()
@ApiTags('Pacientes')
@Controller('v1/gen/pacientes')
export class PacientesController {
  constructor(private _consultarPacienteAutenticado: ConsultarPacienteAutenticadoImpl) {}

  @Get('me')
  @ApiOperation({
    summary: 'Consultar el paciente autenticado',
    description: 'Obtiene la informacion general del paciente identificado por el token.',
  })
  @ApiOkResponse({
    description: 'Informacion general del paciente autenticado.',
    type: PerfilPacienteResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No existe un paciente asociado al identificador del token.' })
  @ApiUnauthorizedResponse({ description: 'El token no fue proporcionado o no es valido.' })
  public async fetchAuthenticatedPatient() {
    return await this._consultarPacienteAutenticado.execute();
  }
}
