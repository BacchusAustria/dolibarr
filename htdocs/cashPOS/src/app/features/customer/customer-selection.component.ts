import { Component, inject, signal, computed, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-selection',
  standalone: true,
  imports: [CommonModule, FormsModule], // Kein AsyncPipe mehr nötig
  templateUrl: './customer-selection.component.html',
  styles: [`
    .customer-list-item {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .customer-list-item:hover {
      background-color: #f3f4f6;
      transform: translateX(4px);
    }
    .selected {
      background-color: #CBCEBD !important;
      border-left: 4px solid #818872;
      font-weight: bold;
    }
  `]
})
export class CustomerSelectionComponent implements OnInit {
  // --- DI ---
  public customerService = inject(CustomerService);

  // --- UI State (Local Signals) ---
  public searchTerm = signal<string>('');

  // --- Outputs (New Syntax) ---
  close = output<void>();
  customerSelect = output<Customer>();

  // --- Computed State ---
  /**
   * Filtert die Kundenliste reaktiv, sobald sich die Kunden im Service 
   * oder der Suchbegriff ändern.
   */
  public filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allCustomers = this.customerService.customers();

    if (!term) return allCustomers;

    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.code_client?.toLowerCase().includes(term) // Oft nützlich in Dolibarr
    );
  });

  ngOnInit() {
    // Sicherstellen, dass Kunden geladen sind
    this.customerService.loadCustomers();
  }

  public selectCustomer(customer: Customer): void {
    // Wir setzen den Kunden direkt im Service (wie in der Kassa-Logik besprochen)
    this.customerService.setSelectedCustomer(customer);
    this.customerSelect.emit(customer);
    this.close.emit();
  }
}