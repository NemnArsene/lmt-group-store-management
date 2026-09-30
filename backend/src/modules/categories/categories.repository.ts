import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@common/base/base.repository.js';
import { Category, CategoryDocument } from './schemas/category.schema.js';

@Injectable()
export class CategoriesRepository extends BaseRepository<CategoryDocument> {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {
    super(categoryModel);
  }
}
