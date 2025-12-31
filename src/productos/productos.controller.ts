import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProductoTipo } from './entities/producto.entity';

@Controller('api')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // GET /api/productos
  @Get('productos')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('categoria') categoria?: ProductoTipo,
    @Query('minPrecio') minPrecio?: string,
    @Query('maxPrecio') maxPrecio?: string,
    @Query('busqueda') busqueda?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const minPrecioNum = minPrecio ? parseFloat(minPrecio) : undefined;
    const maxPrecioNum = maxPrecio ? parseFloat(maxPrecio) : undefined;

    return await this.productosService.findAll(
      categoria,
      minPrecioNum,
      maxPrecioNum,
      busqueda,
      pageNum,
      limitNum,
    );
  }

  // GET /api/productos/:id
  @Get('productos/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const producto = await this.productosService.findOne(id);
    return producto;
  }

  // POST /api/admin/productos
  @Post('admin/productos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductoDto: CreateProductoDto) {
    const producto = await this.productosService.create(createProductoDto);
    return {
      message: 'Producto creado exitosamente',
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagenes?.[0] || null,
        categoria: producto.tipo,
      },
    };
  }

  // PUT /api/admin/productos/:id
  @Put('admin/productos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    const producto = await this.productosService.update(id, updateProductoDto);
    return {
      message: 'Producto actualizado exitosamente',
      producto,
    };
  }

  // DELETE /api/admin/productos/:id
  @Delete('admin/productos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.productosService.remove(id);
    return {
      message: 'Producto eliminado exitosamente',
    };
  }
}
