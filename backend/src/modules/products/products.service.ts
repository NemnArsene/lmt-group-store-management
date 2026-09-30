import { Injectable } from '@nestjs/common';
import { BaseService } from '@common/base/base.service.js';
import { Types } from 'mongoose';
import { ProductDocument } from './schemas/product.schema.js';
import { ProductsRepository } from './products.repository.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto.js';
import {
  DuplicateSkuException,
  ProductNotFoundException,
} from '@common/exceptions/domain.exceptions.js';
import type { PaginatedResult } from '@common/interfaces/paginated-result.interface.js';

@Injectable()
export class ProductsService extends BaseService<
  ProductDocument,
  ProductsRepository
> {
  constructor(protected readonly repository: ProductsRepository) {
    super(repository);
  }

  async createProduct(data: CreateProductDto): Promise<ProductDocument> {
    const exists = await this.repository.findBySku(data.sku);
    if (exists) {
      throw new DuplicateSkuException(data.sku);
    }

    // In a real app, we would verify category existence here via CategoryService
    // For now, we trust the categoryId validation from class-validator

    return this.repository.create({
      ...data,
      categoryId: new Types.ObjectId(data.categoryId),
    });
  }

  async findAllProducts(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<ProductDocument>> {
    const filter: Record<string, any> = { isActive: true };

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (query.sortBy) {
      sortOptions[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions['createdAt'] = -1; // Default sort
    }

    return this.repository.findPaginated(filter, {
      page: query.page,
      limit: query.limit,
      sort: sortOptions,
    });
  }

  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductDocument> {
    if (data.sku) {
      const existingProductWithSku = await this.repository.findBySku(data.sku);
      if (
        existingProductWithSku &&
        existingProductWithSku._id.toString() !== id
      ) {
        throw new DuplicateSkuException(data.sku);
      }
    }

    const updated = await this.repository.updateById(id, data);
    if (!updated) {
      throw new ProductNotFoundException(id);
    }
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    const exists = await this.repository.exists({ _id: id, isActive: true });
    if (!exists) {
      throw new ProductNotFoundException(id);
    }

    await this.repository.softDelete(id);
  }
}
