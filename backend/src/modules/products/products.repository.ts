import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@common/base/base.repository.js';
import { Product, ProductDocument } from './schemas/product.schema.js';

@Injectable()
export class ProductsRepository extends BaseRepository<ProductDocument> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {
    super(productModel);
  }

  async findBySku(sku: string): Promise<ProductDocument | null> {
    return this.findOne({ sku });
  }
}
