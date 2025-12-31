import { Controller, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Controller('mercadopago')
export class MercadopagoController {
  constructor(private readonly mercadopagoService: MercadopagoService) {}

  @Post('create-preference')
  @HttpCode(HttpStatus.OK)
  async createPreference(@Body() createPreferenceDto: CreatePreferenceDto) {
    // Log del body recibido para debugging (ver si el frontend está enviando `auto_return`)
    try {
      console.log('Mercado Pago - createPreference body (raw):', JSON.stringify(createPreferenceDto));
    } catch (e) {
      console.log('Mercado Pago - createPreference body (could not stringify)');
    }

    // Sanitizar body entrante: eliminar `auto_return` si existe por seguridad
    const safeBody: any = { ...(createPreferenceDto as any) };
    if (safeBody.hasOwnProperty('auto_return')) {
      delete safeBody.auto_return;
    }

    try {
      console.log('Mercado Pago - createPreference body (sanitized):', JSON.stringify(safeBody));
      return await this.mercadopagoService.createPreference(safeBody as CreatePreferenceDto);
    } catch (err: any) {
      console.error('Mercado Pago - controlador error:', err);
      const body = err?.response || err?.message || err || { error: 'Error desconocido' };
      throw new HttpException(body, err?.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any) {
    return this.mercadopagoService.handleWebhook(body);
  }
}
