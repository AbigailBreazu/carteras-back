import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    const fileUrl = this.uploadService.getFileUrl(file.filename);

    return {
      message: 'Imagen subida exitosamente',
      filename: file.filename,
      url: fileUrl,
    };
  }

  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    if (files.length > 10) {
      throw new BadRequestException('Solo se permiten máximo 10 imágenes');
    }

    console.log('📦 Archivos recibidos:', files.length);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. Filename: ${file.filename}, Original: ${file.originalname}`);
    });

    const urls = files.map((file) => this.uploadService.getFileUrl(file.filename));

    console.log('✅ URLs generadas:', urls);

    return {
      success: true,
      urls,
      count: urls.length,
    };
  }

  // ========== ENDPOINTS ESPECÍFICOS POR TIPO ==========

  @Post('disenos-base')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/disenos-base',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5000000 },
    }),
  )
  uploadDisenosBase(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    const baseUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const urls = files.map((file) => `${baseUrl}/uploads/disenos-base/${file.filename}`);

    return {
      success: true,
      urls,
      count: urls.length,
    };
  }

  @Post('telas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/telas',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5000000 },
    }),
  )
  uploadTelas(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    const baseUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const urls = files.map((file) => `${baseUrl}/uploads/telas/${file.filename}`);

    return {
      success: true,
      urls,
      count: urls.length,
    };
  }

  @Post('disenos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/disenos',
        filename: (req, file, cb) => {
          const uniqueName = `diseno-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10000000 }, // 10MB para diseños de clientes
    }),
  )
  uploadDisenoPersonalizado(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    const baseUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/disenos/${file.filename}`;

    return {
      success: true,
      url,
      filename: file.filename,
    };
  }
}
