// src/app/app.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth/auth.service';
import { ProductService } from './services/product/product.service';
import { CustomerService } from './services/customer/customer.service';
import { Product } from './models/product.model';
import { Category } from './models/category.model';
import { CartItem } from './models/cart.model';
import { Customer } from './models/customer.model';
import { Discount } from './models/discount.model';
import { MOCK_DATA } from './constants/app.constants';
import { CalculationUtils } from './utils/calculation.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private customerService: CustomerService
  ) {}
  // View states
  currentView: 'main' | 'customer' | 'payment' = 'main';
  
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
  
  // Timers
  longPressTimer: any = null;
  logoutTimer: any = null;
  
  // Auth
  apiKey = '';
  username = '';
  password = '';
  
  // Customer
  selectedCustomer: Customer | null = null;
  
  // Cart
  cartItems: CartItem[] = [];
  globalDiscount: Discount = { value: 0, type: 'percent' };
  
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

  // Data loading
  async loadDolibarrData() {
    this.dataLoading = true;
    try {
      // Load from API
      
      this.categoryList = await this.productService.getCategories();
      this.productList = await this.productService.getProductsWithCategories();
      this.customerList = await this.customerService.getCustomers();
      
      this.defaultCustomer = this.customerList[0] || MOCK_DATA.DEFAULT_CUSTOMER;
      
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
    this.logoutTimer = setTimeout(() => {
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
    let cats =  this.categoryList.filter(cat => String(cat.fk_parent) === parentId);
    return cats;
  }

  getCurrentCategories(): Category[] {
    if (this.selectedCategory === null) {
      return this.getMainCategories();
    } else {
      let subcats =  this.getSubcategories(this.selectedCategory);
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
    this.longPressTimer = setTimeout(() => {
      this.productModal = product;
      this.tempProduct = { quantity: 1, price: product.price };
    }, 500);
  }

  handleTouchEnd() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  addToCart(product: Product, quantity: number = 1, customPrice?: number) {
    const existingIndex = this.cartItems.findIndex(item => 
      item.id === product.id && item.price === (customPrice || product.price)
    );

    if (existingIndex >= 0) {
      this.cartItems[existingIndex].quantity += quantity;
    } else {
      this.cartItems.push({
        ...product,
        quantity,
        originalPrice: product.price,
        price: customPrice || product.price,
        discount: { value: 0, type: 'percent' }
      });
    }
  }

  addProductFromModal() {
    if (this.productModal) {
      this.addToCart(this.productModal, this.tempProduct.quantity, this.tempProduct.price);
      this.productModal = null;
      this.tempProduct = { quantity: 1, price: 0 };
    }
  }

  updateCartItem(index: number, field: 'quantity' | 'price', value: number) {
    if (field === 'quantity') {
      this.cartItems[index].quantity = Math.max(1, value);
    } else {
      this.cartItems[index].price = value;
    }
  }

  removeFromCart(index: number) {
    this.cartItems.splice(index, 1);
  }

  // Discount handling
  openDiscountModal(type: 'item' | 'global', index: number | null = null) {
    let initialValue = 0;
    let initialDiscountType: 'percent' | 'euro' = 'percent';

    if (type === 'item' && index !== null && this.cartItems[index]?.discount) {
      initialValue = this.cartItems[index].discount.value;
      initialDiscountType = this.cartItems[index].discount.type;
    } else if (type === 'global' && this.globalDiscount) {
      initialValue = this.globalDiscount.value;
      initialDiscountType = this.globalDiscount.type;
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
      this.globalDiscount = {
        value: this.discountModal.value,
        type: this.discountModal.discountType
      };
    }
    this.discountModal = null;
  }

  applyItemDiscount(index: number, value: number, type: 'percent' | 'euro') {
    this.cartItems[index].discount = { value, type };
  }

  // Calculations
  calculateItemTotal(item: CartItem): number {
    return CalculationUtils.calculateItemTotal(
      item.price,
      item.quantity,
      item.discount.value,
      item.discount.type
    );
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
  }

  get globalDiscountAmount(): number {
    return CalculationUtils.calculateDiscount(
      this.subtotal,
      this.globalDiscount.value,
      this.globalDiscount.type
    );
  }

  get cartTotal(): number {
    return Math.max(0, this.subtotal - this.globalDiscountAmount);
  }

  resetCart() {
    this.cartItems = [];
    this.globalDiscount = { value: 0, type: 'percent' };
    this.paymentAmount = '';
  }

  // Transaction
  async completeTransaction(actualPaymentAmount?: string) {
    const finalPaymentAmount = actualPaymentAmount || this.paymentAmount;
    const paidAmount = parseFloat(finalPaymentAmount);
    const changeAmount = paidAmount - this.cartTotal;

    try {
      // Implement Dolibarr API calls here
      console.log('Processing transaction...', {
        customer: this.selectedCustomer,
        items: this.cartItems,
        total: this.cartTotal,
        paid: paidAmount,
        change: changeAmount
      });

      // Success
      alert(`Transaktion erfolgreich!\nGesamt: ${this.cartTotal.toFixed(2)}€\nBezahlt: ${paidAmount.toFixed(2)}€\nWechselgeld: ${changeAmount.toFixed(2)}€`);
      
      this.resetCart();
      this.currentView = 'main';
      
      return true;
    } catch (error: any) {
      console.error('Transaction error:', error);
      alert('Fehler bei der Transaktion: ' + error.message);
      return false;
    }
  }
}