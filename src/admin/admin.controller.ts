import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PersonalizacionService } from '../personalizacion/personalizacion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly personalizacionService: PersonalizacionService,
  ) {}

  @Get('ventas')
  @HttpCode(HttpStatus.OK)
  async getVentas(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('categoria') categoria?: string,
  ) {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;

    return await this.adminService.getVentas(
      fechaInicioDate,
      fechaFinDate,
      categoria,
    );
  }

  @Get('solicitudes-modificacion')
  @HttpCode(HttpStatus.OK)
  async listarSolicitudes(@Query('estado') estado?: string) {
    return await this.personalizacionService.listarSolicitudes(estado);
  }

  @Patch('pedidos/:pedidoId/modificacion/:solicitudId')
  @HttpCode(HttpStatus.OK)
  async gestionarSolicitud(
    @Param('pedidoId') pedidoId: string,
    @Param('solicitudId') solicitudId: string,
    @Body() body: { accion: 'aprobar' | 'rechazar'; mensaje?: string },
    @GetUser() user: any,
  ) {
    return await this.personalizacionService.gestionarSolicitud(
      pedidoId,
      solicitudId,
      body.accion,
      user.id,
      body.mensaje,
    );
  }
}
