import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CarruselService } from './carrusel.service';
import { CreateCarruselDto } from './dto/create-carrusel.dto';
import { UpdateCarruselDto } from './dto/update-carrusel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api')
export class CarruselController {
  constructor(private readonly carruselService: CarruselService) {}

  // GET /api/carrusel
  @Get('carrusel')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const imagenes = await this.carruselService.findAll();
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    return imagenes.map((imagen) => {
      // Si la imagen ya contiene la ruta completa, no agregar nada
      const imagenUrl = imagen.imagen.startsWith('http') 
        ? imagen.imagen 
        : imagen.imagen.startsWith('/') 
          ? `${baseUrl}${imagen.imagen}` 
          : imagen.imagen.includes('/')
            ? `${baseUrl}/uploads/${imagen.imagen}`
            : `${baseUrl}/uploads/images/${imagen.imagen}`;
          
      return {
        id: imagen.id,
        imagen: imagenUrl,
        orden: imagen.orden,
        activo: imagen.activo,
        created_at: imagen.created_at,
        updated_at: imagen.updated_at,
      };
    });
  }

  // POST /api/admin/carrusel
  @Post('admin/carrusel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCarruselDto: CreateCarruselDto) {
    const carrusel = await this.carruselService.create(createCarruselDto);
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const imagenUrl = carrusel.imagen.startsWith('http') 
      ? carrusel.imagen 
      : carrusel.imagen.startsWith('/') 
        ? `${baseUrl}${carrusel.imagen}` 
        : carrusel.imagen.includes('/')
          ? `${baseUrl}/uploads/${carrusel.imagen}`
          : `${baseUrl}/uploads/images/${carrusel.imagen}`;
    
    return {
      message: 'Imagen de carrusel creada exitosamente',
      carrusel: {
        id: carrusel.id,
        imagen: imagenUrl,
        orden: carrusel.orden,
        activo: carrusel.activo,
        created_at: carrusel.created_at,
        updated_at: carrusel.updated_at,
      },
    };
  }

  // PUT /api/admin/carrusel/:id
  @Put('admin/carrusel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateCarruselDto: UpdateCarruselDto,
  ) {
    const carrusel = await this.carruselService.update(id, updateCarruselDto);
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const imagenUrl = carrusel.imagen.startsWith('http') 
      ? carrusel.imagen 
      : carrusel.imagen.startsWith('/') 
        ? `${baseUrl}${carrusel.imagen}` 
        : carrusel.imagen.includes('/')
          ? `${baseUrl}/uploads/${carrusel.imagen}`
          : `${baseUrl}/uploads/images/${carrusel.imagen}`;
    
    return {
      message: 'Imagen de carrusel actualizada exitosamente',
      carrusel: {
        id: carrusel.id,
        imagen: imagenUrl,
        orden: carrusel.orden,
        activo: carrusel.activo,
        created_at: carrusel.created_at,
        updated_at: carrusel.updated_at,
      },
    };
  }

  // DELETE /api/admin/carrusel/:id
  @Delete('admin/carrusel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.carruselService.remove(id);
    return {
      message: 'Imagen de carrusel eliminada exitosamente',
    };
  }
}
