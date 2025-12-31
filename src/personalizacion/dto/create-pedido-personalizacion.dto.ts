import { IsUUID, IsArray, IsString, IsOptional, ValidateIf } from 'class-validator';

export class CreatePedidoPersonalizacionDto {
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.disenoPropio)
  disenoBaseId?: string;

  // disenoPropio se maneja como File en FormData

  @IsArray()
  @IsString({ each: true })
  telasSeleccionadas: string[];

  @IsString()
  @IsOptional()
  comentarios?: string;
}
