import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DesignsService } from '../designs/designs.service';
import { CreateDesignDto } from '../designs/dto/create-design.dto';

@Controller('canva')
export class CanvaController {
  constructor(private readonly designsService: DesignsService) {}

  @Post('design')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  async uploadDesign(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    // Construir la URL completa de la imagen
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/${file.filename}`;

    const createDesignDto: CreateDesignDto = {
      productModel: body.productModel,
      imageUrl: imageUrl,
      canvaDesignId: body.canvaDesignId,
    };

    return this.designsService.create(createDesignDto, req.user.id);
  }
}
