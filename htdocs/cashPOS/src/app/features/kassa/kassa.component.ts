import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable, startWith, debounceTime, distinctUntilChanged, take } from 'rxjs';

// Services
import { ProductService } from '../../services/product/product.service';
import { CustomerService } from '../../services/customer/customer.service';
import { CartService } from '../../services/cart/cart.service';

// Models
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { CartItem } from '../../models/cart.model';
import { Discount } from '../../models/discount.model';

// Utilities
import { PriceUtils } from '../../utils/price.utils';

// UI Components
import { CategoryNavigationComponent } from '../../components/category-navigation/category-navigation.component';
import { ProductGridComponent } from '../../components/product-grid/product-grid.component';
import { CartListComponent } from '../../components/cart/cart-list/cart-list.component';
import { ProductModalComponent, TempProduct } from '../../components/modals/product-modal/product-modal.component';

@Component({
  selector: 'app-kassa',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, CategoryNavigationComponent, ProductGridComponent, CartListComponent, ProductModalComponent],
  templateUrl: './kassa.component.html',
  styleUrls: ['./kassa.component.css']
})
export class KassaComponent implements OnInit {
  editingIndex: number | null = null; 

  private _searchTermSubject = new BehaviorSubject<string>('');
  private _selectedCategorySubject = new BehaviorSubject<string | null>(null);

  private readonly allCategories$: Observable<Category[]>;

  public readonly filteredProducts$: Observable<Product[]>;
  public readonly categoryPath$: Observable<Array<{ id: string; name: string }>>;
  public readonly availableSubCategories$: Observable<Category[]>; 

  public readonly cartItems$: Observable<CartItem[]>;
  public readonly subtotal$: Observable<number>;
  public readonly globalDiscountAmount$: Observable<number>;
  public readonly cartTotal$: Observable<number>;

  isCartExpanded: boolean = false;

  get searchTerm(): string { return this._searchTermSubject.getValue(); }
  set searchTerm(value: string) { this._searchTermSubject.next(value); }

  get selectedCategory(): string | null { return this._selectedCategorySubject.getValue(); }

  // Modals
  productModal: Product | null = null;
  tempProduct: TempProduct = { quantity: 1, price: 0, discount: { value: 0, type: 'percent' } }; // Vorübergehende Speicherung für Modal
  discountModal: { type: 'item' | 'global', index: number | null, value: number, discountType: 'percent' | 'euro' } | null = null;
  longPressTimer: number | null = null;
  openEditModal(index: number): void {
    const item = this.cartService.getItems()[index];
    if (!item) return;
    this.editingIndex = null;
    this.editingIndex = index;
    this.productModal = { ...item } as any;
    this.tempProduct = {
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || { value: 0, type: 'percent' } // Rabatt hinzufügen
    };
  }

  // Diese Methode wird aufgerufen, wenn im Modal "Speichern" gedrückt wird
  saveCartItemChanges(): void {
    if (this.editingIndex !== null) {
      this.cartService.updateItem(this.editingIndex, {
        quantity: this.tempProduct.quantity,
        price: this.tempProduct.price,
        discount: (this.tempProduct as any).discount // Falls Interface erweitert
      });
      this.closeProductModal();
    }
  }

