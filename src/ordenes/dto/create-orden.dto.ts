import { IsNotEmpty, IsArray, ValidateNested, IsString, IsEmail, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrdenItemDto {
  @IsNotEmpty({ message: 'El producto_id es obligatorio' })
  @IsUUID()
  producto_id: string;

  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @IsNotEmpty({ message: 'El precio_unitario es obligatorio' })
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio_unitario: number;
}

export class DatosClienteDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsString()
  telefono: string;
}

export class CreateOrdenDto {
  @IsNotEmpty({ message: 'Los items son obligatorios' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrdenItemDto)
  items: CreateOrdenItemDto[];

  @IsNotEmpty({ message: 'Los datos del cliente son obligatorios' })
  @ValidateNested()
  @Type(() => DatosClienteDto)
  datos_cliente: DatosClienteDto;

  @IsOptional()
  @IsUUID()
  usuario_id?: string;
}
