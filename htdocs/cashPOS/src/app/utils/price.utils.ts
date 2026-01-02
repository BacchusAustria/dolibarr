// src/app/utils/price.utils.ts (Neu)
import { Product } from '../models/product.model';

export class PriceUtils {
    /**
     * Ermittelt den Bruttopreis (TTC) für den angegebenen Preis-Level.
     */
    static getPriceForProduct(product: Product, priceLevelKey: string): number {
        if (product.multiprices_ttc) {
            const priceString = product.multiprices_ttc[priceLevelKey];
            if (priceString !== undefined && priceString !== null) {
                return priceString;
            }
        }
        return product.price || 0;
    }
}