import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from './entities/user.entity';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { ConfigService } from '@nestjs/config';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(pageNum, limitNum, role);
  }

  @Patch('update-role')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateRole(@Body() body: { userId: string; role: UserRole }) {
    return this.usersService.updateRole(body.userId, { role: body.role });
  }
}

// Nuevo controlador para endpoints públicos de usuarios
@Controller('api/users')
export class UsersPublicController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@GetUser() user: any) {
    return this.usersService.findOneById(user.id);
  }

  @Put('profile/image')
  @Patch('profile/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueName = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5000000 }, // 5MB
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    const baseUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/profiles/${file.filename}`;

    await this.usersService.updateProfileImage(user.id, imageUrl);

    return {
      success: true,
      profileImage: imageUrl,
      message: 'Imagen de perfil actualizada exitosamente',
    };
  }

  // ========== DIRECCIONES ==========

  @Get('direcciones')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getDirecciones(@GetUser() user: any) {
    return this.usersService.findAllDirecciones(user.id);
  }

  @Post('direcciones')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createDireccion(
    @Body() createDireccionDto: CreateDireccionDto,
    @GetUser() user: any,
  ) {
    return this.usersService.createDireccion(user.id, createDireccionDto);
  }

  @Put('direcciones/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateDireccion(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateDireccionDto>,
    @GetUser() user: any,
  ) {
    return this.usersService.updateDireccion(id, user.id, updateData);
  }

  @Delete('direcciones/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDireccion(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    await this.usersService.deleteDireccion(id, user.id);
    return {
      message: 'Dirección eliminada',
    };
  }

  @Patch('direcciones/:id/principal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setDireccionPrincipal(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    await this.usersService.setDireccionPrincipal(id, user.id);
    return {
      message: 'Dirección principal actualizada',
    };
  }
}
