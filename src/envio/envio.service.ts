import { Injectable, BadRequestException } from '@nestjs/common';
import { CalcularEnvioDto } from './dto/calcular-envio.dto';

@Injectable()
export class EnvioService {
  /**
   * Calcula el costo de envío basado en el código postal
   * 
   * Zonas de envío para Argentina:
   * - CABA (1000-1439): $2000
   * - GBA (1600-1893): $2500
   * - Interior Buenos Aires: $3500
   * - Resto del país: $4500
   */
  calcularEnvio(calcularEnvioDto: CalcularEnvioDto) {
    const { codigoPostal, peso = 0.5, items = [] } = calcularEnvioDto;

    // Validar código postal argentino (4 dígitos)
    const codigoPostalNum = parseInt(codigoPostal);
    if (isNaN(codigoPostalNum) || codigoPostal.length !== 4) {
      throw new BadRequestException('Código postal inválido. Debe tener 4 dígitos.');
    }

    let costoEnvio: number;
    let tiempoEstimado: string;
    let zona: string;

    // Determinar zona y costo según código postal
    if (codigoPostalNum >= 1000 && codigoPostalNum <= 1439) {
      // CABA
      costoEnvio = 2000;
      tiempoEstimado = '1-3 días hábiles';
      zona = 'CABA';
    } else if (codigoPostalNum >= 1600 && codigoPostalNum <= 1893) {
      // Gran Buenos Aires
      costoEnvio = 2500;
      tiempoEstimado = '2-4 días hábiles';
      zona = 'Gran Buenos Aires';
    } else if (codigoPostalNum >= 1000 && codigoPostalNum <= 9999 && codigoPostalNum < 2000) {
      // Interior Buenos Aires
      costoEnvio = 3500;
      tiempoEstimado = '3-6 días hábiles';
      zona = 'Interior Buenos Aires';
    } else {
      // Resto del país
      costoEnvio = 4500;
      tiempoEstimado = '5-10 días hábiles';
      zona = 'Interior del país';
    }

    // Ajustar precio si el peso es mayor a 1kg
    if (peso > 1) {
      const pesoExtra = Math.ceil(peso - 1);
      costoEnvio += pesoExtra * 500; // $500 por cada kg adicional
    }

    return {
      success: true,
      costoEnvio,
      tiempoEstimado,
      courier: 'Correo Argentino',
      zona,
      peso,
      itemsCount: items.length,
    };
  }
}
