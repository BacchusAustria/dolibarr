// src/app/utils/price.utils.ts
import { Product } from '../models/product.model';

export class PriceUtils {
  /**
   * Statische Definition des Preis-Levels für die Registrierkasse.
   */
  private static readonly DEFAULT_PRICE_LEVEL = '2';

  /**
   * Ermittelt den Bruttopreis (TTC) für ein Produkt basierend auf dem Kassen-Preislevel.
   * @param product Das Produkt-Objekt aus Dolibarr
   * @returns Der Preis als gerundeter Number-Wert
   */
  static getPriceForProduct(product: Product): number {
    let price: number | string | undefined;

    // 1. Versuch: Preis aus dem Multiprice-Array (TTC = Brutto)
    if (product.multiprices_ttc && product.multiprices_ttc[this.DEFAULT_PRICE_LEVEL] !== undefined) {
      price = product.multiprices_ttc[this.DEFAULT_PRICE_LEVEL];
    } 
    // 2. Versuch: Fallback auf Standard-Bruttopreis
    else if (product.price_ttc !== undefined) {
      price = product.price_ttc;
    }
    // 3. Versuch: Fallback auf Basispreis
    else {
      price = product.price || 0;
    }

    return this.roundPrice(Number(price));
  }

  /**
   * Hilfsmethode zur kaufmännischen Rundung auf 2 Dezimalstellen.
   * Verhindert Floating-Point Fehler wie 1.005 -> 1.00
   */
  static roundPrice(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Berechnet die Gesamtsumme einer Position (Menge * Preis)
   */
  static calculateLineTotal(quantity: number, price: number): number {
    return this.roundPrice(quantity * price);
  }
}