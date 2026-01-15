// src/app/features/kassa/kassa.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { ProductService } from '../../services/product/product.service';
import { CustomerService } from '../../services/customer/customer.service';
import { CartService } from '../../services/cart/cart.service';

// Models
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { CartItem } from '../../models/cart.model';
import { Discount } from '../../models/discount.model';

// Utils
import { PriceUtils } from '../../utils/price.utils';

// UI Components
import { CategoryNavigationComponent } from '../../components/category-navigation/category-navigation.component';
import { ProductGridComponent } from '../../components/product-grid/product-grid.component';
import { CartListComponent } from '../../components/cart/cart-list/cart-list.component';
import { ProductModalComponent, TempProduct } from '../../components/modals/product-modal/product-modal.component';

@Component({
  selector: 'app-kassa',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CategoryNavigationComponent, 
    ProductGridComponent, 
    CartListComponent, 
    ProductModalComponent
  ],
  templateUrl: './kassa.component.html',
  styleUrls: ['./kassa.component.css']
})
export class KassaComponent implements OnInit {
  
  // **********************************************
  // ** DEPENDENCY INJECTION **
  // **********************************************
  private productService = inject(ProductService);
  public cartService = inject(CartService); // Public für Zugriff im Template
  public customerService = inject(CustomerService);

  // **********************************************
  // ** LOKALER UI-STATE (SIGNALS) **
  // **********************************************
  public searchTerm = signal<string>('');
  public selectedCategoryId = signal<string | null>(null);
  public isCartExpanded = signal<boolean>(false);
  
  // Modal State Signals
  public productModal = signal<Product | null>(null);
  public editingIndex = signal<number | null>(null);
  
  // Helper State (Non-Signal, da mutable Objekt für Modal-Forms)
  public tempProduct: TempProduct = { quantity: 1, price: 0, discount: { value: 0, type: 'percent' } };
  public discountModal: { type: 'item' | 'global', index: number | null, value: number, discountType: 'percent' | 'euro' } | null = null;
  private longPressTimer: any = null;

  // **********************************************
  // ** SERVICE DATEN (SIGNALS) **
  // **********************************************
  // Wir greifen direkt auf die Signals im ProductService zu
  private products = this.productService.products; 
  private categories = this.productService.categories;

  // **********************************************
  // ** COMPUTED SIGNALS (LOGIK) **
  // **********************************************

