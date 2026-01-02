// src/app/components/product-grid/product-grid.component.ts (Refactored)

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { PriceUtils } from '../../utils/price.utils';

// Definieren Sie eine minimale Bewegungsschwelle (in Pixeln)
const MOVE_THRESHOLD = 10; 

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
      <div class="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"> 
            
            @for (product of products; track product.id) {
    <button
     (click)="handleClick(product)"
     (touchstart)="handleTouchStart($event, product)"
     (touchmove)="handleTouchMove($event)"
     (touchend)="handleTouchEnd(product)"
     (touchcancel)="productLongPressEnd.emit(product)"
class="bg-white p-2 rounded-lg shadow border border-gray-100
                 hover:shadow-md hover:border-[#828f9a] transition-all
                 flex flex-col items-center justify-between text-center min-h-[100px]"
        >
          <div class="text-3xl mb-1 text-[#828f9a]">📦</div>
          <div class="flex-1 flex flex-col justify-center w-full">
            <span class="text-sm font-medium leading-tight text-gray-800 line-clamp-2">
              {{ product.label }}
            </span>
          </div>
          <span class="text-xs font-bold mt-2 text-[#171819]">
            {{ getPriceForProduct(product) | number:'1.2-2' }}€
          </span>
        </button>
      }
      @if (products?.length === 0) {

          <p class="col-span-full text-center text-gray-500 p-8">Keine Produkte gefunden.</p>

      }

    </div>
 `,
  styles: ['']
})
export class ProductGridComponent {
  @Input() products: Product[] | null = [];

  // Outputs: Events zurück an den Container
  @Output() productSelect = new EventEmitter<Product>();
  @Output() productLongPressStart = new EventEmitter<Product>();
  @Output() productLongPressEnd = new EventEmitter<Product>();

  private startX: number = 0;
  private startY: number = 0;
  private isScrollDetected: boolean = false;

  handleTouchStart(event: TouchEvent, product: Product): void {    
    this.isScrollDetected = false;
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    
    this.productLongPressStart.emit(product);
  }


  handleTouchMove(event: TouchEvent): void {
    if (this.isScrollDetected) return; 
    
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - this.startX);
    const dy = Math.abs(touch.clientY - this.startY);

    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      this.isScrollDetected = true;
    }
  }

  handleTouchEnd(product: Product): void {
    this.productLongPressEnd.emit(product);

    if (this.isScrollDetected) {
      this.isScrollDetected = false;
      return; 
    }

  }

  handleClick(product: Product): void {
    if (!this.isScrollDetected) {
      this.productSelect.emit(product);
    }
    this.isScrollDetected = false; // Zurücksetzen für das nächste Event
  }


  public getPriceForProduct(product: Product): number {
    const priceLevelKey = '2'; // Verwenden des gewünschten Preisniveaus
    return PriceUtils.getPriceForProduct(product, priceLevelKey);
  }
}