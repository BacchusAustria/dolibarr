import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private api: ApiService) {}

  async getProductsWithCategories(): Promise<Product[]> {
  const products = await firstValueFrom(this.api.get<Product[]>('/products'));
  
  await Promise.all(
    products.map(async (product) => {
      product.categories = await this.getCategoriesWithProduct(product.id);
    })
  );
  
  return products;
}

  async getProductById(id: string): Promise<Product> {
    return firstValueFrom(this.api.get<Product>(`/products/${id}`));
  }

  async getCategoriesWithProduct(id: string): Promise<Category[]> {
    return firstValueFrom(this.api.get<Category[]>(`/products/${id}/categories`));
  }
  async getCategories(): Promise<Category[]> {
    return firstValueFrom(this.api.get<Category[]>('/categories'));
  }

  async getCategoryById(id: string): Promise<Category> {
    return firstValueFrom(this.api.get<Category>(`/categories/${id}`));
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return firstValueFrom(this.api.post<Product>('/products', product));
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return firstValueFrom(this.api.put<Product>(`/products/${id}`, product));
  }

  async deleteProduct(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`/products/${id}`));
  }
}
