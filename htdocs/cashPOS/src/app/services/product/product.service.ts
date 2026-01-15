// src/app/services/product/product.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  // --- Signals (Zustand) ---
  // Wir behalten die public signals für den direkten Zugriff
  public products = signal<Product[]>([]);
  public categories = signal<Category[]>([]);

  // Für Abwärtskompatibilität (optional, falls andere Teile noch RxJS brauchen)
  // public readonly products$ = toObservable(this.products);

  constructor() {}

  // --- API CALLS ---

  async getProductsWithCategories(): Promise<Product[]> {
    const products = await firstValueFrom(this.api.get<Product[]>('/products'));
    
    // Kategorien für jedes Produkt laden
    await Promise.all(
      products.map(async (product) => {
        product.categories = await this.getCategoriesWithProduct(String(product.id));
      })
    );
    return products;
  }

  async getCategoriesWithProduct(id: string): Promise<Category[]> {
    return firstValueFrom(this.api.get<Category[]>(`/products/${id}/categories`));
  }
  
  async getCategories(): Promise<Category[]> {
    return firstValueFrom(this.api.get<Category[]>('/categories'));
  }

  // --- ZUSTANDS-AKTUALISIERUNG (Signal-Bridge) ---
  
  /**
   * Lädt Produkte und aktualisiert das Signal
   */
  async loadProducts(): Promise<void> {
    try {
      const data = await this.getProductsWithCategories(); 
      this.products.set(data); // Signal setzen
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error);
    }
  }
  
  /**
   * Lädt Kategorien und aktualisiert das Signal
   */
  async loadCategories(): Promise<void> {
    try {
      const data = await this.getCategories();
      this.categories.set(data); // Signal setzen
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
    }
  }

  // Weitere API Methoden bleiben gleich, da sie nur Daten zurückgeben
  async deleteProduct(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`/products/${id}`));
    // Nach dem Löschen Zustand lokal aktualisieren
    this.products.update(p => p.filter(item => item.id !== id));
  }
}