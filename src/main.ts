import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EmailService } from './email/email.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS
  app.enableCors();
  
  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  
  await app.listen(port);
  
  const logger = new Logger('Bootstrap');
  logger.log('Base de datos conectada');
  logger.log(`Escuchando en el puerto ${port}`);

  // Probar configuración de email al iniciar
  const emailService = app.get(EmailService);
  try {
    logger.log('🔍 Verificando configuración de email...');
    logger.log(`📧 SMTP_HOST: ${configService.get('SMTP_HOST')}`);
    logger.log(`📧 SMTP_PORT: ${configService.get('SMTP_PORT')}`);
    logger.log(`📧 SMTP_USER: ${configService.get('SMTP_USER')}`);
    logger.log(`📧 SMTP_PASS: ${configService.get('SMTP_PASS') ? '****' + configService.get('SMTP_PASS').slice(-4) : 'NO CONFIGURADA'}`);
    
    await emailService.sendEmail({
      to: ['mariapazruiz6@gmail.com'],
      subject: '✅ Backend iniciado correctamente',
      html: `
        <div style="padding: 20px;">
          <h2 style="color: #667eea;">🚀 Backend en línea</h2>
          <p>El servidor backend se ha iniciado correctamente y el sistema de emails está funcionando.</p>
          <p><strong>Puerto:</strong> ${port}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
        </div>
      `,
    });
    logger.log('✅ Email de prueba enviado correctamente');
  } catch (error) {
    logger.error('❌ Error en configuración de email:', error.message);
    logger.error('Stack:', error.stack);
  }
}
bootstrap();
