// src/app/components/cart/cart-list/cart-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../../models/cart.model';
import { PriceUtils } from '../../../utils/price.utils';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
      @for (item of items; track $index) {
        <div
        (touchstart)="handleTouchStart($event, $index)" 
            (touchend)="handleTouchEnd($event, $index)"
            (touchcancel)="startX = 0"
             class="bg-white p-3 rounded-lg shadow flex justify-between items-center text-sm">
          <div class="flex-1">
            <div class="font-medium">{{ item.label }}</div>
            <div class="text-gray-500">{{ item.quantity }} x {{ item.price | number:'1.2-2' }}€</div>
            @if (item.discount && item.discount.value > 0) {
    <div class="text-red-500 text-xs italic">
      Rabatt: {{ item.discount.value }}{{ item.discount.type === 'percent' ? '%' : '€' }}
    </div>
  }
          </div>
          <div class="text-right font-bold mr-3">{{ calculateItemTotal(item) | number:'1.2-2' }}€</div>
          
          <div class="flex items-center space-x-1">
            </div>
        </div>
      }
    </div>
    
    `,
  styles: ['']
})
export class CartListComponent {
  @Input() items: CartItem[] | null = [];
  @Input() subtotal: number = 0;
  @Input() globalDiscountAmount: number = 0;
  @Input() cartTotal: number = 0;

  @Input() calculateItemTotal: (item: CartItem) => number = () => 0;

  @Output() removeItem = new EventEmitter<number>();
  @Output() openDiscountModal = new EventEmitter<{ type: 'item' | 'global', index?: number }>();
  @Output() itemQuantityChange = new EventEmitter<{ index: number, quantity: number }>();
  @Output() itemLongPress = new EventEmitter<number>();

  public PriceUtils = PriceUtils;

  // Swipe-Logik Variablen
  public startX: number = 0;
  private swipeThreshold: number = 80; // Notwendige Pixel-Distanz für eine gültige Geste
  private longPressTimer: any;
  private islongPress: boolean = false;

  handleTouchStart(event: TouchEvent, index: number) {
    // Startposition der Geste speichern
    this.startX = event.touches[0].clientX;
    this.islongPress = false;

    // Long-Press Timer starten
    this.longPressTimer = setTimeout(() => {
      this.islongPress = true;
      this.itemLongPress.emit(index)
    }, 500);
  }

  handleTouchEnd(event: TouchEvent, index: number) {
    clearTimeout(this.longPressTimer);

    // Wenn es ein Long-Press war, keine Swipe-Logik ausführen
    if (this.islongPress) {
      this.startX = 0;
      return;
    }
    if (this.startX === 0) return;

    const endX = event.changedTouches[0].clientX;
    const diffX = endX - this.startX;

    if (Math.abs(diffX) > this.swipeThreshold) {
      if (diffX > 0) {
        // Swipe nach rechts: Menge erhöhen
        this.itemQuantityChange.emit({ index: index, quantity: 1 });
      } else {
        // Swipe nach links: Menge reduzieren
        this.itemQuantityChange.emit({ index: index, quantity: -1 });
      }
    }

    // Zustand zurücksetzen
    this.startX = 0;
  }
}