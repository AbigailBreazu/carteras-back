import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DesignDocument = Design & Document;

export enum DesignStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Design {
  @Prop({ required: true })
  userId: string; // UUID del usuario en PostgreSQL

  @Prop({ required: true })
  productModel: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  canvaDesignId?: string;

  @Prop({ type: String, enum: DesignStatus, default: DesignStatus.DRAFT })
  status: DesignStatus;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DesignSchema = SchemaFactory.createForClass(Design);
