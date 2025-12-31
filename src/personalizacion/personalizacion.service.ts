import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial } from 'typeorm';
import { DisenoBase } from './entities/diseno-base.entity';
import { Tela, CategoriaTela } from './entities/tela.entity';
import {
  PedidoPersonalizacion,
  EstadoPedido,
} from './entities/pedido-personalizacion.entity';
import { SolicitudModificacion, EstadoSolicitud } from './entities/solicitud-modificacion.entity';
import { User } from '../users/entities/user.entity';
import { Direccion } from '../users/entities/direccion.entity';
import { CreateDisenoBaseDto } from './dto/create-diseno-base.dto';
import { CreateTelaDto } from './dto/create-tela.dto';
import { CreatePedidoPersonalizacionDto } from './dto/create-pedido-personalizacion.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class PersonalizacionService {
  constructor(
    @InjectRepository(DisenoBase)
    private disenoBaseRepository: Repository<DisenoBase>,
    @InjectRepository(Tela)
    private telaRepository: Repository<Tela>,
    @InjectRepository(PedidoPersonalizacion)
    private pedidoRepository: Repository<PedidoPersonalizacion>,
    @InjectRepository(SolicitudModificacion)
    private solicitudRepository: Repository<SolicitudModificacion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Direccion)
    private direccionRepository: Repository<Direccion>,
    private emailService: EmailService,
  ) {}

  // ========== DISEÑOS BASE ==========
  async createDisenoBase(
    createDisenoBaseDto: CreateDisenoBaseDto,
    imagenes: string[],
  ): Promise<DisenoBase> {
    if (!imagenes || imagenes.length < 1) {
      throw new BadRequestException('Debes subir al menos 1 imagen');
    }

    const diseno = this.disenoBaseRepository.create({
      nombre: createDisenoBaseDto.nombre,
      imagenes: imagenes,
      imagenPrincipal: imagenes[0], // La primera es la principal
    });

    return await this.disenoBaseRepository.save(diseno);
  }

  async findAllDisenosBase(): Promise<DisenoBase[]> {
    return await this.disenoBaseRepository.find({
      where: { activo: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOneDisenoBase(id: string): Promise<DisenoBase> {
    const diseno = await this.disenoBaseRepository.findOne({ where: { id } });
    if (!diseno) {
      throw new NotFoundException(`Diseño con ID ${id} no encontrado`);
    }
    return diseno;
  }

  async createDisenoBaseSimple(data: {
    nombre: string;
    tamaño?: string;
    diasEstimadosConfeccion?: number;
    imagenes: string[];
    imagenPrincipal: string;
  }): Promise<DisenoBase> {
    const diseno = this.disenoBaseRepository.create({
      nombre: data.nombre,
      tamaño: data.tamaño,
      diasEstimadosConfeccion: data.diasEstimadosConfeccion,
      imagenes: data.imagenes,
      imagenPrincipal: data.imagenPrincipal,
    });

    return await this.disenoBaseRepository.save(diseno);
  }

  async updateDisenoBase(id: string, updateData: Partial<DisenoBase>): Promise<DisenoBase> {
    const diseno = await this.disenoBaseRepository.findOne({ where: { id } });
    if (!diseno) {
      throw new NotFoundException(`Diseño con ID ${id} no encontrado`);
    }

    Object.assign(diseno, updateData);
    return await this.disenoBaseRepository.save(diseno);
  }

  async deleteDisenoBase(id: string): Promise<void> {
    const diseno = await this.disenoBaseRepository.findOne({ where: { id } });
    if (!diseno) {
      throw new NotFoundException('Diseño no encontrado');
    }

    await this.disenoBaseRepository.remove(diseno);
  }

  // ========== TELAS ==========
  async createTelaSimple(data: {
    nombre: string;
    imagenes: string[];
    imagenPrincipal: string;
    categoria: CategoriaTela;
    especialPara?: string;
    elasticidad: string;
    lavable: string;
  }): Promise<Tela> {
    // Convertir strings a enums si es necesario
    const elasticidadValue = data.elasticidad as any;
    const lavableValue = data.lavable as any;

    const tela = this.telaRepository.create({
      nombre: data.nombre,
      imagenes: data.imagenes,
      imagenPrincipal: data.imagenPrincipal,
      categoria: data.categoria,
      especialPara: data.especialPara,
      elasticidad: elasticidadValue,
      lavable: lavableValue,
    });

    return await this.telaRepository.save(tela);
  }

  async findAllTelas(categoria?: CategoriaTela): Promise<Tela[]> {
    const where: any = { activo: true };
    if (categoria) {
      where.categoria = categoria;
    }

    return await this.telaRepository.find({
      where,
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOneTela(id: string): Promise<Tela> {
    const tela = await this.telaRepository.findOne({ where: { id } });
    if (!tela) {
      throw new NotFoundException(`Tela con ID ${id} no encontrada`);
    }
    return tela;
  }

  async updateTela(id: string, updateData: Partial<Tela>): Promise<Tela> {
    const tela = await this.telaRepository.findOne({ where: { id } });
    if (!tela) {
      throw new NotFoundException(`Tela con ID ${id} no encontrada`);
    }

    Object.assign(tela, updateData);
    return await this.telaRepository.save(tela);
  }

  async deleteTela(id: string): Promise<void> {
    const tela = await this.telaRepository.findOne({ where: { id } });
    if (!tela) {
      throw new NotFoundException('Tela no encontrada');
    }

    await this.telaRepository.remove(tela);
  }

  // ========== PEDIDOS PERSONALIZACIÓN ==========

  // Helper para convertir estado a formato frontend (mayúsculas)
  private convertEstadoToFrontend(estado: EstadoPedido): string {
    const estadoMap: Record<EstadoPedido, string> = {
      [EstadoPedido.PENDIENTE]: 'PENDIENTE',
      [EstadoPedido.EN_MODIFICACION]: 'EN_MODIFICACION',
      [EstadoPedido.APROBADO]: 'APROBADO',
      [EstadoPedido.ESPERANDO_STOCK]: 'ESPERANDO_STOCK',
      [EstadoPedido.EN_PRODUCCION]: 'EN_PRODUCCION',
      [EstadoPedido.TERMINADO]: 'TERMINADO',
      [EstadoPedido.ENVIADO]: 'ENVIADO',
      [EstadoPedido.ENTREGADO]: 'ENTREGADO',
      [EstadoPedido.CANCELADO]: 'CANCELADO',
    };
    return estadoMap[estado] || estado;
  }

  async findAllPedidosSimple(userEmail?: string): Promise<any[]> {
    const where: any = {};
    if (userEmail) {
      const usuario = await this.userRepository.findOne({ where: { email: userEmail } });
      if (!usuario) {
        return [];
      }
      where.usuarioId = usuario.id;
    }

    const pedidos = await this.pedidoRepository.find({
      where,
      relations: ['usuario', 'disenoBase'],
      order: { fechaCreacion: 'DESC' },
    });

    return pedidos.map((pedido) => ({
      id: pedido.id,
      userEmail: pedido.usuario.email,
      userName: pedido.usuario.nombre,
      disenoBase: pedido.disenoBaseId || null,
      disenoPropio: pedido.disenoPropio || null,
      telasSeleccionadas: pedido.telasSeleccionadas,
      comentarios: pedido.comentarios || '',
      estado: this.convertEstadoToFrontend(pedido.estado),
      fechaCreacion: pedido.fechaCreacion.toISOString(),
      fechaActualizacion: pedido.fechaActualizacion.toISOString(),
    }));
  }

  async createPedidoSimple(data: {
    userEmail: string;
    userName: string;
    disenoBase: string | null;
    disenoPropio: string | null;
    telasSeleccionadas: string[];
    comentarios: string;
    estado: string;
  }): Promise<any> {
    // Buscar o crear usuario
    let usuario = await this.userRepository.findOne({ where: { email: data.userEmail } });
    if (!usuario) {
      const newUser = new User();
      newUser.email = data.userEmail;
      newUser.nombre = data.userName;
      newUser.password_hash = 'temporal'; // Debe ser actualizado después
      usuario = newUser;
      await this.userRepository.save(usuario);
    }

    const pedido = this.pedidoRepository.create({
      usuarioId: usuario.id,
      disenoBaseId: data.disenoBase || undefined,
      disenoPropio: data.disenoPropio || undefined,
      telasSeleccionadas: data.telasSeleccionadas,
      comentarios: data.comentarios,
      estado: EstadoPedido.PENDIENTE, // Usar el enum directamente
    });

    await this.pedidoRepository.save(pedido);

    // Recargar con relaciones
    const pedidoCompleto = await this.pedidoRepository.findOne({
      where: { id: pedido.id },
      relations: ['usuario'],
    });

    if (!pedidoCompleto) {
      throw new NotFoundException('Pedido no encontrado después de crear');
    }

    return {
      id: pedidoCompleto.id,
      userEmail: pedidoCompleto.usuario.email,
      userName: pedidoCompleto.usuario.nombre,
      disenoBase: pedidoCompleto.disenoBaseId || null,
      disenoPropio: pedidoCompleto.disenoPropio || null,
      telasSeleccionadas: pedidoCompleto.telasSeleccionadas,
      comentarios: pedidoCompleto.comentarios || '',
      estado: this.convertEstadoToFrontend(pedidoCompleto.estado),
      fechaCreacion: pedidoCompleto.fechaCreacion.toISOString(),
      fechaActualizacion: pedidoCompleto.fechaActualizacion.toISOString(),
    };
  }

  async createPedido(
    userId: string,
    createPedidoDto: CreatePedidoPersonalizacionDto,
    disenoPropio?: string,
  ): Promise<PedidoPersonalizacion> {
    // Validar que tiene diseño base O diseño propio (no ambos, no ninguno)
    if (!createPedidoDto.disenoBaseId && !disenoPropio) {
      throw new BadRequestException(
        'Debes seleccionar un diseño base o subir tu propio diseño',
      );
    }

    if (createPedidoDto.disenoBaseId && disenoPropio) {
      throw new BadRequestException(
        'Solo puedes seleccionar un diseño base o subir tu propio diseño, no ambos',
      );
    }

    // Validar que hay al menos 1 tela
    if (!createPedidoDto.telasSeleccionadas || createPedidoDto.telasSeleccionadas.length === 0) {
      throw new BadRequestException('Debes seleccionar al menos una tela');
    }

    // Validar que el diseño base existe (si se proporcionó)
    let disenoBaseEncontrado: DisenoBase | undefined = undefined;
    if (createPedidoDto.disenoBaseId) {
      const disenoTemp = await this.disenoBaseRepository.findOne({
        where: { id: createPedidoDto.disenoBaseId },
      });
      if (!disenoTemp) {
        throw new NotFoundException('Diseño base no encontrado');
      }
      disenoBaseEncontrado = disenoTemp;
    }

    // Validar que todas las telas existen
    const telas = await this.telaRepository.findBy({
      id: In(createPedidoDto.telasSeleccionadas),
    });
    if (telas.length !== createPedidoDto.telasSeleccionadas.length) {
      throw new BadRequestException('Una o más telas seleccionadas no existen');
    }

    const pedido = this.pedidoRepository.create({
      usuarioId: userId,
      disenoBaseId: createPedidoDto.disenoBaseId || undefined,
      disenoPropio: disenoPropio || undefined,
      telasSeleccionadas: createPedidoDto.telasSeleccionadas,
      comentarios: createPedidoDto.comentarios || undefined,
      estado: EstadoPedido.PENDIENTE,
      historialEstados: [
        {
          estado: EstadoPedido.PENDIENTE,
          fecha: new Date(),
          actualizadoPor: 'Sistema',
        },
      ],
    });

    const pedidoGuardado = await this.pedidoRepository.save(pedido);

    // Enviar emails de notificación
    try {
      const usuario = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      
      // Determinar tipo de diseño
      const disenoTipo = disenoBaseEncontrado ? disenoBaseEncontrado.nombre : 'Diseño propio';
      
      // Obtener nombres de telas
      const nombresTelas = telas.map(t => t.nombre);

      // Email al cliente
      await this.emailService.sendCustomOrderNotification(
        usuario.email,
        usuario.nombre,
        pedidoGuardado.id,
        disenoTipo,
        nombresTelas,
      );

      // Email al admin
      await this.emailService.sendAdminCustomOrderNotification(
        pedidoGuardado.id,
        usuario.nombre,
        usuario.email,
        disenoTipo,
      );
    } catch (emailError) {
      console.error('Error enviando emails de pedido personalizado:', emailError);
      // No lanzar error - el pedido ya fue creado exitosamente
    }

    return pedidoGuardado;
  }

  async findAllPedidos(
    userId: string,
    isAdmin: boolean,
    estado?: EstadoPedido,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ pedidos: any[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    let where: any = {};
    if (!isAdmin) {
      where.usuarioId = userId;
    }
    if (estado) {
      where.estado = estado;
    }

    const [pedidos, total] = await this.pedidoRepository.findAndCount({
      where,
      relations: ['usuario', 'disenoBase'],
      order: { fechaCreacion: 'DESC' },
      skip,
      take: limit,
    });

    // Obtener las telas de cada pedido
    const pedidosConTelas = await Promise.all(
      pedidos.map(async (pedido) => {
        const telas = await this.telaRepository.findBy({
          id: In(pedido.telasSeleccionadas),
        });

        return {
          id: pedido.id,
          usuarioId: pedido.usuarioId,
          usuarioNombre: pedido.usuario.nombre,
          usuarioEmail: pedido.usuario.email,
          disenoBase: pedido.disenoBase
            ? {
                id: pedido.disenoBase.id,
                nombre: pedido.disenoBase.nombre,
                imagenPrincipal: pedido.disenoBase.imagenPrincipal,
              }
            : null,
          disenoPropio: pedido.disenoPropio,
          telas: telas.map((tela) => ({
            id: tela.id,
            nombre: tela.nombre,
            imagenes: tela.imagenes,
            imagenPrincipal: tela.imagenPrincipal,
            categoria: tela.categoria,
          })),
          comentarios: pedido.comentarios,
          estado: pedido.estado,
          fechaCreacion: pedido.fechaCreacion,
          fechaActualizacion: pedido.fechaActualizacion,
        };
      }),
    );

    return {
      pedidos: pedidosConTelas,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePedido(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<any> {
    console.log(`🔍 Buscando pedido con ID: ${id}`);
    console.log(`👤 Usuario solicitante: ${userId} (Admin: ${isAdmin})`);
    
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['usuario', 'disenoBase'],
    });

    console.log(`📦 Pedido encontrado:`, pedido ? 'Sí' : 'No');

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    console.log(`✅ Pedido pertenece a: ${pedido.usuarioId}`);

    // Validar que el usuario solo puede ver sus propios pedidos (si no es admin)
    if (!isAdmin && pedido.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este pedido');
    }

    // Obtener las telas
    const telas = await this.telaRepository.findBy({
      id: In(pedido.telasSeleccionadas),
    });

    // Si es admin, obtener la dirección principal del usuario
    let direccionPrincipal: any;
    if (isAdmin) {
      const direccion = await this.direccionRepository.findOne({
        where: { usuarioId: pedido.usuarioId, esPrincipal: true },
      });

      direccionPrincipal = direccion ? {
        alias: direccion.alias,
        provincia: direccion.provincia,
        ciudad: direccion.ciudad,
        calle: direccion.calle,
        numero: direccion.numero,
        piso: direccion.piso,
        departamento: direccion.departamento,
        codigoPostal: direccion.codigoPostal,
        referencias: direccion.referencias,
        latitud: direccion.latitud,
        longitud: direccion.longitud,
      } : undefined;
    }

    return {
      id: pedido.id,
      usuarioId: pedido.usuarioId,
      usuario: {
        nombre: pedido.usuario.nombre,
        email: pedido.usuario.email,
        ...(isAdmin && direccionPrincipal ? { direccionPrincipal } : {}),
      },
      disenoBase: pedido.disenoBase
        ? {
            id: pedido.disenoBase.id,
            nombre: pedido.disenoBase.nombre,
            imagenes: pedido.disenoBase.imagenes,
            imagenPrincipal: pedido.disenoBase.imagenPrincipal,
          }
        : null,
      disenoPropio: pedido.disenoPropio,
      telas: telas.map((tela) => ({
        id: tela.id,
        nombre: tela.nombre,
        imagenes: tela.imagenes,
        imagenPrincipal: tela.imagenPrincipal,
        categoria: tela.categoria,
        elasticidad: tela.elasticidad,
        lavable: tela.lavable,
      })),
      comentarios: pedido.comentarios,
      estado: pedido.estado,
      historialEstados: pedido.historialEstados,
      fechaCreacion: pedido.fechaCreacion,
      fechaActualizacion: pedido.fechaActualizacion,
    };
  }

  async updateEstadoPedido(
    id: string,
    updateEstadoDto: UpdateEstadoPedidoDto,
    adminEmail: string,
  ): Promise<PedidoPersonalizacion> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Actualizar estado
    pedido.estado = updateEstadoDto.estado;

    // Agregar al historial
    const historial = pedido.historialEstados || [];
    historial.push({
      estado: updateEstadoDto.estado,
      fecha: new Date(),
      actualizadoPor: adminEmail,
    });
    pedido.historialEstados = historial;

    const pedidoActualizado = await this.pedidoRepository.save(pedido);

    // Enviar email de notificación al cliente
    try {
      const usuario = await this.userRepository.findOne({
        where: { id: pedido.usuarioId },
      });
      
      if (usuario) {
        await this.emailService.sendCustomOrderStatusUpdate(
          usuario.email,
          usuario.nombre,
          pedido.id,
          updateEstadoDto.estado,
        );
      }
    } catch (emailError) {
      console.error('Error enviando email de actualización de estado:', emailError);
      // No lanzar error - el pedido ya fue actualizado exitosamente
    }

    return pedidoActualizado;
  }

  // ========== SOLICITUDES DE MODIFICACIÓN ==========

  async solicitarModificacion(pedidoId: string, usuarioId: string, motivo: string): Promise<any> {
    const pedido = await this.pedidoRepository.findOne({ 
      where: { id: pedidoId },
      relations: ['usuario']
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para solicitar modificaciones en este pedido');
    }

    // Verificar si hay una solicitud pendiente
    const solicitudPendiente = await this.solicitudRepository.findOne({
      where: { pedidoId, estado: EstadoSolicitud.PENDIENTE }
    });

    if (solicitudPendiente) {
      throw new BadRequestException('Ya existe una solicitud de modificación pendiente para este pedido');
    }

    const solicitud = this.solicitudRepository.create({
      pedidoId,
      usuarioId,
      motivo,
      estado: EstadoSolicitud.PENDIENTE,
    });

    await this.solicitudRepository.save(solicitud);

    return {
      id: solicitud.id,
      pedidoId: solicitud.pedidoId,
      usuarioId: solicitud.usuarioId,
      motivo: solicitud.motivo,
      estado: solicitud.estado,
      fechaSolicitud: solicitud.fechaSolicitud.toISOString(),
    };
  }

  async puedeEditar(pedidoId: string, usuarioId: string): Promise<any> {
    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId } });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para ver este pedido');
    }

    const solicitudPendiente = await this.solicitudRepository.findOne({
      where: { pedidoId, estado: EstadoSolicitud.PENDIENTE }
    });

    // Estados editables: PENDIENTE y EN_MODIFICACION
    const estadosEditables = [EstadoPedido.PENDIENTE, EstadoPedido.EN_MODIFICACION];
    const puedeEditar = estadosEditables.includes(pedido.estado) && pedido.modificacionesRestantes > 0;
    
    let motivo: string | undefined;
    if (!puedeEditar && !solicitudPendiente) {
      if (pedido.estado === EstadoPedido.EN_PRODUCCION) {
        motivo = 'El pedido ya está en producción';
      } else if (pedido.estado === EstadoPedido.TERMINADO) {
        motivo = 'El pedido ya está terminado';
      } else if (pedido.estado === EstadoPedido.CANCELADO) {
        motivo = 'El pedido está cancelado';
      } else if (pedido.modificacionesRestantes === 0) {
        motivo = 'Has agotado tus modificaciones permitidas';
      }
    }

    return {
      puedeEditar,
      ...(motivo && { motivo }),
      solicitudPendiente: !!solicitudPendiente,
      modificacionesRestantes: puedeEditar ? pedido.modificacionesRestantes : null,
    };
  }

  async gestionarSolicitud(
    pedidoId: string,
    solicitudId: string,
    accion: 'aprobar' | 'rechazar',
    adminId: string,
    mensaje?: string,
  ): Promise<any> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId, pedidoId },
      relations: ['pedido', 'usuario']
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId } });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (accion === 'aprobar') {
      solicitud.estado = EstadoSolicitud.APROBADA;
      pedido.estado = EstadoPedido.EN_MODIFICACION;
    } else {
      solicitud.estado = EstadoSolicitud.RECHAZADA;
    }

    solicitud.adminId = adminId;
    if (mensaje) {
      solicitud.mensajeAdmin = mensaje;
    }

    await this.solicitudRepository.save(solicitud);
    await this.pedidoRepository.save(pedido);

    const mensajeRespuesta = accion === 'aprobar' 
      ? 'Solicitud aprobada exitosamente' 
      : 'Solicitud rechazada';

    return {
      estado: solicitud.estado,
      cantidadModificacionesRestantes: pedido.modificacionesRestantes,
      mensaje: mensajeRespuesta,
    };
  }

  async listarSolicitudes(estadoFiltro?: string): Promise<any[]> {
    const where: any = {};
    if (estadoFiltro) {
      where.estado = estadoFiltro;
    }

    const solicitudes = await this.solicitudRepository.find({
      where,
      relations: ['pedido', 'usuario', 'admin'],
      order: { fechaSolicitud: 'DESC' }
    });

    return solicitudes.map(s => ({
      id: s.id,
      pedidoId: s.pedidoId,
      usuarioId: s.usuarioId,
      usuarioNombre: s.usuario.nombre,
      usuarioEmail: s.usuario.email,
      motivo: s.motivo,
      estado: s.estado,
      fechaSolicitud: s.fechaSolicitud.toISOString(),
      fechaRespuesta: s.fechaRespuesta?.toISOString() || null,
      mensajeAdmin: s.mensajeAdmin || null,
    }));
  }

  async actualizarPedidoConAutorizacion(
    pedidoId: string,
    usuarioId: string,
    updateData: any
  ): Promise<any> {
    // Validar que updateData existe
    if (!updateData || typeof updateData !== 'object') {
      throw new BadRequestException('Datos de actualización inválidos o vacíos');
    }

    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId } });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para modificar este pedido');
    }

    // Verificar estados permitidos para edición
    const estadosEditables = [EstadoPedido.PENDIENTE, EstadoPedido.EN_MODIFICACION];
    if (!estadosEditables.includes(pedido.estado)) {
      throw new BadRequestException('Este pedido no puede ser modificado en su estado actual');
    }

    if (pedido.modificacionesRestantes <= 0) {
      throw new BadRequestException('Has agotado tus modificaciones permitidas');
    }

    // Actualizar campos (soporta tanto disenoBase como disenoBaseId)
    const disenoBaseId = updateData.disenoBaseId || updateData.disenoBase;
    if (disenoBaseId !== undefined) pedido.disenoBaseId = disenoBaseId;
    if (updateData.disenoPropio !== undefined) pedido.disenoPropio = updateData.disenoPropio;
    if (updateData.telasSeleccionadas !== undefined) pedido.telasSeleccionadas = updateData.telasSeleccionadas;
    if (updateData.comentarios !== undefined) pedido.comentarios = updateData.comentarios;

    // Cambiar a estado EN_MODIFICACION si estaba en PENDIENTE
    if (pedido.estado === EstadoPedido.PENDIENTE) {
      pedido.estado = EstadoPedido.EN_MODIFICACION;
    }

    // Decrementar modificaciones restantes
    pedido.modificacionesRestantes -= 1;

    // Si ya no hay más modificaciones, cambiar estado a PENDIENTE
    if (pedido.modificacionesRestantes === 0) {
      pedido.estado = EstadoPedido.PENDIENTE;
    }

    await this.pedidoRepository.save(pedido);

    // Recargar con relaciones
    const pedidoActualizado = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: ['usuario', 'disenoBase']
    });

    if (!pedidoActualizado) {
      throw new NotFoundException('Pedido no encontrado después de actualizar');
    }

    return {
      success: true,
      modificacionesRestantes: pedidoActualizado.modificacionesRestantes,
      pedido: {
        id: pedidoActualizado.id,
        estado: this.convertEstadoToFrontend(pedidoActualizado.estado),
        disenoBaseId: pedidoActualizado.disenoBaseId,
        disenoPropio: pedidoActualizado.disenoPropio,
        telasSeleccionadas: pedidoActualizado.telasSeleccionadas,
        comentarios: pedidoActualizado.comentarios,
        modificacionesRestantes: pedidoActualizado.modificacionesRestantes,
      },
    };
  }

  async deletePedido(pedidoId: string, usuarioId: string, isAdmin: boolean): Promise<void> {
    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId } });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos: solo el dueño del pedido o un admin pueden eliminarlo
    if (!isAdmin && pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para eliminar este pedido');
    }

    // Eliminar el pedido de la base de datos
    await this.pedidoRepository.remove(pedido);
  }
}
