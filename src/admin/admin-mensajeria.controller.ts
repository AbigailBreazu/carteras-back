import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MensajesService } from '../mensajes/mensajes.service';

@Controller('api/admin/mensajeria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMensajeriaController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('pedidos')
  @HttpCode(HttpStatus.OK)
  async getPedidosConMensajeria(
    @Query('soloNoLeidos') soloNoLeidos?: string,
  ) {
    const filtrarNoLeidos = soloNoLeidos === 'true';
    return this.mensajesService.getPedidosParaAdminMensajeria(filtrarNoLeidos);
  }
}
