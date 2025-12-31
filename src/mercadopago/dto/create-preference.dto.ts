import { IsNotEmpty, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class MercadoPagoItemDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unit_price: number;
}

export class MercadoPagoPayerDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  phone: string;
}

export class CreatePreferenceDto {
  @IsNotEmpty({ message: 'El orden_id es obligatorio' })
  orden_id: string;

  @IsNotEmpty({ message: 'Los items son obligatorios' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MercadoPagoItemDto)
  items: MercadoPagoItemDto[];

  @IsNotEmpty({ message: 'Los datos del pagador son obligatorios' })
  @IsObject()
  @ValidateNested()
  @Type(() => MercadoPagoPayerDto)
  payer: MercadoPagoPayerDto;
}
