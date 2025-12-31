import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // Crear carpeta uploads si no existe
    const uploadsFolder = this.configService.get<string>('UPLOADS_FOLDER') || './uploads';
    if (!existsSync(uploadsFolder)) {
      mkdirSync(uploadsFolder, { recursive: true });
    }
  }

  getMulterOptions() {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsFolder = this.configService.get<string>('UPLOADS_FOLDER') || './uploads';
          cb(null, uploadsFolder);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: this.configService.get<number>('MAX_FILE_SIZE') || 5000000, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    };
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
  }
}
