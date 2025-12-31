import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CambioEstadoDto {
  @IsNotEmpty()
  @IsString()
  estadoAnterior: string;

  @IsNotEmpty()
  @IsString()
  estadoNuevo: string;
}

export class CreateMensajePedidoInternoDto {
  @IsNotEmpty({ message: 'El pedidoId es obligatorio' })
  @IsUUID('4', { message: 'El pedidoId debe ser un UUID válido' })
  pedidoId: string;

  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @IsString()
  mensaje: string;

  @IsNotEmpty()
  @IsBoolean()
  esAdmin: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CambioEstadoDto)
  cambioEstado?: CambioEstadoDto;
}
