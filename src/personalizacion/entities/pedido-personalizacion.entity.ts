import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DisenoBase } from './diseno-base.entity';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_MODIFICACION = 'en_modificacion',
  APROBADO = 'aprobado',
  ESPERANDO_STOCK = 'esperando_stock',
  EN_PRODUCCION = 'en_produccion',
  TERMINADO = 'terminado',
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

@Entity('pedidos_personalizacion')
export class PedidoPersonalizacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({ type: 'uuid', nullable: true })
  disenoBaseId: string;

  @ManyToOne(() => DisenoBase, { nullable: true })
  @JoinColumn({ name: 'disenoBaseId' })
  disenoBase: DisenoBase;

  @Column({ type: 'varchar', length: 500, nullable: true })
  disenoPropio: string;

  @Column({ type: 'json' })
  telasSeleccionadas: string[];

  @Column({ type: 'text', nullable: true })
  comentarios: string;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    default: EstadoPedido.PENDIENTE,
  })
  estado: EstadoPedido;

  @Column({ type: 'json', nullable: true })
  historialEstados: Array<{
    estado: EstadoPedido;
    fecha: Date;
    actualizadoPor: string;
  }>;

  @Column({ type: 'int', default: 3 })
  modificacionesRestantes: number;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
