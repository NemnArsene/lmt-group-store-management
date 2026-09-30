import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductApiService } from '../../data-access/product-api.service';
import { ProductsFacade } from '../../products.facade';
import { Product } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, 
    MatIconModule, MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductApiService);
  private readonly facade = inject(ProductsFacade);
  private readonly destroyRef = inject(DestroyRef);

  product: Product | null = null;
  isLoading = true;
  categoryName = '';

  ngOnInit(): void {
    this.facade.loadCategories();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  private loadProduct(id: string): void {
    this.isLoading = true;
    this.productService.getProduct(id).subscribe({
      next: (data) => {
        this.product = data;
        const category = this.facade.categories().find(c => c._id === data.categoryId);
        this.categoryName = category?.name ?? 'Unknown Category';
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
