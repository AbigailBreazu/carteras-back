import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  // Test override: enviar todos los emails a una bandeja de pruebas
  const TEST_EMAIL = 'abiiibreazuuu@gmail.com';
  const originalSendEmail = (emailService as any).sendEmail.bind(emailService);
  (emailService as any).sendEmail = async (options: any) => {
    return await originalSendEmail({ ...options, to: [TEST_EMAIL] });
  };

  try {
    console.log('Sending welcome email...');
    await emailService.sendWelcomeEmail('test+welcome@example.com', 'Test Welcome');

    console.log('Sending order confirmation...');
    const items = [
      { nombre: 'Bolso', cantidad: 1, precio: 49.99 },
      { nombre: 'Billetera', cantidad: 2, precio: 12.5 },
    ];
    await emailService.sendOrderConfirmation('test+order@example.com', 'Cliente Test', 'ORDER123456', 74.99, items);

    console.log('Sending custom order notification...');
    await emailService.sendCustomOrderNotification('test+custom@example.com', 'Cliente Test', 'PED123456', 'Diseño A', ['Tela A', 'Tela B']);

    console.log('Sending custom order status update...');
    await emailService.sendCustomOrderStatusUpdate('test+status@example.com', 'Cliente Test', 'PED123456', 'en_produccion');

    console.log('Sending admin order notification...');
    await emailService.sendAdminOrderNotification('ORDER123456', 'Cliente Test', 74.99, items);

    console.log('Sending admin custom order notification...');
    await emailService.sendAdminCustomOrderNotification('PED123456', 'Cliente Test', 'cliente@example.com', 'Diseño A');

    console.log('Sending contact message...');
    await emailService.sendContactMessage('Contacto Test', 'test+contact@example.com', 'Mensaje de prueba: esto es una prueba de la funcionalidad de emails.');

    console.log('All email tasks executed.');
  } catch (error) {
    console.error('Error sending emails:', error);
  } finally {
    await app.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
