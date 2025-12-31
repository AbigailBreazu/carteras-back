import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDesignDto {
  @IsNotEmpty({ message: 'El modelo de producto es obligatorio' })
  @IsString()
  productModel: string;

  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria' })
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  canvaDesignId?: string;
}
