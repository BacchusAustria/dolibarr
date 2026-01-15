// src/app/services/cart/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { CartItem } from '../../models/cart.model';
import { Discount } from '../../models/discount.model';
import { PriceUtils } from '../../utils/price.utils';
// Import für CalculationUtils (Annahme, dass es existiert)
// import { CalculationUtils } from '../../utils/calculation.utils'; 

@Injectable({
  providedIn: 'root',
})
export class CartService {

  private _cartItems = new BehaviorSubject<CartItem[]>([]);
  public readonly cartItems$: Observable<CartItem[]> = this._cartItems.asObservable();

  private _globalDiscount = new BehaviorSubject<Discount>({ value: 0, type: 'percent' });
  public readonly globalDiscount$: Observable<Discount> = this._globalDiscount.asObservable();
  public getGlobalDiscount(): Discount {
    return this._globalDiscount.getValue();
  }

    longPressTimer: number | null = null;
  constructor() { }

  /**
   * Berechnet den rabattierten Gesamtbetrag für einen einzelnen Warenkorb-Posten.
   */
  public calculateItemTotal(item: CartItem): number {
    let lineTotal = item.quantity * item.price;
    const discount = item.discount;

    if (discount.type === 'percent') {
      lineTotal = lineTotal * (1 - discount.value / 100);
    } else if (discount.type === 'euro') {
      lineTotal = lineTotal - discount.value;
    }
    // Stellt sicher, dass der Betrag nicht negativ ist
    return parseFloat(Math.max(0, lineTotal).toFixed(2));
  }


  public readonly subtotal$: Observable<number> = this.cartItems$.pipe(
    map(items =>
      parseFloat(items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0).toFixed(2))
    )
  );

 
  public readonly globalDiscountAmount$: Observable<number> = combineLatest([
    this.subtotal$,
    this.globalDiscount$
  ]).pipe(
    map(([subtotal, discount]) => {
      let amount = 0;
      if (discount.type === 'percent') {
        amount = subtotal * (discount.value / 100);
      } else if (discount.type === 'euro') {
        amount = discount.value;
      }
      return parseFloat(Math.max(0, amount).toFixed(2));
    })
  );

  public readonly cartTotal$: Observable<number> = combineLatest([
    this.subtotal$,
    this.globalDiscountAmount$
  ]).pipe(
    map(([subtotal, discountAmount]) =>
      parseFloat(Math.max(0, subtotal - discountAmount).toFixed(2))
    )
  );
  public addItemFromGrid(newItem: CartItem) {
    const currentItems = this._cartItems.getValue();
    const existingItemIndex = currentItems.findIndex(item =>
      item.id === newItem.id
    );
    if (existingItemIndex > -1) {
      const updatedItems = currentItems.map((item, index) => {
        if (index === existingItemIndex) {
          const updatedQuantity = item.quantity + newItem.quantity;
          return { ...item, quantity: updatedQuantity };
        }
        return item;
      }); 
      this._cartItems.next(updatedItems);
    }
    else {
      this._cartItems.next([...currentItems, newItem]);
    }
  }
  public addItem(newItem: CartItem, replaceIfExists: boolean = false) {
    const currentItems = this._cartItems.getValue();
    const existingItemIndex = currentItems.findIndex(item =>
      item.id === newItem.id
    );

    if (replaceIfExists === true && existingItemIndex > -1) {
      const updatedItems = currentItems.map((item, index) => {
        if (index === existingItemIndex) {
          return { ...item, quantity: newItem.quantity, custom_price: newItem.custom_price, discount: newItem.discount, price: newItem.price, price_ttc: newItem.price_ttc};
        }
        return item;
      });
      this._cartItems.next(updatedItems);
    } else {
      this._cartItems.next([...currentItems, newItem]);
    }
  }

  public removeItem(index: number) {
    const currentItems = this._cartItems.getValue();
    if (index >= 0 && index < currentItems.length) {
      const updatedItems = currentItems.filter((_, i) => i !== index);
      this._cartItems.next(updatedItems);
    }
  }

  /**
   * Aktualisiert beliebige Felder eines Warenkorb-Postens (z.B. Menge oder Preis).
   */
  public updateItem(index: number, updates: Partial<CartItem>) {
    const currentItems = this._cartItems.getValue();
    if (index >= 0 && index < currentItems.length) {
      const updatedItem = { ...currentItems[index], ...updates };
      const newItems = currentItems.map((item, i) => i === index ? updatedItem : item);
      this._cartItems.next(newItems);
    }
  }

    /**
   * Aktualisiert die Menge (für Swipe-Funktion)
   */
  public updateAmount(index: number, quantity: number) {
    const currentItems = this._cartItems.getValue();
    if (index >= 0 && index < currentItems.length) {
      const originalAmount = currentItems[index].quantity;
      const newAmount = originalAmount + quantity;
      if (newAmount >= 0) {
      this.updateItem(index, { quantity: originalAmount + quantity });
      }
    }
  }

  /**
   * Setzt den Rabatt für einen spezifischen Artikel.
   */
  public setItemDiscount(index: number, discount: Discount) {
    this.updateItem(index, { discount: discount });
  }

  /**
   * Setzt den globalen Rabatt für den gesamten Warenkorb.
   */
  public setGlobalDiscount(discount: Discount) {
    this._globalDiscount.next(discount);
  }

  /**
   * Setzt den Warenkorb und den globalen Rabatt zurück.
   */
  public resetCart() {
    this._cartItems.next([]);
    this._globalDiscount.next({ value: 0, type: 'percent' });
  }

  // Synchrone Getter (für Legacy-Code wie completeTransaction in App.ts)
  public getItems(): CartItem[] {
    return this._cartItems.getValue();
  }

  public getCartTotal(): number {
    let total = 0;
    // Stellt den synchronen Wert aus dem Observable bereit
    this.cartTotal$.subscribe(t => total = t).unsubscribe();
    return total;
  }

  /**
   * Sucht nach einem Produkt im Warenkorb nach ID.
   * @param productId Die ID des Produkts
   * @returns CartItem wenn gefunden, null wenn nicht gefunden
   */
  public findItemByProductId(productId: string | number): CartItem | null {
    const items = this._cartItems.getValue();
    return items.find(item => item.id === productId) || null;
  }
}