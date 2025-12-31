import { IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';

export class AddToCarritoDto {
  @IsNotEmpty()
  @IsUUID()
  producto_id: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidad: number;
}
