export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity: number;
  imageUrl?: string;
  categoryId: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
