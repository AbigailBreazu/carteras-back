import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateMensajeGeneralDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @IsString()
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  asunto: string;

  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @IsString()
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  mensaje: string;
}
