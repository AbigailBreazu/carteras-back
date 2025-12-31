import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrdenDto: CreateOrdenDto, @Request() req: any, @GetUser() user?: any) {
    // Si el usuario está autenticado, usar su ID
    let usuarioId = req.user?.id || createOrdenDto.usuario_id;

    // Si viene token con email, asegurar que datos_cliente.email esté presente
    if (user && user.email) {
      usuarioId = user.id || usuarioId;
      createOrdenDto.datos_cliente = {
        ...(createOrdenDto.datos_cliente || {}),
        email: user.email,
      };
    }

    return this.ordenesService.create(createOrdenDto, usuarioId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query('pagina') pagina?: string, @Query('limite') limite?: string) {
    const paginaNum = pagina ? parseInt(pagina, 10) : 1;
    const limiteNum = limite ? parseInt(limite, 10) : 20;
    return this.ordenesService.findAll(paginaNum, limiteNum);
  }

  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findMyOrders(@GetUser() user: any) {
    return this.ordenesService.findByUsuario(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.ordenesService.findOne(id);
  }

  @Get('usuario/:email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findByUsuarioEmail(
    @Param('email') email: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @GetUser() user?: any,
  ) {
    // Si no es admin, sólo puede consultar su propio email
    const isAdmin = user?.role === UserRole.ADMIN;
    if (!isAdmin && user?.email !== email) {
      throw new ForbiddenException('No autorizado para ver las órdenes de este usuario');
    }

    const paginaNum = pagina ? parseInt(pagina, 10) : 1;
    const limiteNum = limite ? parseInt(limite, 10) : 20;

    return this.ordenesService.findByUsuarioEmail(email, paginaNum, limiteNum);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateEstado(@Param('id') id: string, @Body() updateEstadoDto: UpdateEstadoOrdenDto) {
    return this.ordenesService.updateEstado(id, updateEstadoDto);
  }
}
