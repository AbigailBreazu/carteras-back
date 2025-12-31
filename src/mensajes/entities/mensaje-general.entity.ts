import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('mensajes_generales')
@Index(['fecha'])
@Index(['leido'])
@Index(['respondido'])
export class MensajeGeneral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 255 })
  asunto: string;

  @Column({ type: 'text' })
  mensaje: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ type: 'boolean', default: false })
  leido: boolean;

  @Column({ type: 'simple-array', default: '' })
  leidoPor: string[]; // Array de emails de admins que leyeron

  @Column({ type: 'boolean', default: false })
  respondido: boolean;

  @Column({ type: 'text', nullable: true })
  respuesta?: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaRespuesta?: Date;
}
