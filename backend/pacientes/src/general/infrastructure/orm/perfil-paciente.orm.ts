import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Raíz ORM para la consulta de perfil del paciente.
 *
 * Los datos complementarios (ubicación y última atención) se unen en el
 * servicio para respetar la conexión seleccionada por el contexto clínico.
 */
@Entity('GENPACIEN')
export class PerfilPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACTIPDOC' })
  tipoDocumentoCode: number;

  @Column({ name: 'PACNUMDOC' })
  identificacion: string;

  @Column({ name: 'GPANOMCOM' })
  nombrePaciente: string;

  @Column({ name: 'GPASEXPAC' })
  sexoCode: number;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @Column({ name: 'GENBARRIO', nullable: true })
  barrioId?: number;
}
