import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoPedido } from '../entities/pedido-personalizacion.entity';

export class UpdateEstadoPedidoDto {
  @IsEnum(EstadoPedido)
  @IsNotEmpty()
  estado: EstadoPedido;
}
