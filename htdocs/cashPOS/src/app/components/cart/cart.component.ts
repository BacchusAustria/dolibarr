// src/app/components/cart/cart.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  // Modernes Inject-Pattern
  public cart = inject(CartService);

  // trackBy für Performance (optional bei @for, da track dort Pflicht ist)
  trackById(index: number, item: any) {
    return item?.id ?? index;
  }
}