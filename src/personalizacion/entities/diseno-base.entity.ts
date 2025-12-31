import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('disenos_base')
export class DisenoBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tamaño: string;

  @Column({ type: 'int', nullable: true })
  diasEstimadosConfeccion: number;

  @Column({ type: 'json' })
  imagenes: string[];

  @Column({ type: 'varchar', length: 500 })
  imagenPrincipal: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}
