import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, unique: true, index: true, type: String })
  sku: string;

  @Prop({ required: true, minlength: 2, type: String })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true, min: 0, type: Number })
  price: number;

  @Prop({ default: 'Frs CFA', type: String })
  currency: string;

  @Prop({ required: true, min: 0, default: 0, type: Number })
  quantity: number;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ default: true, index: true, type: Boolean })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Partial text index for search capabilities (name and sku)
ProductSchema.index({ name: 'text', sku: 'text' });
