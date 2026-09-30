import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductsFacade } from '../../products.facade';
import { ProductApiService } from '../../data-access/product-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  readonly facade = inject(ProductsFacade);
  private readonly productService = inject(ProductApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('');

  ngOnInit(): void {
    this.facade.loadCategories();
    this.facade.loadProducts();

    // Debounced search — auto-cleaned via takeUntilDestroyed
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.facade.updateFilters({ search: value || undefined });
      });
  }

  onCategoryChange(categoryId: string | undefined): void {
    this.facade.updateFilters({ categoryId });
  }

  onStatusChange(isActive: boolean | undefined): void {
    this.facade.updateFilters({ isActive });
  }

  onSortChange(sortBy: string | undefined): void {
    this.facade.updateFilters({ sortBy });
  }

  onPageChange(event: PageEvent): void {
    this.facade.updateFilters({
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  deleteProduct(id: string): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted successfully', 'Close', {
          duration: 3000,
        });
        this.facade.loadProducts();
      },
    });
  }

  getCategoryName(categoryId: string): string {
    const cat = this.facade.categories().find((c) => c._id === categoryId);
    return cat?.name ?? '—';
  }
}
