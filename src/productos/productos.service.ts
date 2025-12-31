import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto, ProductoTipo } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { formatImagenesArray } from './helpers/imagen-url.helper';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async create(createProductoDto: CreateProductoDto) {
    const producto = this.productoRepository.create(createProductoDto);
    await this.productoRepository.save(producto);

    // Formatear URLs de imágenes
    producto.imagenes = formatImagenesArray(producto.imagenes);

    return producto;
  }

  async findAll(
    categoria?: ProductoTipo,
    minPrecio?: number,
    maxPrecio?: number,
    busqueda?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .where('producto.activo = :activo', { activo: true });

    if (categoria) {
      queryBuilder.andWhere('producto.tipo = :categoria', { categoria });
    }

    if (minPrecio !== undefined) {
      queryBuilder.andWhere('producto.precio >= :minPrecio', { minPrecio });
    }

    if (maxPrecio !== undefined) {
      queryBuilder.andWhere('producto.precio <= :maxPrecio', { maxPrecio });
    }

    if (busqueda) {
      queryBuilder.andWhere(
        '(LOWER(producto.nombre) LIKE LOWER(:busqueda) OR LOWER(producto.descripcion) LIKE LOWER(:busqueda))',
        { busqueda: `%${busqueda}%` },
      );
    }

    const [productos, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('producto.created_at', 'DESC')
      .getManyAndCount();

    // Formatear URLs de imágenes para todos los productos
    const productosConUrls = productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      categoria: producto.tipo,
      descripcion: producto.descripcion,
      imagen: formatImagenesArray(producto.imagenes)?.[0] || null,
      stock: producto.stock,
      destacado: false, // Puedes agregar este campo a la entidad si lo necesitas
      createdAt: producto.created_at,
    }));

    return {
      productos: productosConUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const producto = await this.productoRepository.findOne({ where: { id } });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Formatear URLs de imágenes
    producto.imagenes = formatImagenesArray(producto.imagenes);

    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);

    Object.assign(producto, updateProductoDto);
    await this.productoRepository.save(producto);

    // Formatear URLs de imágenes
    producto.imagenes = formatImagenesArray(producto.imagenes);

    return {
      message: 'Producto actualizado exitosamente',
      producto,
    };
  }

  async remove(id: string) {
    const producto = await this.findOne(id);
    await this.productoRepository.remove(producto);

    return {
      message: 'Producto eliminado exitosamente',
    };
  }

  async decrementStock(id: string, cantidad: number) {
    const producto = await this.findOne(id);

    if (producto.stock < cantidad) {
      throw new BadRequestException(`Stock insuficiente para el producto ${producto.nombre}`);
    }

    producto.stock -= cantidad;
    await this.productoRepository.save(producto);

    return producto;
  }
}
