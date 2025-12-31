import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CarritoItem } from './entities/carrito.entity';
import { AddToCarritoDto } from './dto/add-to-carrito.dto';
import { UpdateCarritoDto } from './dto/update-carrito.dto';
import { Producto } from '../productos/entities/producto.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(CarritoItem)
    private carritoRepository: Repository<CarritoItem>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  /**
   * Calcula la fecha de expiración (48 horas desde ahora)
   */
  private calcularExpiracion(): Date {
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 48);
    return expiracion;
  }

  /**
   * Limpia automáticamente los carritos expirados
   * Se ejecuta cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async limpiarCarritosExpirados() {
    const ahora = new Date();
    const itemsExpirados = await this.carritoRepository.delete({
      expira_en: LessThan(ahora),
    });

    if (itemsExpirados.affected && itemsExpirados.affected > 0) {
      console.log(`🗑️ Se eliminaron ${itemsExpirados.affected} items expirados del carrito`);
    }
  }

  /**
   * Agregar producto al carrito
   */
  async agregarProducto(usuarioId: string, addToCarritoDto: AddToCarritoDto) {
    const { producto_id, cantidad } = addToCarritoDto;

    // Verificar que el producto existe y tiene stock
    const producto = await this.productoRepository.findOne({
      where: { id: producto_id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (producto.stock < cantidad) {
      throw new BadRequestException(`Stock insuficiente. Disponible: ${producto.stock}`);
    }

    // Limpiar items expirados del usuario antes de agregar
    await this.limpiarCarritoExpirado(usuarioId);

    // Verificar si el producto ya está en el carrito
    let carritoItem = await this.carritoRepository.findOne({
      where: {
        usuario_id: usuarioId,
        producto_id,
      },
    });

    const expiracion = this.calcularExpiracion();

    if (carritoItem) {
      // Actualizar cantidad y renovar expiración
      const nuevaCantidad = carritoItem.cantidad + cantidad;
      
      if (producto.stock < nuevaCantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Tienes ${carritoItem.cantidad} en el carrito. Disponible: ${producto.stock}`,
        );
      }

      carritoItem.cantidad = nuevaCantidad;
      carritoItem.expira_en = expiracion;
      await this.carritoRepository.save(carritoItem);
    } else {
      // Crear nuevo item
      carritoItem = this.carritoRepository.create({
        usuario_id: usuarioId,
        producto_id,
        cantidad,
        expira_en: expiracion,
      });
      await this.carritoRepository.save(carritoItem);
    }

    return {
      success: true,
      message: 'Producto agregado al carrito',
      item: await this.getCarritoItemWithProduct(carritoItem.id),
    };
  }

  /**
   * Obtener carrito del usuario
   */
  async obtenerCarrito(usuarioId: string) {
    // Limpiar items expirados primero
    await this.limpiarCarritoExpirado(usuarioId);

    const items = await this.carritoRepository
      .createQueryBuilder('carrito')
      .leftJoinAndSelect('carrito.producto', 'producto')
      .where('carrito.usuario_id = :usuarioId', { usuarioId })
      .getMany();

    const total = items.reduce(
      (sum, item) => sum + Number(item.producto.precio) * item.cantidad,
      0,
    );

    // Obtener el item con fecha de expiración más reciente
    const expiracionCarrito = items.length > 0
      ? items.reduce((latest, item) => 
          item.expira_en > latest ? item.expira_en : latest, 
          items[0].expira_en
        )
      : null;

    return {
      success: true,
      items: items.map(item => ({
        id: item.id,
        producto: {
          id: item.producto.id,
          nombre: item.producto.nombre,
          precio: item.producto.precio,
          imagenes: item.producto.imagenes,
          stock: item.producto.stock,
        },
        cantidad: item.cantidad,
        subtotal: Number(item.producto.precio) * item.cantidad,
        expira_en: item.expira_en,
      })),
      total,
      cantidad_items: items.length,
      expira_en: expiracionCarrito,
    };
  }

  /**
   * Actualizar cantidad de un item
   */
  async actualizarCantidad(
    usuarioId: string,
    itemId: string,
    updateCarritoDto: UpdateCarritoDto,
  ) {
    const { cantidad } = updateCarritoDto;

    const item = await this.carritoRepository.findOne({
      where: { id: itemId, usuario_id: usuarioId },
      relations: ['producto'],
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (item.producto.stock < cantidad) {
      throw new BadRequestException(`Stock insuficiente. Disponible: ${item.producto.stock}`);
    }

    // Renovar expiración al actualizar
    item.cantidad = cantidad;
    item.expira_en = this.calcularExpiracion();
    await this.carritoRepository.save(item);

    return {
      success: true,
      message: 'Cantidad actualizada',
      item: await this.getCarritoItemWithProduct(item.id),
    };
  }

  /**
   * Eliminar item del carrito
   */
  async eliminarItem(usuarioId: string, itemId: string) {
    const result = await this.carritoRepository.delete({
      id: itemId,
      usuario_id: usuarioId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    return {
      success: true,
      message: 'Producto eliminado del carrito',
    };
  }

  /**
   * Vaciar todo el carrito
   */
  async vaciarCarrito(usuarioId: string) {
    await this.carritoRepository.delete({ usuario_id: usuarioId });

    return {
      success: true,
      message: 'Carrito vaciado',
    };
  }

  /**
   * Limpiar items expirados de un usuario específico
   */
  private async limpiarCarritoExpirado(usuarioId: string) {
    const ahora = new Date();
    await this.carritoRepository.delete({
      usuario_id: usuarioId,
      expira_en: LessThan(ahora),
    });
  }

  /**
   * Obtener item con información del producto
   */
  private async getCarritoItemWithProduct(itemId: string) {
    const item = await this.carritoRepository
      .createQueryBuilder('carrito')
      .leftJoinAndSelect('carrito.producto', 'producto')
      .where('carrito.id = :itemId', { itemId })
      .getOne();

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    return {
      id: item.id,
      producto: {
        id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio,
        imagenes: item.producto.imagenes,
      },
      cantidad: item.cantidad,
      subtotal: Number(item.producto.precio) * item.cantidad,
      expira_en: item.expira_en,
    };
  }
}
