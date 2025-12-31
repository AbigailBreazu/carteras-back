import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrdenEstado } from '../entities/orden.entity';

export class UpdateEstadoOrdenDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(OrdenEstado, { message: 'El estado debe ser: pending, approved, rejected o cancelled' })
  estado: OrdenEstado;
}
