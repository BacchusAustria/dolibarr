// src/app/services/cart/cart.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../../models/cart.model';
import { Discount } from '../../models/discount.model';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // --- States (Private Signals) ---
  private _cartItems = signal<CartItem[]>([]);
  private _globalDiscount = signal<Discount>({ value: 0, type: 'percent' });

  // --- Public Read-only Signals für UI & Komponenten ---
  public items = this._cartItems.asReadonly();
  public globalDiscount = this._globalDiscount.asReadonly();
  
  // Zwischensumme aller Artikel (inkl. Artikelrabatte)
  public subtotal = computed(() => {
    return parseFloat(
      this._cartItems().reduce((sum, item) => sum + this.calculateItemTotal(item), 0).toFixed(2)
    );
  });

  // Der Betrag des globalen Rabatts
  public globalDiscountAmount = computed(() => {
    const subtotal = this.subtotal();
    const discount = this._globalDiscount();
    let amount = 0;

    if (discount.type === 'euro') {
      amount = subtotal * (discount.value / 100);
    } else {
      amount = discount.value;
    }
    return parseFloat(Math.max(0, amount).toFixed(2));
  });

  // Endbetrag (Zwischensumme - globaler Rabatt)
  public cartTotal = computed(() => {
    const discount = this.subtotal() * (this.globalDiscountAmount()/100);
    const total = parseFloat(Math.max(0, this.subtotal() - discount).toFixed(2));
    return total;
  });

  // Gesamtanzahl Artikel
  public itemCount = computed(() => {
    return this._cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  /**
   * Berechnet den rabattierten Zeilenwert
   */
  public calculateItemTotal(item: CartItem): number {
    let lineTotal = item.quantity * item.price;
    if (item.discount.type === 'percent') {
      lineTotal = lineTotal * (1 - item.discount.value / 100);
    } else {
      lineTotal = lineTotal - item.discount.value;
    }
    return parseFloat(Math.max(0, lineTotal).toFixed(2));
  }

  /**
   * Ersetzt addItemFromGrid & addItem: Fügt Produkt hinzu oder aktualisiert Menge
   */
  public addProduct(product: Product, quantity: number = 1): void {
    this._cartItems.update(items => {
      const existingIndex = items.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        const updatedItems = [...items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity
        };
        return updatedItems;
      }

      const newItem: CartItem = {
        ...product,
        quantity: quantity,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        originalPrice: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        custom_price: false,
        discount: { value: 0, type: 'percent' }
      };
      return [...items, newItem];
    });
  }
  addItemFromGrid(item: CartItem): void {
  const currentItems = this.items();
  const existingItemIndex = currentItems.findIndex(i => i.id === item.id);

  if (existingItemIndex > -1) {
    // Wenn Artikel existiert: Menge erhöhen (aber Preis/Details des existierenden behalten?)
    // Im Original war es oft so: Grid-Klick erhöht nur Menge.
    const existing = currentItems[existingItemIndex];
    this.updateItem(existingItemIndex, { 
      quantity: existing.quantity + item.quantity 
    });
  } else {
    // Wenn neu: Das komplett gemappte Objekt hinzufügen
    this._cartItems.update(items => [...items, item]);
  }
}
  /**
   * Aktualisiert ein Item (z.B. Preisänderung oder Rabatt)
   */
  public updateItem(index: number, updates: Partial<CartItem>): void {
    this._cartItems.update(items => {
      if (index < 0 || index >= items.length) return items;
      
      const newItems = [...items];
      const currentItem = newItems[index];
      
      // Falls der Preis manuell geändert wird -> custom_price flag setzen
      if (updates.price !== undefined && updates.price !== currentItem.price) {
        updates.custom_price = true;
      }

      newItems[index] = { ...currentItem, ...updates };
      return newItems;
    });
  }

      /**
   * Aktualisiert die Menge (für Swipe-Funktion)
   */
  public updateAmount(index: number, quantity: number) {
    const currentItems = this._cartItems();
    if (index >= 0 && index < currentItems.length) {
      const originalAmount = currentItems[index].quantity;
      const newAmount = originalAmount + quantity;
      if (newAmount >= 0) {
      this.updateItem(index, { quantity: originalAmount + quantity });
      }
    }
  }
  public removeItem(index: number): void {
    this._cartItems.update(items => items.filter((_, i) => i !== index));
  }

  public setGlobalDiscount(discount: Discount): void {
    this._globalDiscount.set(discount);
  }

  public resetCart(): void {
    this._cartItems.set([]);
    this._globalDiscount.set({ value: 0, type: 'percent' });
  }

  // Hilfsmethode für die Suche
  public findItemByProductId(productId: string | number): CartItem | null {
    return this._cartItems().find(item => item.id === productId) || null;
  }
}