import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensajePedido } from './entities/mensaje-pedido.entity';
import { MensajeGeneral } from './entities/mensaje-general.entity';
import { PedidoPersonalizacion } from '../personalizacion/entities/pedido-personalizacion.entity';
import { User } from '../users/entities/user.entity';
import { CreateMensajePedidoDto } from './dto/create-mensaje-pedido.dto';
import { CreateMensajeGeneralDto } from './dto/create-mensaje-general.dto';
import { ResponderMensajeDto } from './dto/responder-mensaje.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class MensajesService {
  constructor(
    @InjectRepository(MensajePedido)
    private mensajePedidoRepository: Repository<MensajePedido>,
    @InjectRepository(MensajeGeneral)
    private mensajeGeneralRepository: Repository<MensajeGeneral>,
    @InjectRepository(PedidoPersonalizacion)
    private pedidoRepository: Repository<PedidoPersonalizacion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // ========== MENSAJES DE PEDIDOS ==========

  async getMensajesPedido(
    pedidoId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<MensajePedido[]> {
    // Verificar que el pedido existe
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar autorización: cliente solo ve sus pedidos
    if (!isAdmin && pedido.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este pedido');
    }

    // Obtener todos los mensajes del pedido ordenados por fecha
    const mensajes = await this.mensajePedidoRepository.find({
      where: { pedidoId },
      order: { fecha: 'ASC' },
    });

    return mensajes;
  }

  async createMensajePedido(
    createMensajeDto: CreateMensajePedidoDto,
    userId: string,
    userEmail: string,
    userName: string,
    isAdmin: boolean,
  ): Promise<MensajePedido> {
    // Verificar que el pedido existe
    const pedido = await this.pedidoRepository.findOne({
      where: { id: createMensajeDto.pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar autorización: cliente solo puede enviar en sus pedidos
    if (!isAdmin && pedido.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para enviar mensajes en este pedido');
    }

    // Crear el mensaje
    const mensaje = this.mensajePedidoRepository.create({
      pedidoId: createMensajeDto.pedidoId,
      emisor: isAdmin ? 'admin' : 'cliente',
      emisorEmail: userEmail,
      emisorNombre: isAdmin ? 'Administrador' : userName,
      mensaje: createMensajeDto.mensaje,
      leido: false,
      leidoPor: [],
    });

    let mensajeGuardado: any = await this.mensajePedidoRepository.save(mensaje);

    // Forzar estado seguro: siempre guardar como no leído y leidoPor vacío
    await this.mensajePedidoRepository.update(mensajeGuardado.id, {
      leido: false,
      leidoPor: [],
    });
    mensajeGuardado = await this.mensajePedidoRepository.findOne({ where: { id: mensajeGuardado.id } });

    // Debug: log completo del mensaje guardado (forzado no leído)
    console.log('MensajesService.createMensajePedido saved:', JSON.stringify(mensajeGuardado, null, 2));

    // Enviar email de notificación
    try {
      if (isAdmin) {
        // Admin respondió → notificar al cliente
        const content = `
            <h2>Nuevo mensaje del administrador</h2>
            <p>Hola ${pedido.usuario.nombre},</p>
            <p>Recibiste un nuevo mensaje sobre tu pedido personalizado:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>${mensaje.mensaje}</strong></p>
            </div>
            <p>Puedes responder desde tu panel de pedidos.</p>
        `;

        await this.emailService.sendEmail({
          to: [pedido.usuario.email, 'mariapazruiz6@gmail.com'],
          subject: `Nuevo mensaje en tu pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      } else {
        // Cliente escribió → notificar al admin
        const content = `
            <h2>Nuevo mensaje de cliente</h2>
            <p><strong>Pedido:</strong> #${pedido.id.substring(0, 8)}</p>
            <p><strong>Cliente:</strong> ${pedido.usuario.nombre} (${pedido.usuario.email})</p>
            <p><strong>Mensaje:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">${mensaje.mensaje}</p>
            </div>
        `;

        await this.emailService.sendEmail({
          to: ['mariapazruiz6@gmail.com'],
          subject: `Nuevo mensaje en pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      }
    } catch (emailError) {
      console.error('Error enviando email de notificación de mensaje:', emailError);
    }

    return mensajeGuardado;
  }

  async createMensajePedidoWithImage(
    pedidoId: string,
    imagenUrl: string,
    mensajeTexto: string,
    userId: string,
    userEmail: string,
    userName: string,
    isAdmin: boolean,
  ): Promise<MensajePedido> {
    // Verificar que el pedido existe
    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId }, relations: ['usuario'] });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar autorización: cliente solo puede enviar en sus pedidos
    if (!isAdmin && pedido.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para enviar mensajes en este pedido');
    }

    const mensaje = this.mensajePedidoRepository.create({
      pedidoId,
      emisor: isAdmin ? 'admin' : 'cliente',
      emisorEmail: userEmail,
      emisorNombre: isAdmin ? 'Administrador' : userName,
      mensaje: mensajeTexto || '',
      imagenUrl,
      leido: false,
      leidoPor: [],
    });

    let mensajeGuardado: any = await this.mensajePedidoRepository.save(mensaje);

    // Forzar estado seguro: siempre guardar como no leído
    await this.mensajePedidoRepository.update(mensajeGuardado.id, { leido: false, leidoPor: [] });
    mensajeGuardado = await this.mensajePedidoRepository.findOne({ where: { id: mensajeGuardado.id } });

    console.log('MensajesService.createMensajePedidoWithImage saved:', JSON.stringify(mensajeGuardado, null, 2));

    // Enviar notificación por email con la imagen incluida
    try {
      if (isAdmin) {
        const content = `
          <h2>Nuevo mensaje del administrador</h2>
          <p>Hola ${pedido.usuario.nombre},</p>
          <p>Recibiste un nuevo mensaje sobre tu pedido personalizado.</p>
          ${mensajeTexto ? `<div class="info-box"><p><strong>${mensajeTexto}</strong></p></div>` : ''}
          <p>Imagen adjunta:</p>
          <div style="text-align:center; margin: 20px 0;"><img src="${imagenUrl}" alt="Imagen" style="max-width:100%; height:auto; border-radius:8px;"/></div>
          <p>Puedes responder desde tu panel de pedidos.</p>
        `;

        await this.emailService.sendEmail({
          to: [pedido.usuario.email, 'mariapazruiz6@gmail.com'],
          subject: `Nueva imagen en tu pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      } else {
        const content = `
          <h2>Nuevo mensaje de cliente</h2>
          <p><strong>Pedido:</strong> #${pedido.id.substring(0, 8)}</p>
          <p><strong>Cliente:</strong> ${pedido.usuario.nombre} (${pedido.usuario.email})</p>
          ${mensajeTexto ? `<div class="info-box"><p><strong>Mensaje:</strong></p><p>${mensajeTexto}</p></div>` : ''}
          <p>Imagen adjunta:</p>
          <div style="text-align:center; margin: 20px 0;"><img src="${imagenUrl}" alt="Imagen" style="max-width:100%; height:auto; border-radius:8px;"/></div>
        `;

        await this.emailService.sendEmail({
          to: ['mariapazruiz6@gmail.com'],
          subject: `Imagen enviada en pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      }
    } catch (emailError) {
      console.error('Error enviando email de notificación (imagen):', emailError);
    }

    return mensajeGuardado;
  }

  async createMensajePedidoInterno(
    createMensajeDto: any,
    adminEmail: string,
    adminName: string,
  ): Promise<MensajePedido> {
    // Verificar que el pedido existe
    const pedido = await this.pedidoRepository.findOne({
      where: { id: createMensajeDto.pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Crear el mensaje
    const mensaje = this.mensajePedidoRepository.create({
      pedidoId: createMensajeDto.pedidoId,
      emisor: 'admin',
      emisorEmail: adminEmail,
      emisorNombre: 'Administrador',
      mensaje: createMensajeDto.mensaje,
      leido: false,
      leidoPor: [],
      cambioEstado: createMensajeDto.cambioEstado || undefined,
    });

    let mensajeGuardado: any = await this.mensajePedidoRepository.save(mensaje);

    // Forzar estado seguro: siempre guardar como no leído y leidoPor vacío
    await this.mensajePedidoRepository.update(mensajeGuardado.id, {
      leido: false,
      leidoPor: [],
    });
    mensajeGuardado = await this.mensajePedidoRepository.findOne({ where: { id: mensajeGuardado.id } });

    // Debug: log completo del mensaje interno guardado (forzado no leído)
    console.log('MensajesService.createMensajePedidoInterno saved:', JSON.stringify(mensajeGuardado, null, 2));

    // Enviar email de notificación al cliente
    try {
      const tipoMensaje = createMensajeDto.cambioEstado 
        ? 'cambio de estado' 
        : 'nuevo mensaje';
      
      const content = `
          <h2>Actualización en tu pedido personalizado</h2>
          <p>Hola ${pedido.usuario.nombre},</p>
          ${createMensajeDto.cambioEstado ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0;"><strong>Cambio de estado:</strong></p>
              <p style="margin: 5px 0;">${createMensajeDto.cambioEstado.estadoAnterior} → ${createMensajeDto.cambioEstado.estadoNuevo}</p>
            </div>
          ` : ''}
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${createMensajeDto.mensaje}</strong></p>
          </div>
          <p>Puedes ver más detalles en tu panel de pedidos.</p>
      `;

      await this.emailService.sendEmail({
        to: [pedido.usuario.email, 'mariapazruiz6@gmail.com'],
        subject: `Actualización en tu pedido #${pedido.id.substring(0, 8)}`,
        html: this.emailService.renderTemplate(content),
      });
    } catch (emailError) {
      console.error('Error enviando email de notificación:', emailError);
    }

    return mensajeGuardado;
  }

  async getPedidosConMensajesNoLeidos(
    adminEmail: string,
  ): Promise<any[]> {
    // Obtener todos los pedidos que tienen mensajes no leídos por el admin
    const mensajesNoLeidos = await this.mensajePedidoRepository
      .createQueryBuilder('mensaje')
      .leftJoinAndSelect('mensaje.pedido', 'pedido')
      .leftJoinAndSelect('pedido.usuario', 'usuario')
      .where('mensaje.emisor = :emisor', { emisor: 'cliente' })
      .andWhere('mensaje.leido = :leido', { leido: false })
      .orderBy('mensaje.fecha', 'DESC')
      .getMany();

    // Agrupar por pedido
    const pedidosMap = new Map<string, any>();

    for (const mensaje of mensajesNoLeidos) {
      const pedidoId = mensaje.pedidoId;
      
      if (!pedidosMap.has(pedidoId)) {
        const pedido = await this.pedidoRepository.findOne({
          where: { id: pedidoId },
          relations: ['usuario'],
        });

        if (pedido) {
          const count = await this.mensajePedidoRepository.count({
            where: {
              pedidoId: pedidoId,
              emisor: 'cliente',
              leido: false,
            },
          });

          pedidosMap.set(pedidoId, {
            pedidoId: pedido.id,
            pedidoNumero: `#${pedido.id.substring(0, 8).toUpperCase()}`,
            clienteEmail: pedido.usuario.email,
            clienteNombre: pedido.usuario.nombre,
            mensajesNoLeidos: count,
            ultimoMensaje: mensaje.mensaje,
            fechaUltimoMensaje: mensaje.fecha,
          });
        }
      }
    }

    return Array.from(pedidosMap.values());
  }

  async marcarMensajesPedidoComoLeidos(
    pedidoId: string,
    userId: string,
    userEmail: string,
    isAdmin: boolean,
  ): Promise<{ success: boolean; mensajesMarcados: number }> {
    // Verificar que el pedido existe
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar autorización
    if (!isAdmin && pedido.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a este pedido');
    }

    // Obtener mensajes no leídos del emisor opuesto
    const emisorBuscado = isAdmin ? 'cliente' : 'admin';
    
    const mensajesNoLeidos = await this.mensajePedidoRepository.find({
      where: {
        pedidoId,
        emisor: emisorBuscado,
        leido: false,
      },
    });

    // Marcar como leídos
    let contador = 0;
    for (const mensaje of mensajesNoLeidos) {
      // Evitar que el propio emisor marque su mensaje como leído
      if (mensaje.emisorEmail === userEmail) {
        continue;
      }
      if (!mensaje.leidoPor.includes(userEmail)) {
        mensaje.leidoPor.push(userEmail);
      }
      mensaje.leido = true;
      await this.mensajePedidoRepository.save(mensaje);
      contador++;
    }

    return {
      success: true,
      mensajesMarcados: contador,
    };
  }

  // ========== MENSAJES GENERALES (CONTACTO) ==========

  async createMensajeGeneral(
    createMensajeDto: CreateMensajeGeneralDto,
  ): Promise<{ success: boolean; id: string; mensaje: string }> {
    // Crear el mensaje
    const mensaje = this.mensajeGeneralRepository.create({
      nombre: createMensajeDto.nombre,
      email: createMensajeDto.email,
      telefono: createMensajeDto.telefono,
      asunto: createMensajeDto.asunto,
      mensaje: createMensajeDto.mensaje,
      leido: false,
      leidoPor: [],
      respondido: false,
    });

    let mensajeGuardado: any = await this.mensajeGeneralRepository.save(mensaje);

    // Forzar estado seguro: siempre guardar como no leído y leidoPor vacío
    await this.mensajeGeneralRepository.update(mensajeGuardado.id, {
      leido: false,
      leidoPor: [],
    });
    mensajeGuardado = await this.mensajeGeneralRepository.findOne({ where: { id: mensajeGuardado.id } });

    // Debug: log completo del mensaje general guardado (forzado no leído)
    console.log('MensajesService.createMensajeGeneral saved:', JSON.stringify(mensajeGuardado, null, 2));

    // Enviar email al admin
    try {
      const content = `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>De:</strong> ${createMensajeDto.nombre}</p>
        <p><strong>Email:</strong> ${createMensajeDto.email}</p>
        ${createMensajeDto.telefono ? `<p><strong>Teléfono:</strong> ${createMensajeDto.telefono}</p>` : ''}
        <p><strong>Asunto:</strong> ${createMensajeDto.asunto}</p>
        <p><strong>Mensaje:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">${createMensajeDto.mensaje}</p>
        </div>
      `;

      await this.emailService.sendEmail({
        to: ['mariapazruiz6@gmail.com'],
        subject: `Nuevo mensaje de contacto: ${createMensajeDto.asunto}`,
        html: this.emailService.renderTemplate(content),
      });
    } catch (emailError) {
      console.error('Error enviando email de mensaje de contacto:', emailError);
    }

    return {
      success: true,
      id: mensajeGuardado.id,
      mensaje: 'Tu mensaje ha sido enviado. Te responderemos pronto a tu email.',
    };
  }

  async getMensajesGenerales(
    leido?: boolean,
    limite: number = 50,
    pagina: number = 1,
  ): Promise<{
    mensajes: MensajeGeneral[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const skip = (pagina - 1) * limite;

    const whereClause: any = {};
    if (leido !== undefined) {
      whereClause.leido = leido;
    }

    const [mensajes, total] = await this.mensajeGeneralRepository.findAndCount({
      where: whereClause,
      order: { fecha: 'DESC' },
      skip,
      take: limite,
    });

    return {
      mensajes,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  async getMensajeGeneral(id: string): Promise<MensajeGeneral> {
    const mensaje = await this.mensajeGeneralRepository.findOne({
      where: { id },
    });

    if (!mensaje) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return mensaje;
  }

  async marcarMensajeGeneralComoLeido(
    id: string,
    adminEmail: string,
  ): Promise<{ success: boolean }> {
    const mensaje = await this.mensajeGeneralRepository.findOne({
      where: { id },
    });

    if (!mensaje) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    // Protección: si el que intenta marcar es el mismo que envió el mensaje, no marcarlo
    if (mensaje.email === adminEmail) {
      return { success: true };
    }

    if (!mensaje.leidoPor.includes(adminEmail)) {
      mensaje.leidoPor.push(adminEmail);
    }
    mensaje.leido = true;

    await this.mensajeGeneralRepository.save(mensaje);

    return { success: true };
  }

  async responderMensajeGeneral(
    id: string,
    responderDto: ResponderMensajeDto,
  ): Promise<{ success: boolean; mensaje: string }> {
    const mensaje = await this.mensajeGeneralRepository.findOne({
      where: { id },
    });

    if (!mensaje) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    // Actualizar el mensaje
    mensaje.respondido = true;
    mensaje.respuesta = responderDto.respuesta;
    mensaje.fechaRespuesta = new Date();

    await this.mensajeGeneralRepository.save(mensaje);

    // Enviar email al cliente con la respuesta
    try {
      const content = `
        <h2>Respuesta a tu consulta</h2>
        <p>Hola ${mensaje.nombre},</p>
        <p>Gracias por contactarnos. Aquí está nuestra respuesta:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">${responderDto.respuesta}</p>
        </div>
        <p>Si tienes más preguntas, no dudes en contactarnos nuevamente.</p>
        <p>Saludos,<br>El equipo de Datsusara</p>
      `;

      await this.emailService.sendEmail({
        to: [mensaje.email, 'mariapazruiz6@gmail.com'],
        subject: `Re: ${mensaje.asunto}`,
        html: this.emailService.renderTemplate(content),
      });
    } catch (emailError) {
      console.error('Error enviando respuesta por email:', emailError);
    }

    return {
      success: true,
      mensaje: 'Respuesta registrada y enviada por email',
    };
  }

  // ========== NOTIFICACIONES ==========

  async getNotificaciones(adminEmail: string): Promise<any> {
    // Contar mensajes de pedidos no leídos
    const pedidosNoLeidos = await this.mensajePedidoRepository.count({
      where: {
        emisor: 'cliente',
        leido: false,
      },
    });

    // Contar mensajes de contacto no leídos
    const contactosNoLeidos = await this.mensajeGeneralRepository.count({
      where: {
        leido: false,
      },
    });

    // Obtener pedidos recientes con mensajes
    const pedidosRecientesData = await this.getPedidosConMensajesNoLeidos(adminEmail);
    const pedidosRecientes = pedidosRecientesData.slice(0, 5).map(p => ({
      pedidoId: p.pedidoId,
      pedidoNumero: p.pedidoNumero,
      clienteNombre: p.clienteNombre,
      ultimoMensaje: p.ultimoMensaje,
      fecha: p.fechaUltimoMensaje,
    }));

    return {
      pedidosNoLeidos,
      contactosNoLeidos,
      totalNoLeidos: pedidosNoLeidos + contactosNoLeidos,
      pedidosRecientes,
    };
  }

  // ========== MÉTODOS ADICIONALES PARA API SPEC ==========

  async findAllByPedido(
    pedidoId: string,
    userEmail: string,
    isAdmin: boolean,
  ): Promise<any[]> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (!isAdmin && pedido.usuario.email !== userEmail) {
      throw new ForbiddenException('No autorizado para ver este pedido');
    }

    const mensajes = await this.mensajePedidoRepository.find({
      where: { pedidoId },
      order: { fecha: 'ASC' },
    });

    // Formatear según spec
    return mensajes.map(m => ({
      id: m.id,
      pedidoId: m.pedidoId,
      mensaje: m.mensaje,
      esAdmin: m.emisor === 'admin',
      leido: m.leido,
      cambioEstado: m.cambioEstado || null,
      fecha: m.fecha.toISOString(),
    }));
  }

  async createMensajePedidoSimple(
    data: { pedidoId: string; mensaje: string; esAdmin: boolean; cambioEstado?: any },
    userEmail: string,
    userName: string,
  ): Promise<any> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: data.pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (!data.esAdmin && pedido.usuario.email !== userEmail) {
      throw new ForbiddenException('No autorizado para enviar mensajes en este pedido');
    }

    if (!data.mensaje || data.mensaje.trim() === '') {
      throw new BadRequestException("El campo 'mensaje' es requerido");
    }

    const mensaje = this.mensajePedidoRepository.create({
      pedidoId: data.pedidoId,
      emisor: data.esAdmin ? 'admin' : 'cliente',
      emisorEmail: userEmail,
      emisorNombre: data.esAdmin ? 'Administrador' : userName,
      mensaje: data.mensaje,
      leido: false,
      leidoPor: [],
      cambioEstado: data.cambioEstado || null,
    });

    let mensajeGuardado: any = await this.mensajePedidoRepository.save(mensaje);

    // Forzar estado seguro: siempre guardar como no leído y leidoPor vacío
    await this.mensajePedidoRepository.update(mensajeGuardado.id, {
      leido: false,
      leidoPor: [],
    });
    mensajeGuardado = await this.mensajePedidoRepository.findOne({ where: { id: mensajeGuardado.id } });

    // Debug: log completo del mensaje simple guardado (forzado no leído)
    console.log('MensajesService.createMensajePedidoSimple saved:', JSON.stringify(mensajeGuardado, null, 2));

    // Enviar email de notificación
    try {
      if (data.esAdmin) {
        const content = `
          <h2>Nuevo mensaje del administrador</h2>
          <p>Hola ${pedido.usuario.nombre},</p>
          ${data.cambioEstado ? `
            <div class="info-box" style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0;"><strong>Cambio de estado:</strong></p>
              <p style="margin: 5px 0;">${data.cambioEstado.estadoAnterior} → ${data.cambioEstado.estadoNuevo}</p>
            </div>
          ` : ''}
          <p>Recibiste un nuevo mensaje sobre tu pedido personalizado:</p>
          <div class="info-box">
            <p><strong>${data.mensaje}</strong></p>
          </div>
          <p>Puedes responder desde tu panel de pedidos.</p>
        `;

        await this.emailService.sendEmail({
          to: [pedido.usuario.email, 'carterasdatsudara@gmail.com'],
          subject: `Nuevo mensaje en tu pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      } else {
        const content = `
          <h2>Nuevo mensaje de cliente</h2>
          <p><strong>Pedido:</strong> #${pedido.id.substring(0, 8)}</p>
          <p><strong>Cliente:</strong> ${pedido.usuario.nombre} (${pedido.usuario.email})</p>
          <div class="info-box">
            <p><strong>Mensaje:</strong></p>
            <p>${data.mensaje}</p>
          </div>
        `;

        await this.emailService.sendEmail({
          to: ['carterasdatsudara@gmail.com'],
          subject: `Nuevo mensaje en pedido #${pedido.id.substring(0, 8)}`,
          html: this.emailService.renderTemplate(content),
        });
      }
    } catch (emailError) {
      console.error('Error enviando email de notificación:', emailError);
    }

    // Formatear según spec
    return {
      id: mensajeGuardado.id,
      pedidoId: mensajeGuardado.pedidoId,
      mensaje: mensajeGuardado.mensaje,
      esAdmin: mensajeGuardado.emisor === 'admin',
      leido: mensajeGuardado.leido,
      cambioEstado: mensajeGuardado.cambioEstado || null,
      fecha: mensajeGuardado.fecha.toISOString(),
    };
  }

  async marcarMensajesComoLeidos(
    pedidoId: string,
    esAdmin: boolean,
    userEmail: string,
  ): Promise<number> {
    // Buscar mensajes del "otro rol" que no están leídos
    const mensajes = await this.mensajePedidoRepository.find({
      where: {
        pedidoId,
        emisor: esAdmin ? 'cliente' : 'admin',
        leido: false,
      },
    });
    
    // Marcar todos como leídos, salvo si el propio emisor intenta marcarlos
    let contador = 0;
    for (const mensaje of mensajes) {
      if (mensaje.emisorEmail === userEmail) {
        continue;
      }
      mensaje.leido = true;
      await this.mensajePedidoRepository.save(mensaje);
      contador++;
    }
    
    return contador;
  }

  async getPedidosParaAdminMensajeria(soloNoLeidos: boolean = false) {
    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.usuario', 'usuario');

    const pedidos = await query.getMany();

    const resultado = await Promise.all(
      pedidos.map(async (pedido) => {
        const ultimoMensaje = await this.mensajePedidoRepository.findOne({
          where: { pedidoId: pedido.id },
          order: { fecha: 'DESC' },
        });

        const mensajesNoLeidos = await this.mensajePedidoRepository.count({
          where: {
            pedidoId: pedido.id,
            emisor: 'cliente',
            leido: false,
          },
        });

        // Si filtrar solo no leídos y no tiene mensajes no leídos, saltar
        if (soloNoLeidos && mensajesNoLeidos === 0) {
          return null;
        }

        return {
          id: pedido.id,
          userEmail: pedido.usuario?.email || 'Sin email',
          userName: pedido.usuario?.nombre || 'Sin nombre',
          estado: pedido.estado,
          fechaCreacion: pedido.fechaCreacion.toISOString(),
          fechaActualizacion: pedido.fechaActualizacion.toISOString(),
          mensajesNoLeidos,
          ultimoMensaje: ultimoMensaje
            ? {
                mensaje: ultimoMensaje.mensaje,
                fecha: ultimoMensaje.fecha.toISOString(),
                esAdmin: ultimoMensaje.emisor === 'admin',
              }
            : null,
        };
      })
    );

    // Filtrar nulls y ordenar
    const pedidosFiltrados = resultado.filter(p => p !== null);

    return pedidosFiltrados.sort((a, b) => {
      // Primero con mensajes no leídos
      if (a.mensajesNoLeidos > 0 && b.mensajesNoLeidos === 0) return -1;
      if (a.mensajesNoLeidos === 0 && b.mensajesNoLeidos > 0) return 1;
      
      // Luego por fecha del último mensaje o fecha de actualización
      const fechaA = a.ultimoMensaje?.fecha || a.fechaActualizacion;
      const fechaB = b.ultimoMensaje?.fecha || b.fechaActualizacion;
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
    });
  }
}

