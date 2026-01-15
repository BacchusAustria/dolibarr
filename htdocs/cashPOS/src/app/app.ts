import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { AuthService } from './services/auth/auth.service';
import { ProductService } from './services/product/product.service';
import { CustomerService } from './services/customer/customer.service';
import { CartService } from './services/cart/cart.service';
import { ViewService } from './services/view/view.service';
import { TransactionFacade } from './features/payment/transaction.facade';

// Models
// (Imports bleiben gleich)
import { KassaComponent } from "./features/kassa/kassa.component";
import { CustomerSelectionComponent } from "./features/customer/customer-selection.component";
import { PaymentComponent } from "./features/payment/payment.component";
import { HeaderComponent } from "./components/header/header.component";
import { LoginComponent } from "./features/login/login.component";
import { InvoiceHistoryComponent } from './features/history/invoice-history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    KassaComponent, 
    CustomerSelectionComponent, 
    PaymentComponent, 
    HeaderComponent, 
    LoginComponent, 
    InvoiceHistoryComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  // --- Dependency Injection ---
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  public customerService = inject(CustomerService); // Public für Template-Zugriff (Header)
  public viewService = inject(ViewService);
  private transactionFacade = inject(TransactionFacade);
  public cartService = inject(CartService);

  public currentView = this.viewService.currentView;
  public totalItems = computed(() => this.cartService.items().length);

  // --- Lokale UI States ---
  public dataLoading = signal<boolean>(false); // Auch hier besser als Signal für Konsistenz
  public dataError = signal<boolean>(false);
  public apiKey = '';
  
  // Payment Properties
  public paymentAmount = '';
  public selectedPaymentType: 'cash' | 'delivery' | 'invoice' = 'cash';
  public printReceipt = true;

  private logoutTimer: any = null;
  private readonly LOGOUT_DELAY = 1500;

  ngOnInit() {
    this.apiKey = localStorage.getItem('dolibarrApiKey') || '';
    if (this.apiKey) {
      this.loadDolibarrData();
    }
  }


  /**
   * Bricht den Timer ab, wenn der Nutzer loslässt oder die Maus wegbewegt.
   */
  public handleLogoutEnd(): void {
    this.clearLogoutTimer();
  }

  private clearLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  /**
   * Führt den eigentlichen Logout durch.
   */
  private performLogout(): void {
    // Optional: Haptisches Feedback (Vibration) auf Tablets/Handys
    if (navigator.vibrate) {
      navigator.vibrate(200); 
    }

    this.authService.logout();
    this.apiKey = '';
    this.cartService.resetCart();
    
    // UI Feedback und Reload
    alert('Sie wurden erfolgreich abgemeldet.');
    window.location.reload(); 
  }

  /**
   * Lädt alle notwendigen Stammdaten von Dolibarr
   * Die Services speichern den State selbst (Signals).
   */
  async loadDolibarrData() {
    this.dataLoading.set(true);
    try {
      // Wir warten nur auf den Abschluss der Calls. 
      // Die Daten landen automatisch in den Signals der Services.
      await Promise.all([
        this.productService.loadCategories(),
        this.productService.loadProducts(),
        this.customerService.loadCustomers()
      ]);
      
    } catch (error) {
      console.error('Fehler beim Laden der Dolibarr-Daten:', error);
      this.dataError.set(true);
    } finally {
      this.dataLoading.set(false);
    }
  }

  /**
   * Delegiert den Bezahlprozess an die TransactionFacade
   */
  async completeTransaction() {
    // KORREKTUR: Zugriff auf Signal-Wert mit Klammern ()
    const customer = this.customerService.selectedCustomer();
    
    if (!customer) {
      alert('Bitte wählen Sie zuerst einen Kunden aus.');
      return;
    }

    this.dataLoading.set(true);
    try {
      await this.transactionFacade.processTransaction({
        type: this.selectedPaymentType,
        customer: customer,
        paidAmount: parseFloat(this.paymentAmount) || 0,
        printReceipt: this.printReceipt
      });

      // Nach Erfolg: UI zurücksetzen
      this.cartService.resetCart();
      this.paymentAmount = '';
      this.viewService.navigateTo('main');
      
      alert('Transaktion erfolgreich abgeschlossen!');
      
    } catch (error: any) {
      console.error('Transaktionsfehler:', error);
      alert('Fehler bei der Transaktion: ' + (error.message || 'Dolibarr API Error'));
    } finally {
      this.dataLoading.set(false);
    }
  }

  // --- UI-Interaktionen ---

  handleLogoutStart() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      this.authService.logout();
      this.apiKey = '';
      this.cartService.resetCart();
      // Ggf. Reload der Seite erzwingen oder auf Login-View wechseln
      window.location.reload(); 
    }
  }

  // Diese Methoden werden wahrscheinlich von Events aus der PaymentComponent aufgerufen
  updatePaymentAmount(amount: string) {
    this.paymentAmount = amount;
  }

  updatePaymentType(type: 'cash' | 'delivery' | 'invoice') {
    this.selectedPaymentType = type;
  }

  closeCustomerSelection() {
    this.viewService.navigateTo('main');
  }

  closePaymentSelection() {
    this.viewService.navigateTo('main');
  }
}