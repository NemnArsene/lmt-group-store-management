import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ProductsFacade } from '../../products.facade';
import { ProductApiService } from '../../data-access/product-api.service';
import { CategoryApiService } from '../../data-access/category-api.service';
import { Category } from '../../../../shared/models/category.model';

@Component({
  selector: 'app-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressBarModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ProductsFacade);
  private readonly productService = inject(ProductApiService);
  private readonly categoryService = inject(CategoryApiService);
  private readonly snackBar = inject(MatSnackBar);

  /** Typed reactive form */
  productForm!: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  isSubmitting = false;
  filteredCategories$!: Observable<Category[]>;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  ngOnInit(): void {
    this.facade.loadCategories();
    this.initForm();

    // Autocomplete filter on categories
    this.filteredCategories$ = this.productForm
      .get('categoryInput')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          const name = typeof value === 'string' ? value : value?.name;
          return name
            ? this.filterCategories(name)
            : this.facade.categories().slice();
        }),
        takeUntilDestroyed(this.destroyRef),
      );

    // Route param subscription — auto-cleaned
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.productId = params.get('id');
        if (this.productId) {
          this.isEditMode = true;
          this.loadProduct(this.productId);
        }
      });
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.minLength(1)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      categoryInput: ['', [Validators.required]],
    });
  }

  private filterCategories(name: string): Category[] {
    const filterValue = name.toLowerCase();
    return this.facade
      .categories()
      .filter((option) => option.name.toLowerCase().includes(filterValue));
  }

  displayCategoryFn(category: Category): string {
    return category?.name ?? '';
  }

  private loadProduct(id: string): void {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        const category = this.facade
          .categories()
          .find((c) => c._id === product.categoryId);
        this.productForm.patchValue({
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          categoryInput: category ?? '',
        });
        if (product.imageUrl) {
          this.imagePreview = product.imageUrl;
        }
      },
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /** Helper to get FormControl for template */
  ctrl(name: string): FormControl {
    return this.productForm.get(name) as FormControl;
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.getRawValue();
    let categoryId = '';

    try {
      // Resolve category ID: existing selection or create new
      if (
        typeof formValue.categoryInput === 'object' &&
        formValue.categoryInput?._id
      ) {
        categoryId = formValue.categoryInput._id;
      } else {
        const catName =
          typeof formValue.categoryInput === 'string'
            ? formValue.categoryInput.trim()
            : formValue.categoryInput?.name?.trim();

        if (!catName) {
          this.snackBar.open('Category name cannot be empty', 'Close', {
            duration: 3000,
          });
          this.isSubmitting = false;
          return;
        }

        // Check if it matches an existing category (case-insensitive)
        const existing = this.facade
          .categories()
          .find((c) => c.name.toLowerCase() === catName.toLowerCase());

        if (existing) {
          categoryId = existing._id;
        } else {
          // Create new category via API
          const newCat = await firstValueFrom(
            this.categoryService.createCategory({ name: catName }),
          );
          categoryId = newCat._id;
          this.facade.loadCategories(); // Refresh categories globally
        }
      }

      const payload = {
        sku: formValue.sku.trim(),
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        price: +formValue.price,
        quantity: +formValue.quantity,
        categoryId,
      };

      let finalImageUrl: string | undefined = undefined;
      
      if (this.selectedFile) {
        try {
          const uploadResult = await firstValueFrom(this.productService.uploadImage(this.selectedFile));
          finalImageUrl = uploadResult.imageUrl;
        } catch (error) {
          console.error('Image upload failed, continuing without image', error);
          this.snackBar.open('Image upload failed, but saving product...', 'Close', { duration: 3000 });
        }
      }
      
      if (finalImageUrl) {
         (payload as any).imageUrl = finalImageUrl;
      }

      if (this.isEditMode && this.productId) {
        await firstValueFrom(
          this.productService.updateProduct(this.productId, payload),
        );
        this.snackBar.open('Product updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await firstValueFrom(this.productService.createProduct(payload));
        this.snackBar.open('Product created successfully', 'Close', {
          duration: 3000,
        });
      }

      this.router.navigate(['/products']);
    } catch {
      // Error already displayed by the global error interceptor
    } finally {
      this.isSubmitting = false;
    }
  }
}
