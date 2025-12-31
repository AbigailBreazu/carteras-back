import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      const adminEmail = 'abiiibreazuuu@gmail.com';
      
      // Verificar si el admin ya existe
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('✅ Usuario admin ya existe');
        return;
      }

      // Crear el usuario admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = this.userRepository.create({
        nombre: 'Administrador',
        email: adminEmail,
        telefono: '1234567890',
        password_hash: hashedPassword,
        rol: UserRole.ADMIN,
      });

      await this.userRepository.save(admin);

      this.logger.log('✅ Usuario admin creado exitosamente');
      this.logger.log(`   📧 Email: ${admin.email}`);
      this.logger.log(`   🔑 Contraseña: admin123`);
      this.logger.log(`   👤 Rol: ${admin.rol}`);
    } catch (error) {
      this.logger.error('❌ Error al crear el usuario admin:', error.message);
    }
  }
}
