import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { ProductsRepository } from './products.repository.js';
import { DuplicateSkuException, ProductNotFoundException } from '@common/exceptions/domain.exceptions.js';
import { CategoriesService } from '../categories/categories.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Mocked<ProductsRepository>;

  const mockRepository = {
    create: vi.fn(),
    findBySku: vi.fn(),
    findPaginated: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    exists: vi.fn(),
    softDelete: vi.fn(),
  };

  const mockCategoriesService = {
    exists: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: mockRepository,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsRepository) as Mocked<ProductsRepository>;
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should throw BadRequestException if category does not exist', async () => {
      mockCategoriesService.exists.mockResolvedValueOnce(false);
      
      const createDto: any = { sku: 'TEST-SKU', name: 'Test Product', categoryId: '507f1f77bcf86cd799439011' };
      
      await expect(service.createProduct(createDto)).rejects.toThrow('Category not found or inactive');
      expect(repository.findBySku).not.toHaveBeenCalled();
    });

    it('should throw DuplicateSkuException if SKU already exists', async () => {
      mockCategoriesService.exists.mockResolvedValueOnce(true);
      repository.findBySku.mockResolvedValueOnce({ sku: 'TEST-SKU' } as any);
      
      const createDto: any = { sku: 'TEST-SKU', name: 'Test Product', categoryId: '507f1f77bcf86cd799439011' };
      
      await expect(service.createProduct(createDto)).rejects.toThrow(DuplicateSkuException);
      expect(repository.findBySku).toHaveBeenCalledWith('TEST-SKU');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should successfully create a product if SKU is unique', async () => {
      mockCategoriesService.exists.mockResolvedValueOnce(true);
      repository.findBySku.mockResolvedValueOnce(null);
      repository.create.mockResolvedValueOnce({ sku: 'NEW-SKU', _id: '123' } as any);

      const createDto: any = { sku: 'NEW-SKU', name: 'New Product', categoryId: '507f1f77bcf86cd799439011' };
      
      const result = await service.createProduct(createDto);
      
      expect(result.sku).toBe('NEW-SKU');
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should throw ProductNotFoundException if product does not exist or is inactive', async () => {
      repository.exists.mockResolvedValueOnce(false);
      
      await expect(service.deleteProduct('507f1f77bcf86cd799439011')).rejects.toThrow(ProductNotFoundException);
      expect(repository.exists).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', isActive: true });
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should successfully soft-delete an existing product', async () => {
      repository.exists.mockResolvedValueOnce(true);
      repository.softDelete.mockResolvedValueOnce(undefined);
      
      await service.deleteProduct('507f1f77bcf86cd799439011');
      
      expect(repository.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
