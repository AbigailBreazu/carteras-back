import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarruselController } from './carrusel.controller';
import { CarruselService } from './carrusel.service';
import { Carrusel } from './entities/carrusel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Carrusel])],
  controllers: [CarruselController],
  providers: [CarruselService],
  exports: [CarruselService],
})
export class CarruselModule {}
