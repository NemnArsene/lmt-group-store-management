import { Document, UpdateQuery, Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/paginated-result.interface.js';

@Injectable()
export abstract class BaseRepository<T extends Document> {
  protected readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(doc: Partial<T>): Promise<T> {
    try {
      const created = new this.model(doc);
      await created.save();
      return created as unknown as T;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error creating document: ${err.message}`, err.stack);
      throw error;
    }
  }

  async findOne(
    filter: Record<string, any>,
    projection?: Record<string, unknown>,
  ): Promise<T | null> {
    try {
      return (await this.model
        .findOne(filter, projection)
        .lean()
        .exec()) as unknown as T | null;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error finding document: ${err.message}`, err.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ _id: id });
  }

  async findPaginated(
    filter: Record<string, any>,
    options: PaginationOptions,
    projection?: Record<string, unknown>,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.model
          .find(filter, projection)
          .sort(sort as any)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      return {
        data: data as unknown as T[],
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error finding paginated documents: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    try {
      return (await this.model
        .findByIdAndUpdate(id, update, { new: true })
        .lean()
        .exec()) as unknown as T | null;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error updating document: ${err.message}`, err.stack);
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.model
        .findByIdAndUpdate(id, { $set: { isActive: false } } as UpdateQuery<T>)
        .exec();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error soft-deleting document: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }
}
