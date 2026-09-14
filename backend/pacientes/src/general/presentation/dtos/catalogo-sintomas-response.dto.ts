import { ApiProperty } from '@nestjs/swagger';
import { AccesoRapidoSintomaCode, RegionCorporalSintomaCode } from '@gen/general/domain/types';

export class RegionCorporalSintomaResponseDto {
  @ApiProperty({ enum: [1, 2, 3, 4, 5], example: 1 })
  code: RegionCorporalSintomaCode;

  @ApiProperty({ example: 'Salud oral' })
  forHumans: string;
}

export class IntensidadSintomaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Lo noto un poco en este momento' })
  descripcion: string;
}

export class SintomaCatalogoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Llagas en la boca' })
  descripcion: string;

  @ApiProperty({
    description: 'Códigos de navegación rápida asociados al síntoma.',
    enum: ['DOLOR', 'NAUSEAS', 'FATIGA', 'FIEBRE'],
    isArray: true,
    example: ['DOLOR'],
  })
  accesosRapidos: AccesoRapidoSintomaCode[];

  @ApiProperty({ type: () => [IntensidadSintomaResponseDto] })
  intensidad: IntensidadSintomaResponseDto[];
}

export class RegionCorporalSintomasResponseDto {
  @ApiProperty({ type: () => RegionCorporalSintomaResponseDto })
  regionCorporal: RegionCorporalSintomaResponseDto;

  @ApiProperty({ type: () => [SintomaCatalogoResponseDto] })
  sintomas: SintomaCatalogoResponseDto[];
}
