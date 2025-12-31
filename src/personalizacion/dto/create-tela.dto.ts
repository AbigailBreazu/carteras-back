import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { CategoriaTela, PropiedadTela } from '../entities/tela.entity';

export class CreateTelaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(CategoriaTela)
  @IsNotEmpty()
  categoria: CategoriaTela;

  @IsString()
  @IsOptional()
  especialPara?: string;

  @IsEnum(PropiedadTela)
  @IsNotEmpty()
  elasticidad: PropiedadTela;

  @IsEnum(PropiedadTela)
  @IsNotEmpty()
  lavable: PropiedadTela;

  // El file se sube como FormData
}
