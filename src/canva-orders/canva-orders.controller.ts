import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CanvaOrdersService } from './canva-orders.service';
import { CreateCanvaOrderDto } from './dto/create-canva-order.dto';
import { UpdateCanvaOrderStatusDto } from './dto/update-canva-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('canva-orders')
export class CanvaOrdersController {
  constructor(private readonly canvaOrdersService: CanvaOrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCanvaOrderDto: CreateCanvaOrderDto, @Request() req) {
    return this.canvaOrdersService.create(createCanvaOrderDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.canvaOrdersService.findAll();
  }

  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findMyOrders(@Request() req) {
    return this.canvaOrdersService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const order = await this.canvaOrdersService.findOne(id);
    return { success: true, order };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCanvaOrderStatusDto,
  ) {
    return this.canvaOrdersService.updateStatus(id, updateStatusDto);
  }
}
