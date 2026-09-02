import { ApiProperty } from '@nestjs/swagger';
import { GeneroCode, TipoDocumentoCode } from '@gen/general/domain/types';

export class PacienteResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 1 })
  tipoDocumentoCode: TipoDocumentoCode;

  @ApiProperty({ example: '1234567890' })
  documento: string;

  @ApiProperty({ example: 'Maria Perez' })
  nombreCompleto: string;

  @ApiProperty({ example: '1990-05-20', format: 'date' })
  fechaNacimiento: string;

  @ApiProperty({ enum: [1, 2], example: 2 })
  generoCode: GeneroCode;
}

export class PerfilPacienteResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'CC' })
  tipoDocumento: string;

  @ApiProperty({ example: '1234567890' })
  identificacion: string;

  @ApiProperty({ example: 'Maria Perez' })
  nombrePaciente: string;

  @ApiProperty({ enum: ['M', 'F'], example: 'F' })
  sexo: string;

  @ApiProperty({ example: '1990-05-20', format: 'date' })
  fechaNacimiento: Date;

  @ApiProperty({ example: 35 })
  edad: number;

  @ApiProperty({ enum: ['Dias', 'Meses', 'Años'], example: 'Años' })
  unidadEdad: string;

  @ApiProperty({ example: 'Valledupar', nullable: true })
  municipioResidencia?: string;

  @ApiProperty({ example: 'Cesar', nullable: true })
  departamentoResidencia?: string;

  @ApiProperty({ example: 123456, nullable: true })
  ingreso?: number;

  @ApiProperty({ example: '2026-08-31T00:00:00.000Z', nullable: true })
  fechaIngreso?: Date;

  @ApiProperty({ example: 'Sede principal', nullable: true })
  sede?: string;
}
