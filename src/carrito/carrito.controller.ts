import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AddToCarritoDto } from './dto/add-to-carrito.dto';
import { UpdateCarritoDto } from './dto/update-carrito.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('carrito')
@UseGuards(JwtAuthGuard)
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  agregarProducto(@GetUser('id') usuarioId: string, @Body() addToCarritoDto: AddToCarritoDto) {
    return this.carritoService.agregarProducto(usuarioId, addToCarritoDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  obtenerCarrito(@GetUser('id') usuarioId: string) {
    return this.carritoService.obtenerCarrito(usuarioId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  actualizarCantidad(
    @GetUser('id') usuarioId: string,
    @Param('id') itemId: string,
    @Body() updateCarritoDto: UpdateCarritoDto,
  ) {
    return this.carritoService.actualizarCantidad(usuarioId, itemId, updateCarritoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  eliminarItem(@GetUser('id') usuarioId: string, @Param('id') itemId: string) {
    return this.carritoService.eliminarItem(usuarioId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  vaciarCarrito(@GetUser('id') usuarioId: string) {
    return this.carritoService.vaciarCarrito(usuarioId);
  }
}
