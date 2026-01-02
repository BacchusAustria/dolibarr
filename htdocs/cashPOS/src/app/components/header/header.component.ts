import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/customer.model'; // Pfad ggf. prüfen

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#828f9a] text-white p-3 flex flex-col shadow-lg">
      <div class="flex items-center justify-between">
        <button 
  (click)="onHistoryClick.emit()"
  class="p-2 bg-[#CBCEBD] text-[#171819] rounded-lg hover:bg-white transition-colors flex items-center justify-center"
  title="Journal öffnen"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
</button>
            <div class="mt-1 text-sm opacity-90 flex items-center">
        <span class="truncate max-w-[200px]">Kunde: {{ selectedCustomer?.name || 'Wird geladen...' }}</span>
        <span *ngIf="loading" class="ml-2 text-xs animate-pulse">(Daten werden geladen...)</span>
      </div>
        
        <div class="flex items-center space-x-2">
          
          <button 
            (click)="onCustomerClick.emit()"
            [class]="getCustomerButtonClass()"
            title="Kunde auswählen"
            class="p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-card">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          <button 
            (click)="cartItemCount > 0 && onPaymentClick.emit()"
            [class]="cartItemCount > 0 
                     ? 'bg-[#818872] hover:bg-[#CBCEBD] text-white' 
                     : 'bg-gray-500 text-gray-300 cursor-not-allowed'"
            [disabled]="cartItemCount === 0"
            title="Zahlung abschließen"
            class="p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck">
                <rect width="22" height="16" x="1" y="4" rx="2" ry="2"/><line x1="1" x2="23" y1="10" y2="10"/>
            </svg>
          </button>
          
          <button
            (touchstart)="logoutStart.emit()"
            (touchend)="logoutEnd.emit()"
            (mousedown)="logoutStart.emit()"
            (mouseup)="logoutEnd.emit()"
            (mouseleave)="logoutEnd.emit()"
            class="ml-2 p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
            title="Zum Abmelden gedrückt halten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

  
    </div>
  `
})
export class HeaderComponent {
  @Input() selectedCustomer: Customer | null = null;
  @Input() cartItemCount: number = 0;
  @Input() loading: boolean = false;

  @Output() onCustomerClick = new EventEmitter<void>();
  @Output() onPaymentClick = new EventEmitter<void>();
  @Output() logoutStart = new EventEmitter<void>();
  @Output() logoutEnd = new EventEmitter<void>();
  @Output() onHistoryClick = new EventEmitter<void>();

  getCustomerButtonClass(): string {
    if (this.selectedCustomer?.name === 'AbHof Kunde') {
      return 'bg-[#818872] text-white'; // Grün für Default
    } else if (this.selectedCustomer) {
      // Wenn ein spezifischer Kunde gewählt ist (wie in React)
      return 'bg-[#CBCEBD] text-[#171819]'; // Gelb/Beige für spezifischen Kunden
    }
    return 'bg-red-500 text-white'; // Rot wenn kein Kunde
  }
}