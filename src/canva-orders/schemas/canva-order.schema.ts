import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CanvaOrderDocument = CanvaOrder & Document;

export enum CanvaOrderStatus {
  APPROVED = 'approved',
  IN_PRODUCTION = 'in_production',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class CanvaOrder {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Design' })
  designId: Types.ObjectId;

  @Prop({ required: true })
  userId: string; // UUID del usuario en PostgreSQL

  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop({ type: String, enum: CanvaOrderStatus, default: CanvaOrderStatus.APPROVED })
  status: CanvaOrderStatus;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CanvaOrderSchema = SchemaFactory.createForClass(CanvaOrder);
