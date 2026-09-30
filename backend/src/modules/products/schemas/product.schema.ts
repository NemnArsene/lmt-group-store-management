import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, unique: true, index: true })
  sku: string;

  @Prop({ required: true, minlength: 2 })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, default: 0 })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Partial text index for search capabilities (name and sku)
ProductSchema.index({ name: 'text', sku: 'text' });
