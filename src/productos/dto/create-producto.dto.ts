import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min, IsBoolean, IsArray } from 'class-validator';
import { ProductoTipo } from '../entities/producto.entity';

export class CreateProductoDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio: number;

  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsEnum(ProductoTipo, { message: 'El tipo debe ser: cartera, rinonera, matera, combo, mochila, neceser_pileta, neceser_higiene, mantel_camping, bolso_camping, lonchera_termica, mochilas_pequenas, kit_dormir, otros' })
  tipo: ProductoTipo;

  @IsOptional()
  @IsString()
  tamaño?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
