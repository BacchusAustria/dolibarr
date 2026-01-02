import { Component } from '@angular/core';
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
  constructor(public cart: CartService) {}

  trackById(index: number, item: any) {
    return item?.id ?? index;
  }
}
