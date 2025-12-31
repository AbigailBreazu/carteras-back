import { PartialType } from '@nestjs/mapped-types';
import { CreateCarruselDto } from './create-carrusel.dto';

export class UpdateCarruselDto extends PartialType(CreateCarruselDto) {}
