import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrdenItem } from './orden-item.entity';

export enum OrdenEstado {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('ordenes')
export class Orden {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrdenEstado,
    default: OrdenEstado.PENDING,
  })
  estado: OrdenEstado;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mercadopago_payment_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mercadopago_preference_id: string;

  @Column({ type: 'json', nullable: true })
  comprobante: any;

  @Column({ type: 'json' })
  datos_cliente: {
    nombre: string;
    email: string;
    telefono: string;
  };

  @OneToMany(() => OrdenItem, (item) => item.orden, { cascade: true })
  items: OrdenItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
