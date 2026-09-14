import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { _PrivSecPacAsUserOrm } from './pacient-as-user.orm';
import { _PrivSecUserOrm } from './user.orm';

@Entity('APPACUSUAREA')
export class _PrivSecPacAreaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @ManyToMany(() => _PrivSecPacAsUserOrm, paciente => paciente.areas)
  @JoinTable({
    name: 'APPACUSUARIOAREA',
    joinColumn: { name: 'APPACUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'APPACUSUAREA', referencedColumnName: 'id' },
  })
  pacientes: _PrivSecPacAsUserOrm[];

  @ManyToMany(() => _PrivSecPacAsUserOrm, usuario => usuario.areas)
  @JoinTable({
    name: 'APPACUSUDIMAREA',
    joinColumn: { name: 'GENUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'APPACUSUAREA', referencedColumnName: 'id' },
  })
  usuarios: _PrivSecUserOrm[];
}
