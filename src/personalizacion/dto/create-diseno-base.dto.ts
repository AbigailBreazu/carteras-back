import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDisenoBaseDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  tamaño?: string;

  @IsOptional()
  @IsNumber()
  diasEstimadosConfeccion?: number;

  // Las imágenes se subirán como FormData (multipart)
  // La validación se hará en el controller
}
