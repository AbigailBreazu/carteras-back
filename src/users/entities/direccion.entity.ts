import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AliasDireccion {
  CASA = 'Casa',
  TRABAJO = 'Trabajo',
  OTRO = 'Otro',
}

@Entity('direcciones')
export class Direccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AliasDireccion,
  })
  alias: AliasDireccion;

  @Column({ type: 'varchar', length: 100 })
  provincia: string;

  @Column({ type: 'varchar', length: 100 })
  ciudad: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codigoPostal: string;

  @Column({ type: 'varchar', length: 255 })
  calle: string;

  @Column({ type: 'varchar', length: 20 })
  numero: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  piso: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  departamento: string;

  @Column({ type: 'text', nullable: true })
  referencias: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitud: number;

  @Column({ type: 'boolean', default: false })
  esPrincipal: boolean;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
