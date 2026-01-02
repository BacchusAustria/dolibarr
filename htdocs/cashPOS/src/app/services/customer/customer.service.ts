// src/app/services/customer/customer.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { ApiService } from '../api.service';
// Annahme: MOCK_DATA ist für die Demo vorhanden

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  
  private _customers = new BehaviorSubject<Customer[]>([]);
  public readonly customers$: Observable<Customer[]> = this._customers.asObservable();

  private _selectedCustomer = new BehaviorSubject<Customer | null>(null);
  public readonly selectedCustomer$: Observable<Customer | null> = this._selectedCustomer.asObservable();

  constructor(private apiService: ApiService) {}

  public async loadCustomers(): Promise<void> {
    if (this._customers.getValue().length > 0) return;

    try {
      const customers =  await firstValueFrom(this.apiService.get<Customer[]>('/thirdparties'));
      this._customers.next(customers);
      // Setzt den Standardkunden nach dem Laden
      const defaultCustomer = customers.find(c => c.name === 'AbHof Kunde');
      // Setzt den Standardkunden nach dem Laden, falls gefunden
      if (defaultCustomer) {
        this.setSelectedCustomer(defaultCustomer);
      }
      
    } catch (error) {
      console.error('Kunden konnten nicht geladen werden', error);
      throw error;
    }
  }
public getCustomers(): Customer[] {
      return this._customers.getValue();
  }
  public setSelectedCustomer(customer: Customer) {
    this._selectedCustomer.next(customer);
  }

  public getSelectedCustomer(): Customer | null {
    return this._selectedCustomer.getValue();
  }
}