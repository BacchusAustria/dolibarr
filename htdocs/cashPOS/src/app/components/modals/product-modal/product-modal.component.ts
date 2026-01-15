// src/app/components/modals/product-modal/product-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product.model';
import { PriceUtils } from '../../../utils/price.utils';

// Definiert das benötigte Datenmodell für temporäre Änderungen
export interface TempProduct {
  quantity: number;
  price: number;
  discount: { value: number; type: 'percent' | 'euro' };
}

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (product) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="onClose.emit()">
        <div class="bg-white rounded-lg p-6 w-full max-w-sm relative" (click)="$event.stopPropagation()">
    
    <div class="flex items-center justify-between mb-4 border-b pb-2">
        <div class="w-20">
            @if (isEditMode) {
                <button 
                    (click)="onDelete.emit()" 
                    class="text-xs font-bold text-red-600 border border-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    LÖSCHEN
                </button>
            }
        </div>

        <div class="text-3xl">📦</div>

        <div class="w-20 flex justify-end">
            <button 
                (click)="onClose.emit()" 
                class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                title="Schließen"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <path d="m15 9-6 6"/><path d="m9 9 6 6"/>
                </svg>
            </button>
        </div>
    </div>

    <div class="text-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">{{ product.label }}</h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider">
            Basis: {{ PriceUtils.getPriceForProduct(product) | number:'1.2-2' }}€
        </p>
    </div>
          
          <div class="space-y-4">
            
            <div>
    <label htmlFor="modal-quantity" class="block text-sm font-medium mb-1">Menge</label>
    <div class="flex items-center space-x-2">
        <button
            (click)="updateQuantity(-1)"
            class="p-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
        >
            ➖
        </button>
        <input
            id="modal-quantity"
            type="number"
            [ngModel]="tempProduct.quantity"
            (ngModelChange)="updateQuantityInput($event)"
            
            class="flex-1 min-w-0 border rounded px-3 py-2 text-center font-semibold text-lg"
            
            min="1"
        />
        <button
            (click)="updateQuantity(1)"
            class="p-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
        >
            ➕
        </button>
    </div>
</div>
            
            <div>
              <label htmlFor="modal-price" class="block text-sm font-medium mb-1">Preis pro Stück</label>
              <input
                id="modal-price"
                type="number"
                [ngModel]="tempProduct.price | number:'1.2-2'"
                (ngModelChange)="updatePriceInput($event)"
                class="w-full border rounded px-3 py-2 text-right font-medium"
                step="0.01"
                min="0"
              />
            </div>
              <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1">Rabatt auf diesen Artikel</label>
      <div class="flex space-x-2">
        <input type="number" 
             [ngModel]="tempProduct.discount.value"
             (ngModelChange)="updateDiscountValue($event)"
             class="flex-1 border rounded px-3 py-2" />
        <select [ngModel]="tempProduct.discount.type"
              (ngModelChange)="updateDiscountType($event)"
              class="border rounded p-2">
          <option value="percent">%</option>
          <option value="euro">€</option>
        </select>
      </div>
    </div>

 
</div>
            <div class="bg-gray-100 p-3 rounded">
              <div class="flex justify-between font-bold text-lg">
                <span>Gesamtpreis:</span>
                <span>{{ calculateTotal() | number:'1.2-2' }}€</span>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3 mt-6">
            <button
              (click)="onClose.emit()"
              class="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors font-medium"
            >
              Abbrechen
            </button>
            <button
              (click)="addProduct.emit()"
              class="flex-1 px-4 py-3 bg-[#828f9a] text-white rounded-lg hover:bg-[#171819] transition-colors font-medium"
            >
              @if (isEditMode) {Aktualisieren} @else {Hinzufügen}
            </button>

          </div>
          
        </div>
        
      </div>

    }
  `,
  styles: ['']
})
export class ProductModalComponent implements OnChanges {
  @Input() product: Product | null = null;
  @Input({ required: true }) tempProduct!: TempProduct; // Menge & Preis vom Container
  @Input({ required: true }) isEditMode: boolean = false;

  @Output() tempProductChange = new EventEmitter<TempProduct>(); // Aktualisiert den Container-Status
  @Output() addProduct = new EventEmitter<void>(); // Zum Warenkorb hinzufügen
  @Output() onClose = new EventEmitter<void>(); // Modal schließen
  @Output() onDelete = new EventEmitter<void>(); // Zum Löschen von Produkten
  public PriceUtils = PriceUtils;
  // Stellt sicher, dass die Menge immer mindestens 1 ist, wenn sich das Produkt ändert
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tempProduct'] && this.tempProduct.quantity < 1) {
      this.updateQuantityInput(1);
    }
  }

  updateQuantity(delta: number): void {
    const newQuantity = Math.max(1, this.tempProduct.quantity + delta);
    this.tempProductChange.emit({ ...this.tempProduct, quantity: newQuantity });
  }

  updateQuantityInput(value: number | string): void {
    let numValue = (typeof value === 'string') ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue < 1) {
      numValue = 1;
    }
    this.tempProductChange.emit({ ...this.tempProduct, quantity: Math.floor(numValue) });
  }

  updatePriceInput(value: number | string): void {
    const numValue = (typeof value === 'string') ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue >= 0) {
      const fixedValue = parseFloat(numValue.toFixed(2));
      this.tempProductChange.emit({ ...this.tempProduct, price: numValue });
    }
  }

  calculateTotal(): number {
    return this.tempProduct.quantity * (this.tempProduct.price * (1 - (this.tempProduct.discount.type === 'percent' ? this.tempProduct.discount.value / 100 : 0)) - (this.tempProduct.discount.type === 'euro' ? this.tempProduct.discount.value : 0));
  }

  updateDiscountValue(value: number): void {
    this.tempProductChange.emit({
      ...this.tempProduct,
      discount: { ...this.tempProduct.discount, value }
    });
  }

  updateDiscountType(type: 'percent' | 'euro'): void {
    this.tempProductChange.emit({
      ...this.tempProduct,
      discount: { ...this.tempProduct.discount, type }
    });
  }
}