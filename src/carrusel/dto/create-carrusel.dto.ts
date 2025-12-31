import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateCarruselDto {
  @IsString()
  @IsNotEmpty()
  imagen: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  orden?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
