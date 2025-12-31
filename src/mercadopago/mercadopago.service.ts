import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { OrdenesService } from '../ordenes/ordenes.service';
import { OrdenEstado } from '../ordenes/entities/orden.entity';

@Injectable()
export class MercadopagoService {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

  constructor(
    private configService: ConfigService,
    private ordenesService: OrdenesService,
  ) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno');
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(createPreferenceDto: CreatePreferenceDto) {
    try {
      // Verificar que la orden existe
      await this.ordenesService.findOne(createPreferenceDto.orden_id);

      const frontendUrlRaw = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const frontendUrl = (frontendUrlRaw || '').trim();

      const backUrls: any = {};
      if (frontendUrl) {
        // Asegurar que tiene protocolo
        const hasProtocol = /^https?:\/\//i.test(frontendUrl);
        const normalizedFrontend = hasProtocol ? frontendUrl.replace(/\/$/, '') : `http://${frontendUrl.replace(/\/$/, '')}`;
        backUrls.success = `${normalizedFrontend}/checkout/success`;
        backUrls.failure = `${normalizedFrontend}/checkout/failure`;
        backUrls.pending = `${normalizedFrontend}/checkout/pending`;
      }

      const preferenceData: any = {
        items: createPreferenceDto.items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: 'ARS',
        })),
        payer: {
          name: createPreferenceDto.payer.name,
          email: createPreferenceDto.payer.email,
          phone: {
            number: createPreferenceDto.payer.phone,
          },
        },
        notification_url: `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000'}/mercadopago/webhook`,
        external_reference: createPreferenceDto.orden_id,
        statement_descriptor: 'DATSUSARA',
      };

      // Asegurar que `auto_return` no se envíe por accidente en entornos locales
      if (preferenceData.hasOwnProperty('auto_return')) {
        delete preferenceData.auto_return;
      }

      // Incluir back_urls sólo si la URL de success es HTTPS (evita problemas en local)
      if (backUrls.success && /^https:\/\//i.test(backUrls.success)) {
        preferenceData.back_urls = backUrls;
      }

      // Si por algún motivo back_urls fue agregado y apunta a http, eliminarlo
      if (preferenceData.back_urls && /^http:\/\//i.test(preferenceData.back_urls.success)) {
        delete preferenceData.back_urls;
      }

      // Log final del payload que enviaremos a Mercado Pago (para debugging)
      console.log('Mercado Pago - preferenceData final:', JSON.stringify(preferenceData, null, 2));

      const response = await this.preference.create({ body: preferenceData });

      // Actualizar la orden con el preference_id
      await this.ordenesService.updateMercadoPagoData(
        createPreferenceDto.orden_id,
        '',
        response.id,
      );

      return {
        preference_id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
      };
    } catch (error) {
      // Loguear el error completo para debugging
      console.error('Error al crear preferencia de Mercado Pago:', error);

      // Intentar extraer detalles útiles de la respuesta de MP
      const details =
        (error && (error.response || error.body || error.message)) ||
        JSON.stringify(error);

      // Devolver 400 con detalles para que el frontend muestre información útil
      throw new BadRequestException({ error: 'Error al crear preferencia de pago', details });
    }
  }

  async handleWebhook(body: any) {
    try {
      // Verificar que sea una notificación de pago
      if (body.type !== 'payment') {
        return { received: true, message: 'Notificación ignorada' };
      }

      const paymentId = body.data.id;

      // Obtener información del pago desde la API de Mercado Pago
      const paymentInfo = await this.payment.get({ id: paymentId });

      const externalReference = paymentInfo.external_reference;

      if (!externalReference) {
        console.error('No se encontró external_reference en el pago');
        return { received: true };
      }

      // Actualizar la orden según el estado del pago
      let nuevoEstado: OrdenEstado;

      switch (paymentInfo.status) {
        case 'approved':
          nuevoEstado = OrdenEstado.APPROVED;
          break;
        case 'pending':
        case 'in_process':
          nuevoEstado = OrdenEstado.PENDING;
          break;
        case 'rejected':
        case 'cancelled':
          nuevoEstado = OrdenEstado.REJECTED;
          break;
        default:
          nuevoEstado = OrdenEstado.PENDING;
      }

      // Actualizar orden
      await this.ordenesService.updateEstado(externalReference, { estado: nuevoEstado });
      // Guardar datos completos del pago como comprobante en la orden
      await this.ordenesService.updateMercadoPagoData(externalReference, String(paymentId), undefined, paymentInfo);

      console.log(`Orden ${externalReference} actualizada a estado: ${nuevoEstado}`);

      return {
        received: true,
        orden_id: externalReference,
        payment_status: paymentInfo.status,
        nuevo_estado: nuevoEstado,
      };
    } catch (error) {
      console.error('Error procesando webhook de Mercado Pago:', error);
      // Devolver 200 para que MP no reintente
      return { received: true, error: 'Error interno procesado' };
    }
  }
}
