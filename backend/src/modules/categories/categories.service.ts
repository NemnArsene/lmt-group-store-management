import { Injectable } from '@nestjs/common';
import { BaseService } from '@common/base/base.service.js';
import { CategoryDocument } from './schemas/category.schema.js';
import { CategoriesRepository } from './categories.repository.js';
import { ConflictException } from '@common/exceptions/domain.exceptions.js';

@Injectable()
export class CategoriesService extends BaseService<CategoryDocument, CategoriesRepository> {
  constructor(repository: CategoriesRepository) {
    super(repository);
  }

  async createCategory(name: string): Promise<CategoryDocument> {
    const exists = await this.repository.exists({ name });
    if (exists) {
      throw new ConflictException('CATEGORY_ALREADY_EXISTS', `A category with name ${name} already exists`);
    }
    return this.repository.create({ name, isActive: true });
  }

  async findAllCategories(): Promise<CategoryDocument[]> {
    return this.repository.findPaginated({ isActive: true }, { page: 1, limit: 1000 }).then(res => res.data);
  }
}
