import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiService = inject(ApiService);

  // **********************************************
  // ** STATE (SIGNALS) **
  // **********************************************
  
  // Ersetzt BehaviorSubject<Customer[]>
  public customers: WritableSignal<Customer[]> = signal<Customer[]>([]);
  
  // Ersetzt BehaviorSubject<Customer | null>
  public selectedCustomer: WritableSignal<Customer | null> = signal<Customer | null>(null);

  constructor() {}

  // **********************************************
  // ** ACTIONS **
  // **********************************************

  public async loadCustomers(): Promise<void> {
    // Einfaches Caching: Wenn schon Daten da sind, nicht neu laden
    if (this.customers().length > 0) return;

    try {
      const customers = await firstValueFrom(this.apiService.get<Customer[]>('/thirdparties'));
      
      // 1. Signal setzen
      this.customers.set(customers);

      // 2. Standardkunden suchen und setzen
      const defaultCustomer = customers.find(c => c.name === 'AbHof Kunde');
      
      if (defaultCustomer) {
        this.selectedCustomer.set(defaultCustomer);
      } else if (customers.length > 0) {
        // Fallback: Ersten Kunden nehmen, falls 'AbHof' nicht existiert (optional)
        // this.selectedCustomer.set(customers[0]);
      }
      
    } catch (error) {
      console.error('Kunden konnten nicht geladen werden', error);
      throw error;
    }
  }

  public setSelectedCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
  }

  // Getter sind nicht mehr nötig, da man direkt service.customers() aufrufen kann.
  // Falls du Logik brauchst, um einen Kunden per ID zu finden:
  public getCustomerById(id: string): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }
}