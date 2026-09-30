import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, unique: true, type: String })
  name: string;

  @Prop({ default: true, type: Boolean })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
