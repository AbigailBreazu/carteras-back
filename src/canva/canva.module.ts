import { Module } from '@nestjs/common';
import { CanvaController } from './canva.controller';
import { DesignsModule } from '../designs/designs.module';

@Module({
  imports: [DesignsModule],
  controllers: [CanvaController],
})
export class CanvaModule {}
