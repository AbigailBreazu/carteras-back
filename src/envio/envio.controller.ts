import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EnvioService } from './envio.service';
import { CalcularEnvioDto } from './dto/calcular-envio.dto';

@Controller('api/calcular-envio')
export class EnvioController {
  constructor(private readonly envioService: EnvioService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  calcularEnvio(@Body() calcularEnvioDto: CalcularEnvioDto) {
    return this.envioService.calcularEnvio(calcularEnvioDto);
  }
}

