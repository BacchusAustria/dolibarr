// src/app/app.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { ProductService } from './services/product/product.service';
import { CustomerService } from './services/customer/customer.service';
import { CartService } from './services/cart/cart.service';
import { Product } from './models/product.model';
import { Category } from './models/category.model';
import { CartItem } from './models/cart.model';
import { Customer } from './models/customer.model';
import { Discount } from './models/discount.model';
import { MOCK_DATA } from './constants/app.constants';
import { CalculationUtils } from './utils/calculation.utils';
import { KassaComponent } from "./features/kassa/kassa.component";
import { CustomerSelectionComponent } from "./features/customer/customer-selection.component";
import { PaymentComponent } from "./features/payment/payment.component";
import { HeaderComponent } from "./components/header/header.component";
import { LoginComponent } from "./features/login/login.component";
import { InvoiceService } from './services/invoice/invoice.service';
import { DeliveryService } from './services/delivery/delivery.service';
import { InvoiceHistoryComponent } from './features/history/invoice-history.component';
import { DocumentService } from './services/documents/document.service';
import { PrintService } from './services/print/print.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, KassaComponent, CustomerSelectionComponent, PaymentComponent, HeaderComponent, LoginComponent, InvoiceHistoryComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App implements OnInit, OnDestroy {

  public readonly selectedCustomer$: Observable<Customer | null>;
  public readonly cartItems$: Observable<CartItem[]>;
  public readonly cartTotal$: Observable<number>;
  

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private customerService: CustomerService,
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private DocumentService: DocumentService,
    private printService: PrintService,
  ) {
    // Initialisierung der Observables MUSS im Constructor erfolgen
    this.selectedCustomer$ = this.customerService.selectedCustomer$;
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;
  }

  // View states
  currentView: 'main' | 'customer' | 'payment' | 'history' = 'main';

  // Category navigation
  selectedCategory: string | null = null;
  categoryPath: Array<{ id: string; name: string }> = [];

  // Search
  searchTerm = '';
  customerSearchTerm = '';

  // Modals
  productModal: Product | null = null;
  tempProduct = { quantity: 1, price: 0 };

  discountModal: {
    type: 'item' | 'global';
    index: number | null;
    value: number;
    discountType: 'percent' | 'euro';
  } | null = null;

  // Payment
  paymentAmount = '';
  printReceipt = true;
  selectedPaymentType: 'cash' | 'delivery' | 'invoice' = 'cash'; // <<-- NEU: Property für Payment-Binding

  // Timers
  longPressTimer: number | null = null;
  logoutTimer: number | null = null;

  // Auth
  apiKey = '';
  username = '';
  password = '';

  // Customer
  selectedCustomer: Customer | null = null; // Kann entfernt werden, wenn nur noch selectedCustomer$ genutzt wird

  // Cart (delegated to CartService)
  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  get globalDiscount(): Discount {
    return this.cartService.getGlobalDiscount();
  }

  set globalDiscount(value: Discount) {
    this.cartService.setGlobalDiscount(value);
  }

  // Data
  customerList: Customer[] = [];
  categoryList: Category[] = [];
  productList: Product[] = [];
  dataLoading = false;
  dataError = false;
  defaultCustomer: Customer | null = null;

  ngOnInit() {
    this.apiKey = localStorage.getItem('dolibarrApiKey') || '';
    if (this.apiKey) {
      this.loadDolibarrData();
    } else {
      // Use mock data for demo
      // this.categoryList = MOCK_DATA.CATEGORIES;
      // this.productList = MOCK_DATA.PRODUCTS;
      // this.defaultCustomer = MOCK_DATA.DEFAULT_CUSTOMER;
      this.selectedCustomer = this.defaultCustomer;
    }
  }

  ngOnDestroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
  }

  openHistory() {
    this.currentView = 'history';
  }
  closeHistory() {
    this.currentView = 'main';
  }
  // Data loading
  async loadDolibarrData() {
    this.dataLoading = true;
    try {
      // Load from API

      this.categoryList = await this.productService.getCategories();
      this.productList = await this.productService.getProductsWithCategories();
      this.customerService.loadCustomers().catch(err =>
        console.error('Fehler beim Laden der Kunden:', err)
      );


      this.defaultCustomer = this.customerService.getSelectedCustomer();

      if (!this.selectedCustomer) {
        this.selectedCustomer = this.defaultCustomer;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.dataError = true;
      // Fallback to mock data
      // this.categoryList = MOCK_DATA.CATEGORIES;
      // this.productList = MOCK_DATA.PRODUCTS;
      this.defaultCustomer = MOCK_DATA.DEFAULT_CUSTOMER;
    } finally {
      this.dataLoading = false;
    }
  }

  //Authentication
  async login() {
    try {
      const token = await this.authService.login(this.username, this.password);
      localStorage.setItem('dolibarrApiKey', token);
      this.apiKey = token;
      await this.loadDolibarrData();
      console.log('Login erfolgreich');
    } catch (error: any) {
      console.error(error);
      alert('Login fehlgeschlagen: ' + error.message);
    }
  }

  handleLogoutStart() {
    this.logoutTimer = window.setTimeout(() => {
      if (confirm('Möchten Sie sich wirklich abmelden?')) {
        this.authService.logout();
        this.apiKey = '';
        this.selectedCustomer = this.defaultCustomer;
        this.resetCart();
      }
      this.logoutTimer = null;
    }, 1000);
  }

  handleLogoutEnd() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  // **********************************************
  // ** NEUE METHODEN ZUR BEHEBUNG DER TEMPLATE-FEHLER **
  // **********************************************

  /**
   * Schließt die Kundenauswahl und kehrt zur Hauptansicht zurück.
   */
  closeCustomerSelection() {
    this.currentView = 'main';
  }

  /**
   * Handler für die Kundenauswahl aus der CustomerSelectionComponent.
   * Setzt den ausgewählten Kunden im globalen CustomerService.
   */
  handleSaleCustomer(customer: Customer): void {
    this.customerService.setSelectedCustomer(customer);
  }

  /**
   * Schließt die Zahlungsansicht und kehrt zur Hauptansicht zurück.
   */
  closePaymentSelection() {
    this.currentView = 'main';
  }

  /**
   * Aktualisiert den Betrag, der vom Kunden gezahlt wurde.
   */
  updatePaymentAmount(amount: string) {
    this.paymentAmount = amount;
  }

  /**
   * Aktualisiert die ausgewählte Zahlungsart.
   */
  updatePaymentType(type: 'cash' | 'delivery' | 'invoice') {
    this.selectedPaymentType = type;
  }

  // **********************************************
  // ** BESTEHENDE METHODEN **
  // **********************************************

  // Category navigation
  navigateToCategory(categoryId: string | null) {
    if (categoryId === null) {
      this.selectedCategory = null;
      this.categoryPath = [];
    } else {
      const category = this.categoryList.find(cat => cat.id === categoryId);
      if (category) {
        this.selectedCategory = categoryId;

        // Build path from root to selected category
        this.categoryPath = this.buildCategoryPath(categoryId);
      }
    }
  }

  getPriceForProduct(product: Product): number {
    return product.multiprices_ttc?.['0'] || product.price;
  }
  buildCategoryPath(categoryId: string): Array<{ id: string; name: string }> {
    const path: Array<{ id: string; name: string }> = [];
    let currentId: string | null = categoryId;

    while (currentId !== null) {
      const category = this.categoryList.find(cat => cat.id === currentId);
      if (category) {
        path.unshift({ id: category.id, name: category.label });
        currentId = String(category.fk_parent) || null;
      } else {
        break;
      }
    }

    return path;
  }

  navigateBack() {
    if (this.categoryPath.length > 1) {
      this.categoryPath = this.categoryPath.slice(0, -1);
      this.selectedCategory = this.categoryPath[this.categoryPath.length - 1].id;
    } else {
      this.categoryPath = [];
      this.selectedCategory = null;
    }
  }

  getMainCategories(): Category[] {
    return this.categoryList.filter(cat => !cat.fk_parent);
  }

  getSubcategories(parentId: string): Category[] {
    let cats = this.categoryList.filter(cat => String(cat.fk_parent) === parentId);
    return cats;
  }

  getCurrentCategories(): Category[] {
    if (this.selectedCategory === null) {
      return this.getMainCategories();
    } else {
      let subcats = this.getSubcategories(this.selectedCategory);
      return subcats;
    }
  }

  getAllSubcategoryIds(categoryId: string): string[] {
    const ids = [categoryId];
    const subcats = this.getSubcategories(categoryId);
    subcats.forEach(subcat => {
      ids.push(...this.getAllSubcategoryIds(subcat.id));
    });
    return ids;
  }

  get filteredProducts(): Product[] {
    return this.productList.filter(product => {
      const matchesSearch = product.label.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  // Product handling
  handleTouchStart(product: Product) {
    this.longPressTimer = window.setTimeout(() => {
      this.productModal = product;
      this.tempProduct = { quantity: 1, price: this.getPriceForProduct(product) };
    }, 500);
  }

  handleTouchEnd() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  addToCart(product: Product, quantity: number = 1, customPrice?: number) {
    const item: CartItem = {
      ...product,
      quantity,
      originalPrice: this.getPriceForProduct(product),
      price: customPrice ?? this.getPriceForProduct(product),
      discount: { value: 0, type: 'percent' }
    } as CartItem;

    this.cartService.addItemFromGrid(item);
  }

  addProductFromModal() {
    if (this.productModal) {
      this.addToCart(this.productModal, this.tempProduct.quantity, this.tempProduct.price);
      this.productModal = null;
      this.tempProduct = { quantity: 1, price: 0 };
    }
  }

  updateCartItem(index: number, field: 'quantity' | 'price', value: number) {
    this.cartService.updateItem(index, { [field]: value });
  }

  removeFromCart(index: number) {
    this.cartService.removeItem(index);
  }

  // Discount handling
  openDiscountModal(type: 'item' | 'global', index: number | null = null) {
    let initialValue = 0;
    let initialDiscountType: 'percent' | 'euro' = 'percent';

    if (type === 'item' && index !== null) {
      const item = this.cartService.getItems()[index];
      if (item?.discount) {
        initialValue = item.discount.value;
        initialDiscountType = item.discount.type;
      }
    } else if (type === 'global') {
      const gd = this.cartService.getGlobalDiscount();
      initialValue = gd.value;
      initialDiscountType = gd.type;
    }

    this.discountModal = { type, index, value: initialValue, discountType: initialDiscountType };
  }

  applyDiscount() {
    if (!this.discountModal) return;

    if (this.discountModal.type === 'item' && this.discountModal.index !== null) {
      this.applyItemDiscount(
        this.discountModal.index,
        this.discountModal.value,
        this.discountModal.discountType
      );
    } else {
      this.cartService.setGlobalDiscount({ value: this.discountModal.value, type: this.discountModal.discountType });
    }
    this.discountModal = null;
  }

  applyItemDiscount(index: number, value: number, type: 'percent' | 'euro') {
    const items = this.cartService.getItems().slice();
    if (!items[index]) return;
    items[index].discount = { value, type };
    this.cartService.setItemDiscount(index, { value, type });
  }

  // Calculations
  calculateItemTotal(item: CartItem): number {
    return this.cartService.calculateItemTotal(item);
  }

  get subtotal(): number {
    return this.cartService.getCartTotal();
  }

  get globalDiscountAmount(): Discount {
    return this.cartService.getGlobalDiscount();
  }

  get cartTotal(): number {
    return this.cartService.getCartTotal();
  }

  resetCart() {
    this.cartService.resetCart();
    this.paymentAmount = '';
  }


  // Transaction
  async completeTransaction() {
    // 1. Validierung
    const items = this.cartService.getItems();
    if (items.length === 0) {
      alert('Warenkorb ist leer!');
      return false;
    }

    const customer = this.customerService.getSelectedCustomer();
    if (!customer || !customer.id) {
      alert('Kein Kunde ausgewählt! Bitte wählen Sie einen Kunden.');
      return false;
    }

    // Für Lieferscheine sollte es meist nicht der anonyme "Barverkaufs-Kunde" sein
    if (this.selectedPaymentType === 'delivery' && customer.name === 'AbHof Kunde') {
      if (!confirm('Möchten Sie wirklich einen Lieferschein für den anonymen Kunden erstellen?')) {
        return false;
      }
    }

    const paidAmount = parseFloat(this.paymentAmount) || 0;

    this.dataLoading = true; // Ladeindikator an

    try {
      console.log(`Starte Transaktion. Modus: ${this.selectedPaymentType}, Zahlung: ${this.selectedPaymentType}`);

      let docId = '';

      if (this.selectedPaymentType === 'delivery') {
        // --- FALL A: LIEFERSCHEIN ---
        // Hier nutzen wir unseren neuen "Full-Process" Service
        docId = await this.deliveryService.createFullDeliveryProcess(customer.id, items);
        alert(`Lieferschein erfolgreich erstellt! ID: ${docId}`);

      } else {
        // --- FALL B: RECHNUNG ---

        // 1. Entwurf
        docId = await this.invoiceService.createDraft(customer.id);

        // 2. Zeilen hinzufügen
        for (const item of items) {
          await this.invoiceService.addLine(docId, item);
        }

        // 3. Validieren
        await this.invoiceService.validate(docId);

        // 4. Zahlung erfassen (Nur wenn nicht "Auf Rechnung" gewählt wurde)
        if (this.selectedPaymentType !== 'invoice') {
          await this.invoiceService.addPayment(docId, paidAmount, this.selectedPaymentType);
        }


        if (this.selectedPaymentType === 'cash' && this.printReceipt) {
          //Rechnung abholen damit die Daten verwendet werden können
          const invoice = await this.invoiceService.getInvoiceById(docId);
          const base64Receipt = await this.printService.generateAndUploadReceipt(docId, invoice.ref, items, this.cartTotal, customer.name);

          await this.DocumentService.uploadFile('invoice', invoice.ref, base64Receipt, `Kassenbeleg_${invoice.ref}.pdf`);;

        }
        const changeAmount = paidAmount - this.cartTotal;
        const changeText = changeAmount > 0 ? `\nWechselgeld: ${changeAmount.toFixed(2)}€` : '';



        alert(`Rechnung erfolgreich!${changeText}`);
      }

      // Abschluss: Warenkorb leeren und zurücksetzen
      this.resetCart();
      this.currentView = 'main';
      this.selectedPaymentType = 'invoice'; // Reset auf Standard

      return true;

    } catch (error: any) {
      console.error('Transaction error:', error);
      alert('Fehler bei der Transaktion: ' + (error.message || error));
      return false;
    } finally {
      this.dataLoading = false; // Ladeindikator aus
    }
  }
}
