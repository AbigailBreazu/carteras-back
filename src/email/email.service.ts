import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private transporterReady: Promise<void>;

  constructor(private configService: ConfigService) {
    this.transporterReady = this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const OAuth2 = google.auth.OAuth2;
      const oauth2Client = new OAuth2(
        this.configService.get<string>('OAUTH_CLIENT_ID'),
        this.configService.get<string>('OAUTH_CLIENT_SECRET'),
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oauth2Client.setCredentials({
        refresh_token: this.configService.get<string>('OAUTH_REFRESH_TOKEN'),
      });

      const accessToken = await oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: this.configService.get<string>('SMTP_USER'),
          clientId: this.configService.get<string>('OAUTH_CLIENT_ID'),
          clientSecret: this.configService.get<string>('OAUTH_CLIENT_SECRET'),
          refreshToken: this.configService.get<string>('OAUTH_REFRESH_TOKEN'),
          accessToken: accessToken.token,
        },
      } as any);
      
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.warn('⚠️ Email service not available:', error.message);
      console.warn('⚠️ Server will continue without email functionality');
      // No lanzar el error para que el servidor pueda iniciar
    }
  }

  private getEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Georgia', 'Times New Roman', serif; 
              background-color: #FADEDD; 
              padding: 20px; 
              line-height: 1.6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white; 
              border-radius: 15px; 
              overflow: hidden; 
              box-shadow: 0 5px 20px rgba(84, 117, 82, 0.15);
              border: 1px solid #9CC3A6;
            }
            .header { 
              background: linear-gradient(135deg, #547552 0%, #9CC3A6 100%); 
              padding: 40px 30px; 
              text-align: center;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: #D78492;
            }
            .header h1 { 
              color: white; 
              font-size: 32px; 
              margin-bottom: 10px;
              font-weight: 300;
              letter-spacing: 2px;
            }
            .header p { 
              color: rgba(255,255,255,0.95); 
              font-size: 15px;
              font-style: italic;
              font-family: 'Georgia', serif;
            }
            .content { 
              padding: 40px 35px;
              color: #333;
              font-size: 15px;
            }
            .content h2 {
              color: #547552;
              font-size: 24px;
              margin-bottom: 20px;
              font-weight: 400;
              border-bottom: 2px solid #9CC3A6;
              padding-bottom: 10px;
            }
            .content p {
              margin-bottom: 15px;
              color: #555;
            }
            .content ul {
              margin: 20px 0;
              padding-left: 25px;
            }
            .content ul li {
              margin-bottom: 10px;
              color: #555;
            }
            .footer { 
              background: linear-gradient(to bottom, #FADEDD, #FAE5E3); 
              padding: 25px 20px; 
              text-align: center; 
              border-top: 2px solid #D78492;
            }
            .footer p { 
              color: #547552; 
              font-size: 13px; 
              margin-bottom: 8px;
              font-family: 'Arial', sans-serif;
            }
            .footer strong {
              color: #547552;
              font-size: 14px;
            }
            .button { 
              display: inline-block; 
              padding: 14px 35px; 
              background: linear-gradient(135deg, #D78492 0%, #C47080 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 25px; 
              margin: 20px 0;
              font-weight: 500;
              letter-spacing: 1px;
              box-shadow: 0 4px 10px rgba(215, 132, 146, 0.3);
              transition: all 0.3s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 15px rgba(215, 132, 146, 0.4);
            }
            .info-box { 
              background: linear-gradient(to right, #F5F9F6, white);
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 5px solid #9CC3A6;
              box-shadow: 0 2px 8px rgba(156, 195, 166, 0.15);
            }
            .info-box strong {
              color: #547552;
            }
            .highlight { 
              color: #D78492; 
              font-weight: 600;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 15px;
              background-color: #9CC3A6;
              color: white;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 500;
              margin: 10px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              border-radius: 8px;
              overflow: hidden;
            }
            th, td { 
              padding: 12px 15px; 
              text-align: left; 
              border-bottom: 1px solid #FADEDD;
            }
            th { 
              background-color: #547552;
              color: white;
              font-weight: 500;
              font-size: 14px;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:hover {
              background-color: #F5F9F6;
            }
            .divider {
              height: 2px;
              background: linear-gradient(to right, transparent, #9CC3A6, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 Carteras Personalizadas</h1>
              <p>Diseños únicos, hechos a mano con amor</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p><strong>Carteras Personalizadas</strong></p>
              <p>📧 carterasdatsudara@gmail.com | 📱 WhatsApp</p>
              <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Public wrapper to render the standard email template
  public renderTemplate(content: string): string {
    return this.getEmailTemplate(content);
  }

  async sendWelcomeEmail(to: string, nombre: string): Promise<void> {
    const content = `
      <h2>¡Bienvenido/a ${nombre}! 🎉</h2>
      <p>Gracias por registrarte en <span class="highlight">Carteras Personalizadas</span>.</p>
      <p>Ahora podés:</p>
      <ul>
        <li>✨ Personalizar tus propios diseños</li>
        <li>🛍️ Comprar productos únicos</li>
        <li>📦 Hacer seguimiento de tus pedidos</li>
      </ul>

      <div class="info-box">
        <p><strong>💬 Chat personalizado:</strong> Tenés un chat integrado en tu panel donde podés comunicarte con nosotros y con el administrador para consultar o enviar detalles sobre tu pedido.</p>
        <p><strong>🔔 Actualizaciones de estado:</strong> Recibirás notificaciones por email cuando el estado de tu pedido cambie (por ejemplo: en producción, enviado, entregado).</p>
      </div>

      <div class="info-box">
        <p><strong>💡 Tip:</strong> Usá el chat para adjuntar imágenes o aclarar detalles del diseño y así agilizar el proceso.</p>
      </div>
    `;

    await this.sendEmail({
      to: [to, 'mariapazruiz6@gmail.com'],
      subject: '¡Bienvenido/a a Carteras Personalizadas! 🎨',
      html: this.getEmailTemplate(content),
    });
  }

  async sendOrderConfirmation(
    to: string,
    nombre: string,
    ordenId: string,
    total: number,
    items: any[],
  ): Promise<void> {
    const itemsHtml = items
      .map((item) => {
        const price = Number(item.precio ?? item.unit_price ?? 0) || 0;
        const qty = Number(item.cantidad ?? item.quantity ?? 1) || 1;
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${item.nombre ?? item.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right;">$${price.toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');

    const content = `
      <h2>¡Pedido Confirmado! 🎉</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pedido ha sido confirmado y está siendo procesado.</p>
      
      <div class="info-box">
        <p><strong>Número de Orden:</strong> <span class="highlight">#${ordenId.slice(0, 8).toUpperCase()}</span></p>
        <p><strong>Total:</strong> <span class="highlight">$${(Number(total) || 0).toFixed(2)}</span></p>
      </div>

      <h3>Detalles del Pedido:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left;">Producto</th>
            <th style="padding: 10px; text-align: center;">Cantidad</th>
            <th style="padding: 10px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p>Te notificaremos cuando tu pedido sea enviado.</p>
    `;

    await this.sendEmail({
      to: [to, 'mariapazruiz6@gmail.com'],
      subject: `Pedido Confirmado #${ordenId.slice(0, 8).toUpperCase()} 📦`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendCustomOrderNotification(
    to: string,
    nombre: string,
    pedidoId: string,
    disenoTipo: string,
    telas: string[],
  ): Promise<void> {
    const content = `
      <h2>¡Pedido de Personalización Recibido! 🎨</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Hemos recibido tu pedido de personalización y lo estamos revisando.</p>
      
      <div class="info-box">
        <p><strong>ID del Pedido:</strong> <span class="highlight">#${pedidoId.slice(0, 8).toUpperCase()}</span></p>
        <p><strong>Tipo:</strong> ${disenoTipo}</p>
        <p><strong>Telas seleccionadas:</strong> ${telas.length}</p>
      </div>

      <h3>Próximos Pasos:</h3>
      <ol>
        <li>📋 Revisaremos tu diseño</li>
        <li>✅ Te notificaremos cuando sea aprobado</li>
        <li>🏭 Comenzaremos la producción</li>
        <li>📦 Te enviaremos tu pedido</li>
      </ol>

      <p>Puedes hacer seguimiento de tu pedido desde tu cuenta.</p>
    `;

    await this.sendEmail({
      to: [to, 'mariapazruiz6@gmail.com'],
      subject: `Pedido de Personalización #${pedidoId.slice(0, 8).toUpperCase()} ✨`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendCustomOrderStatusUpdate(
    to: string,
    nombre: string,
    pedidoId: string,
    nuevoEstado: string,
  ): Promise<void> {
    const estadoEmojis: { [key: string]: string } = {
      pendiente: '⏳',
      en_modificacion: '✏️',
      aprobado: '✅',
      esperando_stock: '📦',
      en_produccion: '🏭',
      terminado: '✨',
      enviado: '🚚',
      entregado: '🎉',
      cancelado: '❌',
    };

    const content = `
      <h2>Actualización de tu Pedido ${estadoEmojis[nuevoEstado] || '📋'}</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pedido de personalización ha sido actualizado.</p>
      
      <div class="info-box">
        <p><strong>ID del Pedido:</strong> <span class="highlight">#${pedidoId.slice(0, 8).toUpperCase()}</span></p>
        <p><strong>Nuevo Estado:</strong> <span class="highlight">${nuevoEstado.replace(/_/g, ' ').toUpperCase()}</span></p>
      </div>

      <p>Puedes ver todos los detalles en tu cuenta.</p>
    `;

    await this.sendEmail({
      to: [to, 'mariapazruiz6@gmail.com'],
      subject: `Actualización de Pedido #${pedidoId.slice(0, 8).toUpperCase()} ${estadoEmojis[nuevoEstado]}`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendAdminOrderNotification(
    ordenId: string,
    cliente: string,
    total: number,
    items: any[],
  ): Promise<void> {
    const itemsHtml = items
      .map((item) => {
        const price = Number(item.precio ?? item.unit_price ?? 0) || 0;
        const qty = Number(item.cantidad ?? item.quantity ?? 1) || 1;
        const name = item.nombre ?? item.title ?? '';
        return `<li>${qty}x ${name} - $${price.toFixed(2)}</li>`;
      })
      .join('');

    const content = `
      <h2>Nueva Orden Recibida 🛒</h2>
      <p>Se ha recibido una nueva orden en la tienda.</p>
      
      <div class="info-box">
        <p><strong>Orden ID:</strong> #${ordenId.slice(0, 8).toUpperCase()}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p><strong>Total:</strong> $${(Number(total) || 0).toFixed(2)}</p>
      </div>

      <h3>Productos:</h3>
      <ul>${itemsHtml}</ul>
    `;

    await this.sendEmail({
      to: ['mariapazruiz6@gmail.com'],
      subject: `Nueva Orden #${ordenId.slice(0, 8).toUpperCase()} 🛒`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendAdminCustomOrderNotification(
    pedidoId: string,
    cliente: string,
    email: string,
    disenoTipo: string,
  ): Promise<void> {
    const content = `
      <h2>Nuevo Pedido de Personalización 🎨</h2>
      <p>Se ha recibido un nuevo pedido de personalización.</p>
      
      <div class="info-box">
        <p><strong>Pedido ID:</strong> #${pedidoId.slice(0, 8).toUpperCase()}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Tipo:</strong> ${disenoTipo}</p>
      </div>

      <p>Revisa el panel de administración para ver los detalles completos.</p>
    `;

    await this.sendEmail({
      to: ['mariapazruiz6@gmail.com'],
      subject: `Nuevo Pedido Personalizado #${pedidoId.slice(0, 8).toUpperCase()} ✨`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendContactMessage(
    nombre: string,
    email: string,
    mensaje: string,
  ): Promise<void> {
    const content = `
      <h2>Nuevo Mensaje de Contacto 💬</h2>
      
      <div class="info-box">
        <p><strong>De:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
      </div>

      <h3>Mensaje:</h3>
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${mensaje}
      </p>
    `;

    await this.sendEmail({
      to: ['mariapazruiz6@gmail.com'],
      subject: `Nuevo Mensaje de ${nombre} 💬`,
      html: this.getEmailTemplate(content),
    });
  }

  async sendEmail(options: {
    to: string[];
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporterReady;
      
      if (!this.transporter) {
        console.warn('⚠️ Email service not available, skipping email:', options.subject);
        return;
      }
      
      await this.transporter.sendMail({
        from: `"Carteras Personalizadas" <${this.configService.get('SMTP_USER')}>`,
        to: options.to.join(', '),
        subject: options.subject,
        html: options.html,
      });
      console.log(`✅ Email enviado: ${options.subject}`);
    } catch (error) {
      console.error('❌ Error enviando email:', error.message);
    }
  }
}
