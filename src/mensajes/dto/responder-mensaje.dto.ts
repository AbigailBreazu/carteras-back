import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResponderMensajeDto {
  @IsNotEmpty({ message: 'La respuesta es obligatoria' })
  @IsString()
  @MinLength(10, { message: 'La respuesta debe tener al menos 10 caracteres' })
  respuesta: string;
}
