import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orden } from '../ordenes/entities/orden.entity';
import { Producto } from '../productos/entities/producto.entity';
import { PedidoPersonalizacion, EstadoPedido } from '../personalizacion/entities/pedido-personalizacion.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Orden)
    private ordenRepository: Repository<Orden>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(PedidoPersonalizacion)
    private pedidoPersonalizacionRepository: Repository<PedidoPersonalizacion>,
  ) {}

  async getVentas(
    fechaInicio?: Date,
    fechaFin?: Date,
    categoria?: string,
  ) {
    // Construir query para órdenes
    let queryBuilder = this.ordenRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .where('orden.estado != :estado', { estado: 'cancelada' });

    if (fechaInicio) {
      queryBuilder = queryBuilder.andWhere('orden.created_at >= :fechaInicio', {
        fechaInicio,
      });
    }

    if (fechaFin) {
      queryBuilder = queryBuilder.andWhere('orden.created_at <= :fechaFin', {
        fechaFin,
      });
    }

    const ordenes = await queryBuilder.getMany();

    // Calcular ventas totales
    let ventasTotales = 0;
    let cantidadVentas = ordenes.length;
    const ventasPorCategoria: { [key: string]: number } = {};
    const productosMasVendidos: {
      [key: string]: {
        productoId: string;
        nombre: string;
        cantidadVendida: number;
        ingresoTotal: number;
      };
    } = {};

    ordenes.forEach((orden) => {
      ventasTotales += parseFloat(orden.total.toString());

      orden.items.forEach((item) => {
        const categoriaProducto = item.producto.tipo;
        const precioItem = parseFloat(item.precio_unitario.toString());
        const cantidad = item.cantidad;

        // Ventas por categoría
        if (!ventasPorCategoria[categoriaProducto]) {
          ventasPorCategoria[categoriaProducto] = 0;
        }
        ventasPorCategoria[categoriaProducto] += cantidad;

        // Productos más vendidos
        if (!productosMasVendidos[item.producto.id]) {
          productosMasVendidos[item.producto.id] = {
            productoId: item.producto.id,
            nombre: item.producto.nombre,
            cantidadVendida: 0,
            ingresoTotal: 0,
          };
        }
        productosMasVendidos[item.producto.id].cantidadVendida += cantidad;
        productosMasVendidos[item.producto.id].ingresoTotal +=
          precioItem * cantidad;
      });
    });

    // Aplicar filtro de categoría si se proporcionó
    if (categoria) {
      const ventasFiltradasPorCategoria = ventasPorCategoria[categoria] || 0;
      Object.keys(ventasPorCategoria).forEach((cat) => {
        if (cat !== categoria) {
          delete ventasPorCategoria[cat];
        }
      });
    }

    // Convertir productos más vendidos a array y ordenar
    const productosMasVendidosArray = Object.values(productosMasVendidos)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 10); // Top 10

    // Obtener estadísticas de pedidos de personalización
    const pedidosPersonalizacion = await this.pedidoPersonalizacionRepository.find();

    const estadisticasPedidos = {
      pendientes: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.PENDIENTE,
      ).length,
      en_modificacion: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.EN_MODIFICACION,
      ).length,
      aprobados: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.APROBADO,
      ).length,
      esperando_stock: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.ESPERANDO_STOCK,
      ).length,
      en_produccion: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.EN_PRODUCCION,
      ).length,
      terminados: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.TERMINADO,
      ).length,
      enviados: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.ENVIADO,
      ).length,
      entregados: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.ENTREGADO,
      ).length,
      cancelados: pedidosPersonalizacion.filter(
        (p) => p.estado === EstadoPedido.CANCELADO,
      ).length,
    };

    return {
      ventasTotales,
      cantidadVentas,
      ventasPorCategoria,
      productosMasVendidos: productosMasVendidosArray,
      pedidosPersonalizacion: estadisticasPedidos,
    };
  }
}
