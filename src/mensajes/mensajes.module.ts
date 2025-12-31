import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajesController } from './mensajes.controller';
import { MensajesService } from './mensajes.service';
import { MensajePedido } from './entities/mensaje-pedido.entity';
import { MensajeGeneral } from './entities/mensaje-general.entity';
import { PedidoPersonalizacion } from '../personalizacion/entities/pedido-personalizacion.entity';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MensajePedido,
      MensajeGeneral,
      PedidoPersonalizacion,
      User,
    ]),
    EmailModule,
    UploadModule,
  ],
  controllers: [MensajesController],
  providers: [MensajesService],
  exports: [MensajesService],
})
export class MensajesModule {}
