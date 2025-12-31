import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminMensajeriaController } from './admin-mensajeria.controller';
import { AdminService } from './admin.service';
import { Orden } from '../ordenes/entities/orden.entity';
import { Producto } from '../productos/entities/producto.entity';
import { PedidoPersonalizacion } from '../personalizacion/entities/pedido-personalizacion.entity';
import { MensajesModule } from '../mensajes/mensajes.module';
import { PersonalizacionModule } from '../personalizacion/personalizacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orden, Producto, PedidoPersonalizacion]),
    MensajesModule,
    PersonalizacionModule,
  ],
  controllers: [AdminController, AdminMensajeriaController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
