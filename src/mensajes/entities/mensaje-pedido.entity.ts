import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PedidoPersonalizacion } from '../../personalizacion/entities/pedido-personalizacion.entity';

export type EmisorTipo = 'cliente' | 'admin';

@Entity('mensajes_pedido')
@Index(['pedidoId', 'fecha'])
@Index(['pedidoId', 'leido'])
export class MensajePedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  pedidoId: string;

  @ManyToOne(
    () => PedidoPersonalizacion,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'pedidoId' })
  pedido: PedidoPersonalizacion;

  @Column({ type: 'varchar', length: 10 })
  emisor: EmisorTipo; // 'cliente' | 'admin'

  @Column({ type: 'varchar', length: 255 })
  emisorEmail: string;

  @Column({ type: 'varchar', length: 255 })
  emisorNombre: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  imagenUrl?: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  leido: boolean;

  @Column({ type: 'simple-array', default: '' })
  leidoPor: string[]; // Array de emails que leyeron el mensaje

  @Column({ type: 'json', nullable: true })
  cambioEstado?: {
    estadoAnterior: string;
    estadoNuevo: string;
  };
}
