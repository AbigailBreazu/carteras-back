import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrusel } from './entities/carrusel.entity';
import { CreateCarruselDto } from './dto/create-carrusel.dto';
import { UpdateCarruselDto } from './dto/update-carrusel.dto';

@Injectable()
export class CarruselService {
  constructor(
    @InjectRepository(Carrusel)
    private carruselRepository: Repository<Carrusel>,
  ) {}

  async create(createCarruselDto: CreateCarruselDto): Promise<Carrusel> {
    const carrusel = this.carruselRepository.create(createCarruselDto);
    return await this.carruselRepository.save(carrusel);
  }

  async findAll(): Promise<Carrusel[]> {
    return await this.carruselRepository.find({
      where: { activo: true },
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Carrusel> {
    const carrusel = await this.carruselRepository.findOne({ where: { id } });
    if (!carrusel) {
      throw new NotFoundException('Imagen de carrusel no encontrada');
    }
    return carrusel;
  }

  async update(id: string, updateCarruselDto: UpdateCarruselDto): Promise<Carrusel> {
    const carrusel = await this.findOne(id);
    Object.assign(carrusel, updateCarruselDto);
    return await this.carruselRepository.save(carrusel);
  }

  async remove(id: string): Promise<void> {
    const carrusel = await this.findOne(id);
    await this.carruselRepository.remove(carrusel);
  }
}
