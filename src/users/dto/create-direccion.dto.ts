import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { AliasDireccion } from '../entities/direccion.entity';

export class CreateDireccionDto {
  @IsEnum(AliasDireccion)
  @IsNotEmpty()
  alias: AliasDireccion;

  @IsString()
  @IsNotEmpty()
  provincia: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsOptional()
  codigoPostal?: string;

  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsOptional()
  piso?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  referencias?: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;

  @IsBoolean()
  @IsOptional()
  esPrincipal?: boolean;
}
