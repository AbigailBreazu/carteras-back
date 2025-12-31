import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateCanvaOrderDto {
  @IsNotEmpty({ message: 'El ID del diseño es obligatorio' })
  @IsString()
  designId: string;

  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @IsString()
  clientName: string;

  @IsNotEmpty({ message: 'El email del cliente es obligatorio' })
  @IsEmail({}, { message: 'Email inválido' })
  clientEmail: string;
}
