import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  ParseBoolPipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MensajesService } from './mensajes.service';
import { CreateMensajePedidoDto } from './dto/create-mensaje-pedido.dto';
import { CreateMensajeGeneralDto } from './dto/create-mensaje-general.dto';
import { ResponderMensajeDto } from './dto/responder-mensaje.dto';
import { CreateMensajePedidoInternoDto } from './dto/create-mensaje-pedido-interno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UploadService } from '../upload/upload.service';

@Controller('api/mensajes')
export class MensajesController {
  // Inyectamos UploadService para manejo de archivos en mensajes
  constructor(private readonly mensajesService: MensajesService, private readonly uploadService: UploadService) {}

  // ========== MENSAJES DE PEDIDOS ==========

  @Get('pedidos/:pedidoId')
  @UseGuards(JwtAuthGuard)
  async getMensajesPedido(
    @Param('pedidoId') pedidoId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    return this.mensajesService.getMensajesPedido(pedidoId, userId, isAdmin);
  }

  @Post('pedidos')
  @UseGuards(JwtAuthGuard)
  async createMensajePedido(
    @Body(ValidationPipe) createMensajeDto: CreateMensajePedidoDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.nombre;
    const isAdmin = req.user.role === 'admin';

    return this.mensajesService.createMensajePedido(
      createMensajeDto,
      userId,
      userEmail,
      userName,
      isAdmin,
    );
  }

  @Post('pedidos/:pedidoId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadMensajeImage(
    @Param('pedidoId') pedidoId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body('mensaje') mensajeTexto?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.nombre;
    const isAdmin = req.user.role === 'admin';

    const fileUrl = this.uploadService.getFileUrl(file.filename);

    return this.mensajesService.createMensajePedidoWithImage(
      pedidoId,
      fileUrl,
      mensajeTexto || '',
      userId,
      userEmail,
      userName,
      isAdmin,
    );
  }

  @Get('pedidos-no-leidos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPedidosNoLeidos(@Request() req: any) {
    const adminEmail = req.user.email;
    return this.mensajesService.getPedidosConMensajesNoLeidos(adminEmail);
  }

  @Patch('pedidos/:pedidoId/marcar-leidos')
  @UseGuards(JwtAuthGuard)
  async marcarMensajesComoLeidos(
    @Param('pedidoId') pedidoId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const isAdmin = req.user.role === 'admin';

    return this.mensajesService.marcarMensajesPedidoComoLeidos(
      pedidoId,
      userId,
      userEmail,
      isAdmin,
    );
  }

  // ========== MENSAJES INTERNOS (ADMIN) ==========

  @Post('pedidos/internos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createMensajePedidoInterno(
    @Body(ValidationPipe) createMensajeDto: CreateMensajePedidoInternoDto,
    @Request() req: any,
  ) {
    const adminEmail = req.user.email;
    const adminName = req.user.nombre;

    return this.mensajesService.createMensajePedidoInterno(
      createMensajeDto,
      adminEmail,
      adminName,
    );
  }

  // ========== MENSAJES GENERALES (CONTACTO) ==========

  @Post('contacto')
  async createMensajeGeneral(
    @Body(ValidationPipe) createMensajeDto: CreateMensajeGeneralDto,
  ) {
    return this.mensajesService.createMensajeGeneral(createMensajeDto);
  }

  @Get('contacto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getMensajesGenerales(
    @Query('leido') leido?: string,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina?: number,
  ) {
    const leidoBoolean = leido === 'true' ? true : leido === 'false' ? false : undefined;
    return this.mensajesService.getMensajesGenerales(
      leidoBoolean,
      limite || 50,
      pagina || 1,
    );
  }

  @Get('contacto/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getMensajeGeneral(@Param('id') id: string) {
    return this.mensajesService.getMensajeGeneral(id);
  }

  @Patch('contacto/:id/marcar-leido')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async marcarMensajeComoLeido(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const adminEmail = req.user.email;
    return this.mensajesService.marcarMensajeGeneralComoLeido(id, adminEmail);
  }

  @Patch('contacto/:id/responder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async responderMensaje(
    @Param('id') id: string,
    @Body(ValidationPipe) responderDto: ResponderMensajeDto,
  ) {
    return this.mensajesService.responderMensajeGeneral(id, responderDto);
  }

  // ========== NOTIFICACIONES ==========

  @Get('notificaciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getNotificaciones(@Request() req: any) {
    const adminEmail = req.user.email;
    return this.mensajesService.getNotificaciones(adminEmail);
  }
}
