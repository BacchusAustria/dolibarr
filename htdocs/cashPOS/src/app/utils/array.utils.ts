export class ArrayUtils {
  /**
   * Filter array by multiple conditions
   */
  static filterByConditions<T>(
    items: T[],
    conditions: ((item: T) => boolean)[]
  ): T[] {
    return items.filter(item => conditions.every(condition => condition(item)));
  }

  /**
   * Group array by property
   */
  static groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  /**
   * Find item and return index
   */
  static findIndex<T>(items: T[], predicate: (item: T) => boolean): number {
    return items.findIndex(predicate);
  }

  /**
   * Remove item from array
   */
  static remove<T>(items: T[], index: number): T[] {
    return items.filter((_, i) => i !== index);
  }
}
