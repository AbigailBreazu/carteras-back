import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PersonalizacionService } from './personalizacion.service';
import { CreateDisenoBaseDto } from './dto/create-diseno-base.dto';
import { CreateTelaDto } from './dto/create-tela.dto';
import { CreatePedidoPersonalizacionDto } from './dto/create-pedido-personalizacion.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CategoriaTela, Tela } from './entities/tela.entity';
import { EstadoPedido } from './entities/pedido-personalizacion.entity';
import { DisenoBase } from './entities/diseno-base.entity';
import { MensajesService } from '../mensajes/mensajes.service';

const multerConfig = {
  storage: diskStorage({
    destination: './uploads/telas',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(
        new BadRequestException('Solo se permiten imágenes (JPG, PNG, WEBP)'),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB para telas
  },
};

const multerConfigDisenoPropio = {
  storage: diskStorage({
    destination: './uploads/disenos',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `diseno-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(
        new BadRequestException('Solo se permiten imágenes (JPG, PNG, WEBP)'),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB para diseños propios
  },
};

@Controller('api/personalizacion')
export class PersonalizacionController {
  constructor(
    private readonly personalizacionService: PersonalizacionService,
    private readonly mensajesService: MensajesService,
  ) {}

  // ========== DISEÑOS BASE ==========

  @Get('disenos-base')
  @HttpCode(HttpStatus.OK)
  async getDisenosBase() {
    const disenos = await this.personalizacionService.findAllDisenosBase();
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const formatUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${baseUrl}${path}`;
      if (path.includes('/')) return `${baseUrl}/uploads/${path}`;
      return `${baseUrl}/uploads/disenos-base/${path}`;
    };

    return disenos.map((diseno) => ({
      id: diseno.id,
      nombre: diseno.nombre,
      tamaño: diseno.tamaño || null,
      diasEstimadosConfeccion: diseno.diasEstimadosConfeccion || null,
      imagenes: diseno.imagenes.map(formatUrl),
      imagenPrincipal: formatUrl(diseno.imagenPrincipal),
      activo: diseno.activo,
      fechaCreacion: diseno.fechaCreacion.toISOString(),
    }));
  }

  @Get('disenos-base/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getDisenoBase(@Param('id') id: string) {
    const diseno = await this.personalizacionService.findOneDisenoBase(id);
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const formatUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${baseUrl}${path}`;
      if (path.includes('/')) return `${baseUrl}/uploads/${path}`;
      return `${baseUrl}/uploads/disenos-base/${path}`;
    };

    return {
      id: diseno.id,
      nombre: diseno.nombre,
      tamaño: diseno.tamaño || null,
      diasEstimadosConfeccion: diseno.diasEstimadosConfeccion || null,
      imagenes: diseno.imagenes.map(formatUrl),
      imagenPrincipal: formatUrl(diseno.imagenPrincipal),
      activo: diseno.activo,
      fechaCreacion: diseno.fechaCreacion.toISOString(),
    };
  }

  @Post('disenos-base')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createDisenoBase(
    @Body() body: {
      nombre: string;
      tamaño?: string;
      diasEstimadosConfeccion?: number;
      imagenes: string[];
      imagenPrincipal: string;
    },
  ) {
    if (!body.nombre) {
      throw new BadRequestException('nombre es obligatorio');
    }

    if (!body.imagenes || body.imagenes.length < 1) {
      throw new BadRequestException('imagenes debe tener al menos 1 imagen');
    }

    if (!body.imagenPrincipal) {
      throw new BadRequestException('imagenPrincipal es obligatorio');
    }

    if (!body.imagenes.includes(body.imagenPrincipal)) {
      throw new BadRequestException('imagenPrincipal debe ser una de las URLs en imagenes');
    }

    const diseno = await this.personalizacionService.createDisenoBaseSimple({
      nombre: body.nombre,
      tamaño: body.tamaño,
      diasEstimadosConfeccion: body.diasEstimadosConfeccion,
      imagenes: body.imagenes,
      imagenPrincipal: body.imagenPrincipal,
    });

    return {
      id: diseno.id,
      nombre: diseno.nombre,
      tamaño: diseno.tamaño || null,
      diasEstimadosConfeccion: diseno.diasEstimadosConfeccion || null,
      imagenes: diseno.imagenes,
      imagenPrincipal: diseno.imagenPrincipal,
      fechaCreacion: diseno.fechaCreacion.toISOString(),
    };
  }

  @Patch('disenos-base/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateDisenoBase(
    @Param('id') id: string,
    @Body() updateData: Partial<DisenoBase>,
  ) {
    const diseno = await this.personalizacionService.updateDisenoBase(id, updateData);
    return {
      id: diseno.id,
      nombre: diseno.nombre,
      tamaño: diseno.tamaño || null,
      diasEstimadosConfeccion: diseno.diasEstimadosConfeccion || null,
      imagenes: diseno.imagenes,
      imagenPrincipal: diseno.imagenPrincipal,
      activo: diseno.activo,
      fechaCreacion: diseno.fechaCreacion.toISOString(),
    };
  }

  @Delete('disenos-base/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteDisenoBase(@Param('id') id: string) {
    await this.personalizacionService.deleteDisenoBase(id);
    return { 
      success: true,
      message: 'Diseño eliminado correctamente'
    };
  }

  // ========== TELAS ==========

  @Get('telas')
  @HttpCode(HttpStatus.OK)
  async getTelas(@Query('categoria') categoria?: CategoriaTela) {
    const telas = await this.personalizacionService.findAllTelas(categoria);
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const formatUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${baseUrl}${path}`;
      if (path.includes('/')) return `${baseUrl}/uploads/${path}`;
      return `${baseUrl}/uploads/telas/${path}`;
    };

    return telas.map((tela) => ({
      id: tela.id,
      nombre: tela.nombre,
      imagenes: tela.imagenes.map(formatUrl),
      imagenPrincipal: formatUrl(tela.imagenPrincipal),
      categoria: tela.categoria,
      especialPara: tela.especialPara,
      elasticidad: tela.elasticidad,
      lavable: tela.lavable,
      activo: tela.activo,
      fechaCreacion: tela.fechaCreacion.toISOString(),
    }));
  }

  @Post('telas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTela(
    @Body() body: {
      nombre: string;
      imagenes: string[];
      imagenPrincipal: string;
      categoria: string;
      especialPara?: string;
      elasticidad: string;
      lavable: string;
    },
  ) {
    if (!body.nombre || !body.imagenes || !body.imagenPrincipal || !body.categoria || !body.elasticidad || !body.lavable) {
      throw new BadRequestException('Todos los campos son obligatorios excepto especialPara');
    }

    if (!body.imagenes.includes(body.imagenPrincipal)) {
      throw new BadRequestException('imagenPrincipal debe ser una de las URLs en imagenes');
    }

    const tela = await this.personalizacionService.createTelaSimple({
      nombre: body.nombre,
      imagenes: body.imagenes,
      imagenPrincipal: body.imagenPrincipal,
      categoria: body.categoria as CategoriaTela,
      especialPara: body.especialPara,
      elasticidad: body.elasticidad,
      lavable: body.lavable,
    });

    return {
      id: tela.id,
      nombre: tela.nombre,
      imagenes: tela.imagenes,
      imagenPrincipal: tela.imagenPrincipal,
      categoria: tela.categoria,
      especialPara: tela.especialPara,
      elasticidad: tela.elasticidad,
      lavable: tela.lavable,
      fechaCreacion: tela.fechaCreacion.toISOString(),
    };
  }

  @Get('telas/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getTela(@Param('id') id: string) {
    const tela = await this.personalizacionService.findOneTela(id);
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const formatUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${baseUrl}${path}`;
      if (path.includes('/')) return `${baseUrl}/uploads/${path}`;
      return `${baseUrl}/uploads/telas/${path}`;
    };

    return {
      id: tela.id,
      nombre: tela.nombre,
      imagenes: tela.imagenes.map(formatUrl),
      imagenPrincipal: formatUrl(tela.imagenPrincipal),
      categoria: tela.categoria,
      especialPara: tela.especialPara,
      elasticidad: tela.elasticidad,
      lavable: tela.lavable,
      activo: tela.activo,
      fechaCreacion: tela.fechaCreacion.toISOString(),
    };
  }

  @Patch('telas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTela(
    @Param('id') id: string,
    @Body() updateData: Partial<Tela>,
  ) {
    const tela = await this.personalizacionService.updateTela(id, updateData);
    return {
      id: tela.id,
      nombre: tela.nombre,
      imagenes: tela.imagenes,
      imagenPrincipal: tela.imagenPrincipal,
      categoria: tela.categoria,
      especialPara: tela.especialPara,
      elasticidad: tela.elasticidad,
      lavable: tela.lavable,
      activo: tela.activo,
      fechaCreacion: tela.fechaCreacion.toISOString(),
    };
  }

  @Delete('telas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTela(@Param('id') id: string) {
    await this.personalizacionService.deleteTela(id);
    return { 
      success: true,
      message: 'Tela eliminada correctamente'
    };
  }

  // ========== PEDIDOS PERSONALIZACIÓN ==========

  @Get('pedidos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPedidos(
    @GetUser() user: any,
    @Query('userEmail') userEmail?: string,
  ) {
    const isAdmin = user.rol === UserRole.ADMIN;
    
    // Si no es admin, forzar filtro por su propio email
    const emailFiltro = isAdmin && userEmail ? userEmail : (!isAdmin ? user.email : undefined);

    return await this.personalizacionService.findAllPedidosSimple(emailFiltro);
  }

  @Post('pedidos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPedido(
    @GetUser() user: any,
    @Body() body: {
      userEmail: string;
      userName: string;
      disenoBase: string | null;
      disenoPropio: string | null;
      telasSeleccionadas: string[];
      comentarios: string;
      estado?: string;
    },
  ) {
    // Validaciones según especificación
    if (!body.userEmail) {
      throw new BadRequestException('userEmail es obligatorio');
    }

    if (!body.userName) {
      throw new BadRequestException('userName es obligatorio');
    }

    // Al menos uno de disenoBase o disenoPropio debe estar presente
    if (!body.disenoBase && !body.disenoPropio) {
      throw new BadRequestException('Al menos uno de disenoBase o disenoPropio debe estar presente');
    }

    const pedido = await this.personalizacionService.createPedidoSimple({
      userEmail: body.userEmail,
      userName: body.userName,
      disenoBase: body.disenoBase,
      disenoPropio: body.disenoPropio,
      telasSeleccionadas: body.telasSeleccionadas || [],
      comentarios: body.comentarios || '',
      estado: 'PENDIENTE', // Estado inicial siempre es PENDIENTE
    });

    return pedido;
  }

  @Get('pedidos/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPedido(@Param('id') id: string, @GetUser() user: any) {
    const isAdmin = user.rol === UserRole.ADMIN;
    const pedido = await this.personalizacionService.findOnePedido(
      id,
      user.id,
      isAdmin,
    );

    // URLs should already be complete or need BASE_URL prepended only if relative
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';

    // Helper function to format URLs correctly
    const formatUrl = (path: string) => {
      if (!path) return path;
      // If already a full URL, return as-is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      // If starts with /, it's already a valid relative path
      if (path.startsWith('/')) {
        return `${baseUrl}${path}`;
      }
      // If contains subfolder path (disenos-base/, telas/, disenos/), use it directly
      if (path.includes('/')) {
        return `${baseUrl}/uploads/${path}`;
      }
      // For backward compatibility: plain filenames go to /images/ folder
      return `${baseUrl}/uploads/images/${path}`;
    };

    if (pedido.disenoBase) {
      pedido.disenoBase.imagenes = pedido.disenoBase.imagenes.map(formatUrl);
      pedido.disenoBase.imagenPrincipal = formatUrl(pedido.disenoBase.imagenPrincipal);
    }

    if (pedido.disenoPropio) {
      pedido.disenoPropio = formatUrl(pedido.disenoPropio);
    }

    pedido.telas = pedido.telas.map((tela: any) => ({
      ...tela,
      url: formatUrl(tela.url),
    }));

    return pedido;
  }

  @Patch('pedidos/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePedido(
    @Param('id') id: string,
    @Body() updateData: any,
    @GetUser() user: any,
  ) {
    const isAdmin = user.rol === UserRole.ADMIN;

    // Si es admin, usa el método antiguo
    if (isAdmin && updateData.estado) {
      const pedido = await this.personalizacionService.updateEstadoPedido(
        id,
        updateData,
        user.email,
      );

      return {
        message: 'Estado actualizado correctamente',
        pedido: {
          id: pedido.id,
          estado: pedido.estado,
          fechaActualizacion: pedido.fechaActualizacion,
        },
      };
    }

    // Si es cliente, usa el método con autorización
    return await this.personalizacionService.actualizarPedidoConAutorizacion(
      id,
      user.id,
      updateData,
    );
  }

  @Post('pedidos/:id/solicitar-modificacion')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async solicitarModificacion(
    @Param('id') id: string,
    @Body() body: { motivo: string },
    @GetUser() user: any,
  ) {
    return await this.personalizacionService.solicitarModificacion(
      id,
      user.id,
      body.motivo,
    );
  }

  @Get('pedidos/:id/puede-editar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async puedeEditar(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return await this.personalizacionService.puedeEditar(id, user.id);
  }

  @Delete('pedidos/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePedido(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const isAdmin = user.rol === UserRole.ADMIN;
    await this.personalizacionService.deletePedido(id, user.id, isAdmin);
    return { 
      success: true,
      message: 'Pedido eliminado correctamente'
    };
  }

  // ========== MENSAJES DE PEDIDOS ==========

  @Get('pedidos/:pedidoId/mensajes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMensajesPedido(
    @Param('pedidoId') pedidoId: string,
    @GetUser() user: any,
  ) {
    return this.mensajesService.findAllByPedido(pedidoId, user.email, user.rol === UserRole.ADMIN);
  }

  @Post('pedidos/:pedidoId/mensajes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMensajePedido(
    @Param('pedidoId') pedidoId: string,
    @Body() createMensajeDto: any,
    @GetUser() user: any,
  ) {
    const isAdmin = user.rol === UserRole.ADMIN;
    
    // Validar que cliente no pueda usar esAdmin: true
    if (!isAdmin && createMensajeDto.esAdmin === true) {
      throw new ForbiddenException('No autorizado para enviar mensajes como administrador');
    }
    
    return this.mensajesService.createMensajePedidoSimple({
      pedidoId,
      mensaje: createMensajeDto.mensaje,
      esAdmin: isAdmin && createMensajeDto.esAdmin === true,
      cambioEstado: createMensajeDto.cambioEstado,
    }, user.email, user.nombre);
  }

  @Post('pedidos/:pedidoId/mensajes/marcar-leidos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async marcarMensajesLeidos(
    @Param('pedidoId') pedidoId: string,
    @Body() body: { esAdmin: boolean },
    @GetUser() user: any,
  ) {
    const marcados = await this.mensajesService.marcarMensajesComoLeidos(
      pedidoId,
      body.esAdmin,
      user.email,
    );

    return {
      success: true,
      marcados
    };
  }

  @Post('pedidos/mensajes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createMensajePedidoInterno(
    @Body() createMensajeDto: any,
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
}
