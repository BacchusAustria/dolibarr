export class CalculationUtils {
  /**
   * Calculate discount amount based on type
   */
  static calculateDiscount(
    amount: number,
    discountValue: number,
    discountType: 'percent' | 'euro'
  ): number {
    if (discountType === 'percent') {
      return amount * (discountValue / 100);
    }
    return discountValue;
  }

  /**
   * Calculate item total with discount
   */
  static calculateItemTotal(
    price: number,
    quantity: number,
    discountValue: number,
    discountType: 'percent' | 'euro'
  ): number {
    let total = price * quantity;
    const discount = this.calculateDiscount(total, discountValue, discountType);
    return Math.max(0, total - discount);
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }

  /**
   * Format currency
   */
  static formatCurrency(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
  }

  /**
   * Round to 2 decimals
   */
  static roundToDecimals(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
