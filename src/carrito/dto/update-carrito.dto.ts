import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpdateCarritoDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidad: number;
}
