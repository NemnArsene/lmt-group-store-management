import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(resource: string, id: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        code: `${resource.toUpperCase()}_NOT_FOUND`,
        message: `${resource} with id "${id}" not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(code: string, message: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code,
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ProductNotFoundException extends NotFoundException {
  constructor(id: string) {
    super('Product', id);
  }
}

export class CategoryNotFoundException extends NotFoundException {
  constructor(id: string) {
    super('Category', id);
  }
}

export class DuplicateSkuException extends ConflictException {
  constructor(sku: string) {
    super(
      'PRODUCT_SKU_ALREADY_EXISTS',
      `A product with SKU "${sku}" already exists`,
    );
  }
}
