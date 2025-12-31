import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Controller('api/contacto')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendContactMessage(@Body() dto: CreateContactMessageDto) {
    await this.emailService.sendContactMessage(
      dto.nombre,
      dto.email,
      dto.mensaje,
    );

    return {
      message: 'Mensaje enviado exitosamente',
    };
  }
}
