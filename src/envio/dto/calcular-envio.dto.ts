import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CalcularEnvioDto {
  @IsNotEmpty({ message: 'El código postal es obligatorio' })
  @IsString()
  codigoPostal: string;

  @IsOptional()
  @IsNumber()
  peso?: number;

  @IsOptional()
  @IsArray()
  items?: Array<{
    id: string;
    cantidad: number;
  }>;
}
