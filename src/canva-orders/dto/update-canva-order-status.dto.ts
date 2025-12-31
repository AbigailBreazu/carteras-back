import { IsEnum, IsNotEmpty } from 'class-validator';
import { CanvaOrderStatus } from '../schemas/canva-order.schema';

export class UpdateCanvaOrderStatusDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(CanvaOrderStatus, { message: 'Estado inválido' })
  status: CanvaOrderStatus;
}
