// src/app/services/product/product.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs'; // WICHTIG: RxJS für Reaktivität

@Injectable({
  providedIn: 'root'
})
export class ProductService {
    
    // **********************************************
    // ** 1. REAKTIVER ZUSTAND (Für KassaComponent) **
    // **********************************************
    
    // Hält den aktuellen Produktzustand und emittiert diesen an Abonnenten
    private _products = new BehaviorSubject<Product[]>([]);
    public readonly products$: Observable<Product[]> = this._products.asObservable();

    // Hält den aktuellen Kategorienzustand
    private _categories = new BehaviorSubject<Category[]>([]);
    public readonly categories$: Observable<Category[]> = this._categories.asObservable();

    constructor(private api: ApiService) {}

    // **********************************************
    // ** 2. API CALLS (Promise-basiert, wie vorgegeben) **
    // **********************************************

    async getProductsWithCategories(): Promise<Product[]> {
        // Annahme: api.get gibt ein Observable zurück
        const products = await firstValueFrom(this.api.get<Product[]>('/products'));
        
        await Promise.all(
            products.map(async (product) => {
                // Konvertiert ID zu String, falls nötig, und holt die Kategorien
                product.categories = await this.getCategoriesWithProduct(String(product.id));
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
        // HINWEIS: api.post muss als Observable implementiert sein, damit firstValueFrom funktioniert.
        return firstValueFrom(this.api.post<Product>('/products', product));
    }

    async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
        // HINWEIS: api.put muss als Observable implementiert sein.
        return firstValueFrom(this.api.put<Product>(`/products/${id}`, product));
    }

    async deleteProduct(id: string): Promise<void> {
        // HINWEIS: api.delete muss als Observable implementiert sein.
        await firstValueFrom(this.api.delete<void>(`/products/${id}`));
    }

    // **********************************************
    // ** 3. ZUSTANDS-AKTUALISIERUNG (Bridge zur API) **
    // **********************************************
    
    /**
     * Führt den API-Aufruf aus und aktualisiert das reaktive _products Subject.
     */
    async loadProducts(): Promise<void> {
        try {
            const products = await this.getProductsWithCategories(); 
            this._products.next(products);
        } catch (error) {
            console.error('Fehler beim Laden der Produkte:', error);
            // Hier könnten Sie Mock-Daten laden oder Fehler-Subject aktualisieren
            // this._products.next(MOCK_PRODUCTS);
        }
    }
    
    /**
     * Führt den API-Aufruf aus und aktualisiert das reaktive _categories Subject.
     */
    async loadCategories(): Promise<void> {
        try {
            const categories = await this.getCategories();
            this._categories.next(categories);
        } catch (error) {
            console.error('Fehler beim Laden der Kategorien:', error);
            // this._categories.next(MOCK_CATEGORIES);
        }
    }
}