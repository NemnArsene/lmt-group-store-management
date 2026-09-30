import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates that a route parameter is a valid MongoDB ObjectId.
 * Prevents Mongoose CastError crashes by failing fast with a 400.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`"${value}" is not a valid MongoDB ObjectId`);
    }
    return value;
  }
}
