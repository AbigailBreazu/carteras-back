import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductoTipo {
  CARTERA = 'cartera',
  RINONERA = 'rinonera',
  MATERA = 'matera',
  COMBO = 'combo',
  MOCHILA = 'mochila',
  NECESER_PILETA = 'neceser_pileta',
  NECESER_HIGIENE = 'neceser_higiene',
  MANTEL_CAMPING = 'mantel_camping',
  BOLSO_CAMPING = 'bolso_camping',
  LONCHERA_TERMICA = 'lonchera_termica',
  MOCHILAS_PEQUENAS = 'mochilas_pequenas',
  KIT_DORMIR = 'kit_dormir',
  OTROS = 'otros',
}

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({
    type: 'enum',
    enum: ProductoTipo,
  })
  tipo: ProductoTipo;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tamaño: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  material: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  color: string;

  @Column({ type: 'json', nullable: true })
  imagenes: string[];

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
