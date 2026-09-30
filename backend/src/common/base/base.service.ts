import { Document, UpdateQuery } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from './base.repository.js';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/paginated-result.interface.js';

@Injectable()
export abstract class BaseService<
  T extends Document,
  R extends BaseRepository<T>,
> {
  protected readonly logger: Logger;

  constructor(protected readonly repository: R) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.repository.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async findPaginated(
    filter: Record<string, any>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    return this.repository.findPaginated(filter, options);
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.repository.updateById(id, data);
  }

  async softDelete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return this.repository.exists(filter);
  }
}
