import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PedidoPersonalizacion } from './pedido-personalizacion.entity';
import { User } from '../../users/entities/user.entity';

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

@Entity('solicitudes_modificacion')
export class SolicitudModificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pedidoId: string;

  @ManyToOne(() => PedidoPersonalizacion)
  @JoinColumn({ name: 'pedidoId' })
  pedido: PedidoPersonalizacion;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({ type: 'text' })
  motivo: string;

  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @Column({ type: 'uuid', nullable: true })
  adminId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column({ type: 'text', nullable: true })
  mensajeAdmin: string;

  @CreateDateColumn()
  fechaSolicitud: Date;

  @UpdateDateColumn()
  fechaRespuesta: Date;
}
