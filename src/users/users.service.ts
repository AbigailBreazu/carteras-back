import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Direccion } from './entities/direccion.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateDireccionDto } from './dto/create-direccion.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Direccion)
    private direccionRepository: Repository<Direccion>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, role?: UserRole) {
    const skip = (page - 1) * limit;
    const where = role ? { rol: role } : {};

    const [users, total] = await this.userRepository.findAndCount({
      where,
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'created_at'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.nombre,
        email: user.email,
        role: user.rol,
        createdAt: user.created_at,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.rol = updateRoleDto.role;
    await this.userRepository.save(user);

    return {
      message: 'Rol actualizado correctamente',
      user: {
        id: user.id,
        role: user.rol,
      },
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createAdmin(adminData: Partial<User>): Promise<User> {
    const admin = this.userRepository.create(adminData);
    return this.userRepository.save(admin);
  }

  async findOneById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'profileImage', 'created_at', 'updated_at']
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol,
      profileImage: user.profileImage,
    };
  }

  async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.profileImage = imageUrl;
    await this.userRepository.save(user);
  }

  async updateResetPasswordToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(userId, {
      password_hash: passwordHash,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
  }

  // ========== DIRECCIONES ==========

  async findAllDirecciones(usuarioId: string): Promise<Direccion[]> {
    return this.direccionRepository.find({
      where: { usuarioId },
      order: { esPrincipal: 'DESC', createdAt: 'DESC' },
    });
  }

  async createDireccion(usuarioId: string, createDireccionDto: CreateDireccionDto): Promise<Direccion> {
    // Si es principal, desmarcar las demás
    if (createDireccionDto.esPrincipal) {
      await this.direccionRepository.update(
        { usuarioId },
        { esPrincipal: false }
      );
    }

    const direccion = this.direccionRepository.create({
      ...createDireccionDto,
      usuarioId,
    });

    return this.direccionRepository.save(direccion);
  }

  async updateDireccion(
    id: string,
    usuarioId: string,
    updateData: Partial<CreateDireccionDto>
  ): Promise<Direccion> {
    const direccion = await this.direccionRepository.findOne({
      where: { id, usuarioId },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }

    // Si se marca como principal, desmarcar las demás
    if (updateData.esPrincipal) {
      await this.direccionRepository.update(
        { usuarioId },
        { esPrincipal: false }
      );
    }

    Object.assign(direccion, updateData);
    return this.direccionRepository.save(direccion);
  }

  async deleteDireccion(id: string, usuarioId: string): Promise<void> {
    const direccion = await this.direccionRepository.findOne({
      where: { id, usuarioId },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }

    const eraPrincipal = direccion.esPrincipal;
    await this.direccionRepository.remove(direccion);

    // Si era la principal, marcar otra como principal
    if (eraPrincipal) {
      const otraDireccion = await this.direccionRepository.findOne({
        where: { usuarioId },
        order: { createdAt: 'DESC' },
      });

      if (otraDireccion) {
        otraDireccion.esPrincipal = true;
        await this.direccionRepository.save(otraDireccion);
      }
    }
  }

  async setDireccionPrincipal(id: string, usuarioId: string): Promise<void> {
    const direccion = await this.direccionRepository.findOne({
      where: { id, usuarioId },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }

    // Desmarcar todas como principal
    await this.direccionRepository.update(
      { usuarioId },
      { esPrincipal: false }
    );

    // Marcar esta como principal
    direccion.esPrincipal = true;
    await this.direccionRepository.save(direccion);
  }

  async findDireccionPrincipal(usuarioId: string): Promise<Direccion | null> {
    return this.direccionRepository.findOne({
      where: { usuarioId, esPrincipal: true },
    });
  }
}
