import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
