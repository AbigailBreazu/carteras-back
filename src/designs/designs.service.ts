import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Design, DesignDocument, DesignStatus } from './schemas/design.schema';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignsService {
  constructor(
    @InjectModel(Design.name) private designModel: Model<DesignDocument>,
  ) {}

  async create(createDesignDto: CreateDesignDto, userId: string) {
    const design = new this.designModel({
      ...createDesignDto,
      userId,
      status: DesignStatus.DRAFT,
    });

    await design.save();

    return {
      success: true,
      message: 'Diseño creado exitosamente',
      design,
    };
  }

  async findAll() {
    const designs = await this.designModel.find().sort({ createdAt: -1 }).exec();

    return {
      success: true,
      designs,
      total: designs.length,
    };
  }

  async findOne(id: string) {
    const design = await this.designModel.findById(id).exec();

    if (!design) {
      throw new NotFoundException('Diseño no encontrado');
    }

    return design;
  }

  async approve(id: string) {
    const design = await this.findOne(id);

    if (design.status === DesignStatus.APPROVED) {
      throw new BadRequestException('El diseño ya está aprobado');
    }

    design.status = DesignStatus.APPROVED;
    await design.save();

    return {
      success: true,
      message: 'Diseño aprobado exitosamente',
      design,
    };
  }

  async reject(id: string) {
    const design = await this.findOne(id);

    if (design.status === DesignStatus.APPROVED) {
      throw new BadRequestException('No se puede rechazar un diseño aprobado');
    }

    design.status = DesignStatus.REJECTED;
    await design.save();

    return {
      success: true,
      message: 'Diseño rechazado',
      design,
    };
  }

  async findByUser(userId: string) {
    const designs = await this.designModel.find({ userId }).sort({ createdAt: -1 }).exec();

    return {
      success: true,
      designs,
      total: designs.length,
    };
  }
}
