import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { UploadModule } from './upload/upload.module';
import { EnvioModule } from './envio/envio.module';
import { CarritoModule } from './carrito/carrito.module';
import { PersonalizacionModule } from './personalizacion/personalizacion.module';
import { AdminModule } from './admin/admin.module';
import { CarruselModule } from './carrusel/carrusel.module';
import { EmailModule } from './email/email.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { DatabaseSeeder } from './database/database-seeder.service';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    // PostgreSQL para productos, usuarios, órdenes normales
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('TYPEORM_SYNC'),
      }),
    }),
    TypeOrmModule.forFeature([User]),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProductosModule,
    OrdenesModule,
    MercadopagoModule,
    UploadModule,
    EnvioModule,
    CarritoModule,
    PersonalizacionModule,
    AdminModule,
    CarruselModule,
    EmailModule,
    MensajesModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseSeeder],
})
export class AppModule {}
