import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum CategoriaTela {
  LONA = 'lona',
  FILM_TRANSPARENTE = 'film-transparente',
  CUERO = 'cuero',
}

export enum PropiedadTela {
  SI = 'si',
  NO = 'no',
  MEDIA = 'media',
}

@Entity('telas')
export class Tela {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'json' })
  imagenes: string[];

  @Column({ type: 'varchar', length: 500 })
  imagenPrincipal: string;

  @Column({
    type: 'enum',
    enum: CategoriaTela,
  })
  categoria: CategoriaTela;

  @Column({ type: 'varchar', length: 255, nullable: true })
  especialPara: string;

  @Column({
    type: 'enum',
    enum: PropiedadTela,
  })
  elasticidad: PropiedadTela;

  @Column({
    type: 'enum',
    enum: PropiedadTela,
  })
  lavable: PropiedadTela;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}
