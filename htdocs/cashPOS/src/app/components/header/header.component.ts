// src/app/components/header/header.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  styles: [`
@keyframes fillUp {
  from { background-size: 0% 100%; }
  to { background-size: 100% 100%; }
}

.logout-btn {
  background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)); /* Dunklerer Overlay */
  background-repeat: no-repeat;
  background-size: 0% 100%; /* Startet leer */
  transition: background-size 0s; /* Reset sofort beim Loslassen */
}

.logout-btn:active {
  background-size: 100% 100%; /* Füllt sich */
  transition: background-size 1.5s linear; /* Dauer muss gleich LOGOUT_DELAY sein */
}`],
  template: `
    <div class="bg-[#828f9a] text-white p-3 flex flex-col shadow-lg">
      <div class="flex items-center justify-between">
        
        <button 
          (click)="onHistoryClick.emit()"
          class="p-2 bg-[#CBCEBD] text-[#171819] rounded-lg hover:bg-white transition-colors flex items-center justify-center shadow-sm"
          title="Journal öffnen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
          </svg>
        </button>

        <div class="mt-1 text-sm opacity-90 flex items-center">
          <span class="truncate max-w-[200px] font-medium">
            Kunde: {{ selectedCustomer()?.name || 'Wird geladen...' }}
          </span>
          @if (loading()) {
            <span class="ml-2 text-[10px] animate-pulse bg-white/20 px-2 py-0.5 rounded text-white">
              LÄDT...
            </span>
          }
        </div>
        
        <div class="flex items-center space-x-2">
          
          <button 
            (click)="onCustomerClick.emit()"
            [class]="customerButtonClass() + ' p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm'"
            title="Kunde auswählen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          <button 
            (click)="canPay() && onPaymentClick.emit()"
            [class]="canPay() 
                     ? 'bg-[#818872] hover:bg-[#CBCEBD] text-white' 
                     : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'"
            [disabled]="!canPay()"
            title="Zahlung abschließen"
            class="p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="22" height="16" x="1" y="4" rx="2" ry="2"/><line x1="1" x2="23" y1="10" y2="10"/>
            </svg>
          </button>
          
          <button
            (touchstart)="logoutStart.emit()"
            (touchend)="logoutEnd.emit()"
            (mousedown)="logoutStart.emit()"
            (mouseup)="logoutEnd.emit()"
            (mouseleave)="logoutEnd.emit()"
            class="logout-btn ml-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center justify-center active:scale-90 shadow-sm"
            title="Zum Abmelden gedrückt halten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent {
  // --- Signal Inputs (Angular 17.1+) ---
  selectedCustomer = input<Customer | null>(null);
  cartItemCount = input<number>(0);
  loading = input<boolean>(false);

  // --- Signal Outputs ---
  onCustomerClick = output<void>();
  onPaymentClick = output<void>();
  logoutStart = output<void>();
  logoutEnd = output<void>();
  onHistoryClick = output<void>();

  // --- Computed State ---
  /** Prüft, ob bezahlt werden kann (Warenkorb nicht leer) */
  canPay = computed(() => this.cartItemCount() > 0);

  /** Berechnet die CSS Klassen für den Kunden-Button reaktiv */
  customerButtonClass = computed(() => {
    const customer = this.selectedCustomer();
    if (customer?.name === 'AbHof Kunde') {
      return 'bg-[#818872] text-white'; // Standard-Grün
    } else if (customer) {
      return 'bg-[#CBCEBD] text-[#171819]'; // Spezifischer Kunde (Beige)
    }
    return 'bg-red-500 text-white'; // Fehler/Kein Kunde
  });
}