  deleteItemFromModal(): void {
    if (this.editingIndex !== null) {
      this.cartService.removeItem(this.editingIndex);
      this.closeProductModal();
    }
  }
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private customerService: CustomerService
  ) {

    this.allCategories$ = this.productService.categories$;

    // 1. Warenkorb-Observables (Delegation an CartService)
    this.cartItems$ = this.cartService.cartItems$;
    this.subtotal$ = this.cartService.subtotal$;
    this.globalDiscountAmount$ = this.cartService.globalDiscountAmount$;
    this.cartTotal$ = this.cartService.cartTotal$;

    // 2. Produktfilter-Observables
    this.filteredProducts$ = combineLatest([
      this.productService.products$,
      this._searchTermSubject.pipe(debounceTime(300), distinctUntilChanged(), startWith(this.searchTerm)),
      this._selectedCategorySubject.pipe(startWith(this.selectedCategory)),
      this.allCategories$
    ]).pipe(
      map(([products, term, categoryId, categories]) => this.getFilteredProducts(categories, products, term, categoryId))
    );

    // 3. Kategoriepfad-Observable
    this.categoryPath$ = combineLatest([
      this.allCategories$, // Verwendet das korrekte, initialisierte Observable
      this._selectedCategorySubject.pipe(startWith(this.selectedCategory))
    ]).pipe(
      map(([categories, currentId]) => this.buildCategoryPath(categories, currentId))
    );

    // 4. Verfügbare Unterkategorien für die Navigation
    this.availableSubCategories$ = combineLatest([
      this.allCategories$, // Verwendet das korrekte, initialisierte Observable
      this._selectedCategorySubject.asObservable()
    ]).pipe(
      map(([categories, selectedId]) => {
        const subCategories = categories.filter(c => {
          // Verwenden von String(c.fk_parent) für konsistente ID-Vergleiche
          const parentId = c.fk_parent ? String(c.fk_parent) : null;

          // Root level: fk_parent muss null oder '0' sein
          if (selectedId === null) {
            return parentId === null || parentId === '0';
          }

          // Sub-level: fk_parent muss selectedId entsprechen
          return parentId === selectedId;
        });

        // Sortiert nach Label (Dolibarr-Feldname)
        return subCategories.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      })
    );
  }

  ngOnInit() {
    this.productService.loadProducts();
    this.productService.loadCategories();
  }

  // **********************************************
  // ** PREIS-UTILITY **
  // **********************************************

  public getPriceForProduct(product: Product): number {
    const priceLevelKey = '2';
    return PriceUtils.getPriceForProduct(product, priceLevelKey);
  }

  // **********************************************
  // ** KATEGORIE-LOGIK **
  // **********************************************

  public navigateToCategory(categoryId: string | null): void {
    this._selectedCategorySubject.next(categoryId);
    this.searchTerm = '';
    this._searchTermSubject.next(''); // Suchbegriff zurücksetzen
  }

  toggleCart(): void {
    this.isCartExpanded = !this.isCartExpanded;
  }

  public navigateBack(): void {
    const currentId = this._selectedCategorySubject.getValue();
    if (!currentId) return;

    this.allCategories$.pipe(
      map(categories => {
        const currentCategory = categories.find(c => c.id === currentId);
        return currentCategory?.fk_parent ? String(currentCategory.fk_parent) : null;
      }),
      take(1)
    ).subscribe(parentId => {
      this.navigateToCategory(parentId);
    });
  }

  private buildCategoryPath(categories: Category[], currentCategoryId: string | null): Array<{ id: string; name: string }> {
    const path: Array<{ id: string; name: string }> = [];
    let currentId: string | null = currentCategoryId;

    while (currentId !== null) {
      const category = categories.find(cat => cat.id === currentId);
      if (category) {
        path.unshift({ id: category.id, name: category.label });
        currentId = String(category.fk_parent) || null;
      } else {
        break;
      }
    }
    return path;
  }

  private getAllSubCategoryIds(categoryId: string, allCategories: Category[]): string[] {
    let ids = [categoryId];
    const children = allCategories.filter(c => c.fk_parent !== undefined &&
      c.fk_parent !== null &&
      c.fk_parent.toString() === categoryId);
    for (const child of children) {
      ids = [...ids, ...this.getAllSubCategoryIds(child.id, allCategories)];
    }
    return ids;
  }
  private getFilteredProducts(categories: Category[], products: Product[], searchTerm: string, categoryId: string | null): Product[] {
    let filtered = products;

    if (categoryId) {
      const targetCategoryIds = this.getAllSubCategoryIds(categoryId, categories);
      filtered = filtered.filter(p =>
        p.categories?.some(c => targetCategoryIds.includes(c.id))
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.label.toLowerCase().includes(term) || p.ref.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  // **********************************************
  // ** WARENKORB-AKTIONEN **
  // **********************************************

  addToCart(product: Product, quantity: number = 1, customPrice?: number, discount?: Discount): void {
    const price = customPrice ?? this.getPriceForProduct(product);
    const item: CartItem = {
      id: product.id,
      label: product.label,
      quantity: quantity,
      price: customPrice || price,
      discount: discount ?? { value: 0, type: 'percent' }, 
      custom_price: customPrice !== undefined,
      originalPrice: price,
      description: product.description,
      ref: product.ref,
      price_ttc: product.price_ttc,
      tva_tx: product.tva_tx,
      price_base_type: product.price_base_type,
      status: product.status,
      type: product.type,
      stock_reel: product.stock_reel,
      fk_default_bom: product.fk_default_bom,
      date_update: product.date_update
    };
    this.cartService.addItemFromGrid(item);
  }

  addProductFromModal(): void {
    if (this.productModal) {
      // Wenn wir einen bestehenden Artikel bearbeiten (aus Langdruck auf bestehendem Artikel)
      if (this.editingIndex !== null && this.editingIndex >= 0) {
        this.saveCartItemChanges();
        return;
      }

      // Ansonsten fügen wir einen neuen Artikel hinzu
      const cartItem: CartItem = {
        id: this.productModal.id,
        label: this.productModal.label,
        quantity: this.tempProduct.quantity,
        price: this.tempProduct.price,
        discount: this.tempProduct.discount ?? { value: 0, type: 'percent' },
        custom_price: this.tempProduct.price !== this.getPriceForProduct(this.productModal),
        originalPrice: this.getPriceForProduct(this.productModal),
        description: this.productModal.description,
        ref: this.productModal.ref,
        price_ttc: this.productModal.price_ttc,
        tva_tx: this.productModal.tva_tx,
        price_base_type: this.productModal.price_base_type,
        status: this.productModal.status,
        type: this.productModal.type,
        stock_reel: this.productModal.stock_reel,
        fk_default_bom: this.productModal.fk_default_bom,
        date_update: this.productModal.date_update
      };
      this.cartService.addItem(cartItem, true);
      this.closeProductModal();
    }
  }

  removeFromCart(index: number): void {
    this.cartService.removeItem(index);
  }

  updateItemQuantity(event: { index: number, quantity: number }): void {
    this.cartService.updateAmount(event.index, event.quantity);
  }

  updateItemPrice(event: { index: number, price: number }): void {
    this.cartService.updateItem(event.index, {
      price: event.price,
      custom_price: true
    });
  }

  updateItemDiscount(event: { index: number, discount: Discount }): void {
    this.cartService.setItemDiscount(event.index, event.discount);
  }


  public calculateItemTotal = (item: CartItem): number => {
    return this.cartService.calculateItemTotal(item);
  };

  updateTempProduct(newValues: TempProduct): void {
    this.tempProduct = {
      quantity: newValues.quantity,
      price: newValues.price,
      discount: newValues.discount ? newValues.discount : {
        value: 0, type: 'percent'
      }
    }
  }
  // **********************************************
  // ** LONG-PRESS / MODAL LOGIK **
  // **********************************************

  handleLongPressStart(product: Product): void {
    this.longPressTimer = window.setTimeout(() => {
      this.productModal = product;
      
      // Prüfe, ob das Produkt bereits im Warenkorb ist
      const cartItem = this.cartService.findItemByProductId(product.id);
      
      if (cartItem) {
        // Produkt ist im Warenkorb: Lade Daten aus dem CartItem
        this.editingIndex = this.cartService.getItems().indexOf(cartItem);
        this.tempProduct = {
          quantity: cartItem.quantity,
          price: cartItem.price,
          discount: cartItem.discount || { value: 0, type: 'percent' }
        };
      } else {
        // Produkt ist nicht im Warenkorb: Verwende Standardwerte
        this.editingIndex = null;
        this.tempProduct = {
          quantity: 1,
          price: this.getPriceForProduct(product),
          discount: { value: 0, type: 'percent' }
        };
      }
    }, 500);
  }

  handleLongPressEnd(product: Product): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      if (!this.productModal) {
        this.addToCart(product);
      }
    }
  }

  closeProductModal(): void {
    this.productModal = null;
  }


  // **********************************************
  // ** RABATT-LOGIK **
  // **********************************************

  openDiscountModalFromCart(event: { type: 'item' | 'global', index?: number }): void {
    this.openDiscountModal(event.type, event.index);
  }

  openDiscountModal(type: 'item' | 'global', index?: number | null): void {
    let currentDiscount: Discount;

    if (type === 'global') {
      currentDiscount = this.cartService.getGlobalDiscount();
      index = null;
    } else {
      if (typeof index !== 'number' || index === null) {
        console.error("Rabatt kann nicht für 'item' ohne Index geöffnet werden.");
        return;
      }
      currentDiscount = this.cartService.getItems()[index]?.discount || { value: 0, type: 'percent' };
    }

    this.discountModal = {
      type: type,
      index: index,
      value: currentDiscount.value,
      discountType: currentDiscount.type
    };
  }

  applyDiscount(): void {
    if (!this.discountModal) return;

    const discount: Discount = {
      value: this.discountModal.value,
      type: this.discountModal.discountType
    };

    if (this.discountModal.type === 'global') {
      this.cartService.setGlobalDiscount(discount);
    } else if (this.discountModal.type === 'item' && this.discountModal.index !== null) {
      this.cartService.setItemDiscount(this.discountModal.index, discount);
    }
    this.discountModal = null;
  }

}