  /**
   * Filtert Produkte basierend auf Kategorie-Auswahl und Suchbegriff.
   */
  public filteredProducts = computed(() => {
    let filtered = this.products();
    const catId = this.selectedCategoryId();
    const term = this.searchTerm().toLowerCase();

    // 1. Kategorie Filter (inkl. Unterkategorien)
    if (catId) {
      const targetCategoryIds = this.getAllSubCategoryIds(catId, this.categories());
      filtered = filtered.filter(p => 
        p.categories?.some(c => targetCategoryIds.includes(c.id))
      );
    }

    // 2. Suchbegriff Filter
    if (term) {
      filtered = filtered.filter(p => 
        p.label.toLowerCase().includes(term) || p.ref.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  /**
   * Berechnet den aktuellen Kategorie-Pfad (Breadcrumbs).
   */
  public categoryPath = computed(() => {
    const path: Array<{ id: string; name: string }> = [];
    let currentId = this.selectedCategoryId();
    const allCats = this.categories();

    while (currentId) {
      const cat = allCats.find(c => c.id === currentId);
      if (!cat) break;
      path.unshift({ id: cat.id, name: cat.label });
      currentId = cat.fk_parent ? String(cat.fk_parent) : null;
    }
    return path;
  });

  /**
   * Liefert die verfügbaren Unterkategorien für die aktuelle Ansicht.
   */
  public availableSubCategories = computed(() => {
    const selectedId = this.selectedCategoryId();
    return this.categories()
      .filter(c => {
        const parentId = c.fk_parent ? String(c.fk_parent) : null;
        // Wenn keine Kategorie gewählt: Zeige Root-Kategorien (parent ist null oder '0')
        if (selectedId === null) {
          return parentId === null || parentId === '0';
        }
        // Sonst: Zeige Kinder der gewählten Kategorie
        return parentId === selectedId;
      })
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  });

  // **********************************************
  // ** LIFECYCLE **
  // **********************************************

  ngOnInit() {
    // Initiale Daten laden
    this.productService.loadProducts();
    this.productService.loadCategories();
    this.customerService.loadCustomers();
  }

  // **********************************************
  // ** UI INTERAKTIONEN **
  // **********************************************

  /**
   * Klappt den Warenkorb auf oder zu.
   */
  toggleCart(): void {
    this.isCartExpanded.update(val => !val);
  }

  public navigateToCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
    this.searchTerm.set(''); // Suche zurücksetzen beim Navigieren
  }

  public navigateBack(): void {
    const currentId = this.selectedCategoryId();
    if (!currentId) return;
    
    // Parent ID finden
    const cat = this.categories().find(c => c.id === currentId);
    this.navigateToCategory(cat?.fk_parent ? String(cat.fk_parent) : null);
  }

  // Hilfsmethode für das Template, um Zeilensummen zu berechnen
  public calculateItemTotal = (item: CartItem): number => {
    return this.cartService.calculateItemTotal(item);
  };

  // **********************************************
  // ** WARENKORB & MODAL LOGIK **
  // **********************************************


  public removeFromCart(index: number): void {
    this.cartService.removeItem(index);
  }

  public updateItemQuantity(event: { index: number, quantity: number }): void {
    this.cartService.updateAmount(event.index, event.quantity);
  }

  /**
   * Öffnet das Bearbeiten-Modal für ein existierendes Warenkorb-Item.
   */
  public openEditModal(index: number): void {
    const item = this.cartService.items()[index];
    if (!item) return;

    this.editingIndex.set(index);
    this.productModal.set({ ...item } as Product); // Casten, da CartItem extends Product
    
    // Temp-State für das Formular initialisieren
    this.tempProduct = {
      quantity: item.quantity,
      price: item.price,
      discount: { ...item.discount }
    };
  }
public getPriceForProduct(product: Product): number {
    return PriceUtils.getPriceForProduct(product);
  }
  public addToCart(product: Product, quantity: number = 1, customPrice?: number, discount?: Discount): void {
    // 1. Preis exakt wie im Original ermitteln
    const price = customPrice ?? this.getPriceForProduct(product);

    // 2. Explizites Mapping aller Felder (WICHTIG für Invoice/Dolibarr)
    const item: CartItem = {
      id: product.id,
      label: product.label,
      quantity: quantity,
      price: price, // Der ermittelte Preis (Level 2 oder Custom)
      discount: discount ?? { value: 0, type: 'percent' },
      custom_price: customPrice !== undefined,
      originalPrice: this.getPriceForProduct(product), // Basispreis merken
      
      // Technische Felder für Backend/Transaktion
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

  /**
   * Modal-Logik korrigiert: Baut das Item lokal zusammen statt
   * add + update nacheinander aufzurufen.
   */
  public addProductFromModal(): void {
    const product = this.productModal();
    if (!product) return;
    if (this.editingIndex() !== null) {
      this.saveCartItemChanges();
      return;
    }
    const standardPrice = this.getPriceForProduct(product);
    const isCustomPrice = this.tempProduct.price !== standardPrice;

    this.addToCart(
      product, 
      this.tempProduct.quantity, 
      isCustomPrice ? this.tempProduct.price : undefined,
      this.tempProduct.discount
    );

    this.closeProductModal();
  }

  public saveCartItemChanges(): void {
    const index = this.editingIndex();
    if (index !== null) {
      this.cartService.updateItem(index, {
        quantity: this.tempProduct.quantity,
        price: this.tempProduct.price,
        discount: this.tempProduct.discount
      });
      this.closeProductModal();
    }
  }

  public deleteItemFromModal(): void {
    const index = this.editingIndex();
    if (index !== null) {
      this.cartService.removeItem(index);
      this.closeProductModal();
    }
  }

  public closeProductModal(): void {
    this.productModal.set(null);
    this.editingIndex.set(null);
  }

  public updateTempProduct(newValues: TempProduct): void {
    this.tempProduct = newValues;
  }

  // **********************************************
  // ** LONG PRESS LOGIK **
  // **********************************************

  handleLongPressStart(product: Product): void {
    this.longPressTimer = setTimeout(() => {
      const cartItem = this.cartService.findItemByProductId(product.id);
      
      if (cartItem) {
        // Item ist schon im Warenkorb -> Edit Mode
        const index = this.cartService.items().indexOf(cartItem);
        this.openEditModal(index);
      } else {
        // Neues Item -> Add Mode mit Modal
        this.editingIndex.set(null);
        this.productModal.set(product);
        this.tempProduct = {
          quantity: 1,
          price: PriceUtils.getPriceForProduct(product),
          discount: { value: 0, type: 'percent' }
        };
      }
    }, 500);
  }

  handleLongPressEnd(product: Product): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      // Nur wenn das Modal noch NICHT offen ist, war es ein kurzer Klick -> Add to Cart
      if (!this.productModal()) {
        this.addToCart(product);
      }
    }
  }

  // **********************************************
  // ** RABATT MODAL LOGIK **
  // **********************************************

  public openDiscountModalFromCart(event: { type: 'item' | 'global', index?: number }): void {
    this.openDiscountModal(event.type, event.index);
  }

  public openDiscountModal(type: 'item' | 'global', index?: number | null): void {
    let currentDiscount: Discount;

    if (type === 'global') {
      currentDiscount = this.cartService.globalDiscount();
      index = null;
    } else {
      if (typeof index !== 'number') return;
      currentDiscount = this.cartService.items()[index]?.discount || { value: 0, type: 'percent' };
    }

    this.discountModal = {
      type: type,
      index: index ?? null,
      value: currentDiscount.value,
      discountType: currentDiscount.type
    };
  }

  public applyDiscount(): void {
    if (!this.discountModal) return;

    const discount: Discount = {
      value: this.discountModal.value,
      type: this.discountModal.discountType
    };

    if (this.discountModal.type === 'global') {
      this.cartService.setGlobalDiscount(discount);
    } else if (this.discountModal.type === 'item' && this.discountModal.index !== null) {
      this.cartService.updateItem(this.discountModal.index, { discount: discount });
    }
    
    this.discountModal = null;
  }

  // **********************************************
  // ** HELPER **
  // **********************************************

  private getAllSubCategoryIds(categoryId: string, allCategories: Category[]): string[] {
    let ids = [categoryId];
    // String Konvertierung für sicheren Vergleich
    const children = allCategories.filter(c => c.fk_parent && String(c.fk_parent) === categoryId);
    
    for (const child of children) {
      ids = [...ids, ...this.getAllSubCategoryIds(child.id, allCategories)];
    }
    return ids;
  }
}