import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CanvaOrder, CanvaOrderDocument, CanvaOrderStatus } from './schemas/canva-order.schema';
import { CreateCanvaOrderDto } from './dto/create-canva-order.dto';
import { UpdateCanvaOrderStatusDto } from './dto/update-canva-order-status.dto';
import { DesignsService } from '../designs/designs.service';
import { DesignStatus } from '../designs/schemas/design.schema';

@Injectable()
export class CanvaOrdersService {
  constructor(
    @InjectModel(CanvaOrder.name) private canvaOrderModel: Model<CanvaOrderDocument>,
    private designsService: DesignsService,
  ) {}

  async create(createCanvaOrderDto: CreateCanvaOrderDto, userId: string) {
    // Verificar que el diseño existe y está aprobado
    const design = await this.designsService.findOne(createCanvaOrderDto.designId);

    if (design.status !== DesignStatus.APPROVED) {
      throw new BadRequestException('Solo se pueden crear pedidos con diseños aprobados');
    }

    const order = new this.canvaOrderModel({
      ...createCanvaOrderDto,
      designId: new Types.ObjectId(createCanvaOrderDto.designId),
      userId,
      fileUrl: design.imageUrl, // Usar la imagen del diseño
      status: CanvaOrderStatus.APPROVED,
    });

    await order.save();

    return {
      success: true,
      message: 'Pedido creado exitosamente',
      order,
    };
  }

  async findAll() {
    const orders = await this.canvaOrderModel
      .find()
      .populate('designId')
      .sort({ createdAt: -1 })
      .exec();

    return {
      success: true,
      orders,
      total: orders.length,
    };
  }

  async findOne(id: string) {
    const order = await this.canvaOrderModel
      .findById(id)
      .populate('designId')
      .exec();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateCanvaOrderStatusDto) {
    const order = await this.findOne(id);

    // Regla crítica: no se edita Order en producción o completado
    if (order.status === CanvaOrderStatus.IN_PRODUCTION || order.status === CanvaOrderStatus.COMPLETED) {
      throw new BadRequestException('No se puede modificar un pedido en producción o completado');
    }

    order.status = updateStatusDto.status;
    await order.save();

    return {
      success: true,
      message: 'Estado actualizado exitosamente',
      order,
    };
  }

  async findByUser(userId: string) {
    const orders = await this.canvaOrderModel
      .find({ userId })
      .populate('designId')
      .sort({ createdAt: -1 })
      .exec();

    return {
      success: true,
      orders,
      total: orders.length,
    };
  }
}
