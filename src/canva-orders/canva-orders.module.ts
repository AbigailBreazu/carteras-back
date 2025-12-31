import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CanvaOrdersController } from './canva-orders.controller';
import { CanvaOrdersService } from './canva-orders.service';
import { CanvaOrder, CanvaOrderSchema } from './schemas/canva-order.schema';
import { DesignsModule } from '../designs/designs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CanvaOrder.name, schema: CanvaOrderSchema }]),
    DesignsModule,
  ],
  controllers: [CanvaOrdersController],
  providers: [CanvaOrdersService],
  exports: [CanvaOrdersService],
})
export class CanvaOrdersModule {}
