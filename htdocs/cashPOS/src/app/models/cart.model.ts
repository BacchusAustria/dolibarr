import { Product } from './product.model';
import { Discount } from './discount.model';

export interface CartItem extends Product {
  quantity: number;
  originalPrice: number;
  custom_price: boolean;
  discount: Discount;
}
