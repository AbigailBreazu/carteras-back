import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orden, OrdenEstado } from './entities/orden.entity';
import { OrdenItem } from './entities/orden-item.entity';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';
import { ProductosService } from '../productos/productos.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Orden)
    private ordenRepository: Repository<Orden>,
    @InjectRepository(OrdenItem)
    private ordenItemRepository: Repository<OrdenItem>,
    private productosService: ProductosService,
    private emailService: EmailService,
  ) {}

  async create(createOrdenDto: CreateOrdenDto, usuarioId?: string) {
    // Validar productos y calcular total
    let total = 0;
    const ordenItems: Partial<OrdenItem>[] = [];

    for (const item of createOrdenDto.items) {
      const producto = await this.productosService.findOne(item.producto_id);

      // Verificar stock
      if (producto.stock < item.cantidad) {
        throw new ConflictException(`Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`);
      }

      // Verificar que el precio coincida
      if (Number(producto.precio) !== Number(item.precio_unitario)) {
        throw new BadRequestException(`El precio del producto ${producto.nombre} no coincide`);
      }

      const subtotal = item.cantidad * item.precio_unitario;
      total += subtotal;

      ordenItems.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal,
      });
    }

    // Crear orden
    const orden = this.ordenRepository.create({
      usuario_id: usuarioId || undefined,
      total,
      datos_cliente: createOrdenDto.datos_cliente,
      estado: OrdenEstado.PENDING,
    });

    await this.ordenRepository.save(orden);

    // Crear items de la orden
    for (const itemData of ordenItems) {
      const item = this.ordenItemRepository.create({
        ...itemData,
        orden_id: orden.id,
      });
      await this.ordenItemRepository.save(item);
    }

    // Cargar la orden con sus items
    const ordenCompleta = await this.ordenRepository.findOne({
      where: { id: orden.id },
      relations: ['items', 'items.producto'],
    });

    if (!ordenCompleta) {
      throw new Error('Error al cargar la orden creada');
    }

    // Enviar emails de notificación
    try {
      const datosCliente = createOrdenDto.datos_cliente;
      
      // Email al cliente
      await this.emailService.sendOrderConfirmation(
        datosCliente.email,
        datosCliente.nombre,
        orden.id,
        orden.total,
        ordenCompleta.items.map(item => ({
          producto: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.precio_unitario,
        })),
      );

      // Email al admin
      await this.emailService.sendAdminOrderNotification(
        orden.id,
        datosCliente.nombre,
        orden.total,
        ordenCompleta.items.map(item => ({
          producto: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.precio_unitario,
        })),
      );
    } catch (emailError) {
      console.error('Error enviando emails de orden:', emailError);
      // No lanzar error - la orden ya fue creada exitosamente
    }

    return {
      message: 'Orden creada exitosamente',
      orden: ordenCompleta,
    };
  }

  async findAll(pagina: number = 1, limite: number = 20) {
    const skip = (pagina - 1) * limite;

    const [ordenes, total] = await this.ordenRepository.findAndCount({
      relations: ['items', 'items.producto', 'usuario'],
      skip,
      take: limite,
      order: {
        created_at: 'DESC',
      },
    });

    const mapped = ordenes.map((orden) => ({
      id: orden.id,
      usuario_id: orden.usuario_id || null,
      items: (orden.items || []).map((it) => ({
        producto_id: it.producto_id,
        nombre: it.producto?.nombre || null,
        cantidad: it.cantidad,
        precio_unitario: Number(it.precio_unitario),
      })),
      total: Number(orden.total),
      estado: orden.estado,
      fecha_creacion: orden.created_at?.toISOString ? orden.created_at.toISOString() : orden.created_at,
      mercadopago_payment_id: orden.mercadopago_payment_id || null,
      mercadopago_status: orden.estado || null,
      comprobante: orden.comprobante || null,
    }));

    return {
      ordenes: mapped,
      total,
      pagina,
    };
  }

  async findOne(id: string) {
    const orden = await this.ordenRepository.findOne({
      where: { id },
      relations: ['items', 'items.producto', 'usuario'],
    });

    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }

    return orden;
  }

  async findByUsuario(usuarioId: string) {
    const ordenes = await this.ordenRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['items', 'items.producto'],
      order: {
        created_at: 'DESC',
      },
    });

    return {
      ordenes: ordenes.map((orden) => ({
        id: orden.id,
        total: orden.total,
        estado: orden.estado,
        created_at: orden.created_at,
        items_count: orden.items.length,
      })),
    };
  }

  async findByUsuarioEmail(email: string, pagina: number = 1, limite: number = 20) {
    const skip = (pagina - 1) * limite;

    const qb = this.ordenRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .where("orden.datos_cliente ->> 'email' = :email", { email })
      .orderBy('orden.created_at', 'DESC')
      .skip(skip)
      .take(limite);

    const [ordenes, total] = await qb.getManyAndCount();

    const mapped = ordenes.map((orden) => ({
      id: orden.id,
      usuario_email: orden.datos_cliente?.email || null,
      items: (orden.items || []).map((it) => ({
        producto_id: it.producto_id,
        nombre: it.producto?.nombre || null,
        cantidad: it.cantidad,
        precio_unitario: Number(it.precio_unitario),
      })),
      total: Number(orden.total),
      estado: orden.estado,
      fecha_creacion: orden.created_at?.toISOString ? orden.created_at.toISOString() : orden.created_at,
      mercadopago_payment_id: orden.mercadopago_payment_id || null,
      mercadopago_status: orden.estado || null,
    }));

    return {
      ordenes: mapped,
      total,
      pagina,
    };
  }

  async updateEstado(id: string, updateEstadoDto: UpdateEstadoOrdenDto) {
    const orden = await this.findOne(id);

    // Si el estado cambia a 'approved', decrementar el stock
    if (updateEstadoDto.estado === OrdenEstado.APPROVED && orden.estado !== OrdenEstado.APPROVED) {
      for (const item of orden.items) {
        await this.productosService.decrementStock(item.producto_id, item.cantidad);
      }
    }

    orden.estado = updateEstadoDto.estado;
    await this.ordenRepository.save(orden);

    return {
      message: 'Estado actualizado exitosamente',
      orden,
    };
  }

  async updateMercadoPagoData(ordenId: string, paymentId: string, preferenceId?: string, comprobante?: any) {
    const orden = await this.findOne(ordenId);

    orden.mercadopago_payment_id = paymentId;
    if (preferenceId) {
      orden.mercadopago_preference_id = preferenceId;
    }

    if (comprobante) {
      orden.comprobante = comprobante;
    }

    await this.ordenRepository.save(orden);
    return orden;
  }
}
