import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMensajePedidoDto {
  @IsNotEmpty({ message: 'El pedidoId es obligatorio' })
  @IsUUID('4', { message: 'El pedidoId debe ser un UUID válido' })
  pedidoId: string;

  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @IsString()
  @MinLength(1, { message: 'El mensaje no puede estar vacío' })
  mensaje: string;
}
