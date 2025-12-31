import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalizacionController } from './personalizacion.controller';
import { PersonalizacionService } from './personalizacion.service';
import { DisenoBase } from './entities/diseno-base.entity';
import { Tela } from './entities/tela.entity';
import { PedidoPersonalizacion } from './entities/pedido-personalizacion.entity';
import { SolicitudModificacion } from './entities/solicitud-modificacion.entity';
import { User } from '../users/entities/user.entity';
import { Direccion } from '../users/entities/direccion.entity';
import { MensajesModule } from '../mensajes/mensajes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisenoBase, Tela, PedidoPersonalizacion, SolicitudModificacion, User, Direccion]),
    MensajesModule,
  ],
  controllers: [PersonalizacionController],
  providers: [PersonalizacionService],
  exports: [PersonalizacionService],
})
export class PersonalizacionModule {}

