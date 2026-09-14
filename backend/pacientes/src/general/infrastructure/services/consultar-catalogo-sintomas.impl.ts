import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  AccesoRapidoSintomaCode,
  REGION_CORPORAL_SINTOMA_VALUES,
  RegionCorporalSintomaType,
  accesosRapidosSintomaById,
} from '@gen/general/domain/types';
import { IntensidadSintomaOrm, SintomaOrm } from '@gen/general/infrastructure/orm';

export type IntensidadSintomaCatalogo = Pick<IntensidadSintomaOrm, 'id' | 'descripcion'>;

export type SintomaCatalogo = Pick<SintomaOrm, 'id' | 'descripcion'> & {
  accesosRapidos: AccesoRapidoSintomaCode[];
  intensidad: IntensidadSintomaCatalogo[];
};

export type RegionCorporalSintomasCatalogo = {
  regionCorporal: RegionCorporalSintomaType;
  sintomas: SintomaCatalogo[];
};

@Injectable()
export class ConsultarCatalogoSintomasImpl extends BaseSource {
  public async execute(): Promise<RegionCorporalSintomasCatalogo[]> {
    try {
      const sintomaRp = this.conn.getRepository(SintomaOrm);
      const intensidadSintomaRp = this.conn.getRepository(IntensidadSintomaOrm);

      const [sintomas, intensidades] = await Promise.all([
        sintomaRp.find({ order: { regionCorporalCode: 'ASC', id: 'ASC' } }),
        intensidadSintomaRp.find({ order: { sintomaId: 'ASC', id: 'ASC' } }),
      ]);

      const intensidadesPorSintoma = new Map<number, IntensidadSintomaCatalogo[]>();

      for (const intensidad of intensidades) {
        const intensidadesDelSintoma = intensidadesPorSintoma.get(intensidad.sintomaId) ?? [];
        intensidadesDelSintoma.push({
          id: intensidad.id,
          descripcion: intensidad.descripcion,
        });
        intensidadesPorSintoma.set(intensidad.sintomaId, intensidadesDelSintoma);
      }

      return REGION_CORPORAL_SINTOMA_VALUES.map(regionCorporal => ({
        regionCorporal,
        sintomas: sintomas
          .filter(sintoma => sintoma.regionCorporalCode === regionCorporal.getCode())
          .map(sintoma => ({
            id: sintoma.id,
            descripcion: sintoma.descripcion,
            accesosRapidos: accesosRapidosSintomaById(sintoma.id),
            intensidad: intensidadesPorSintoma.get(sintoma.id) ?? [],
          })),
      }));
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
