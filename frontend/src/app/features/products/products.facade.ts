import { Injectable, inject, signal } from '@angular/core';
import { ProductApiService } from './data-access/product-api.service';
import { CategoryApiService } from './data-access/category-api.service';
import { Product } from '../../shared/models/product.model';
import { Category } from '../../shared/models/category.model';
import { finalize } from 'rxjs';

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class ProductsFacade {
  private readonly productService = inject(ProductApiService);
  private readonly categoryService = inject(CategoryApiService);

  // — State Signals —
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly totalProducts = signal(0);
  readonly totalPages = signal(0);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ProductFilters>({
    page: 1,
    limit: 8,
  });

  /** Load all active categories from the API */
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Error loading categories'),
    });
  }

  /** Load products based on current filters */
  loadProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService
      .getProducts(this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.totalProducts.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages);
        },
        error: (err) =>
          this.error.set(err?.error?.message ?? 'Error loading products'),
      });
  }

  /**
   * Update filters and reload products.
   * Resets to page 1 unless `page` is explicitly provided.
   */
  updateFilters(newFilters: Partial<ProductFilters>): void {
    this.filters.update((f) => ({
      ...f,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
    this.loadProducts();
  }

  /** Navigate to a specific page */
  changePage(page: number): void {
    this.filters.update((f) => ({ ...f, page }));
    this.loadProducts();
  }
}
