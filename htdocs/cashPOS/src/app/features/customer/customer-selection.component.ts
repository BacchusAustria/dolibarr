// src/app/features/customer/customer-selection.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest, map, BehaviorSubject, startWith } from 'rxjs';
import { CustomerService } from '../../services/customer/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: './customer-selection.component.html',
  styles: [`
    /* Einfaches Styling für die Komponente */
    .customer-list-item {
      cursor: pointer;
      transition: background-color 0.1s;
    }
    .customer-list-item:hover {
      background-color: #f0f0f0;
    }
    .selected {
      background-color: #CBCEBD;
      font-weight: bold;
    }
  `]
})
export class CustomerSelectionComponent implements OnInit {
  
  // Input für die Suche
  private _searchTermSubject = new BehaviorSubject<string>('');
  get searchTerm(): string { return this._searchTermSubject.getValue(); }
  set searchTerm(value: string) { this._searchTermSubject.next(value); }

  // Observables für das Template
  public customers$: Observable<Customer[]>;
  public selectedCustomer$: Observable<Customer | null>;
  
  // Output Events - die Komponente meldet nur Ereignisse nach oben, ändert nicht den globalen State
  @Output() close = new EventEmitter<void>();
  @Output() customerSelect = new EventEmitter<Customer>();

  constructor(private customerService: CustomerService) {
    
    // Kombiniert alle Kunden und den Suchbegriff, um die gefilterte Liste reaktiv zu erzeugen
    this.customers$ = combineLatest([
      this.customerService.customers$,
      this._searchTermSubject.pipe(startWith(this.searchTerm))
    ]).pipe(
      map(([customers, term]) => this.filterCustomers(customers, term))
    );
    
    this.selectedCustomer$ = this.customerService.selectedCustomer$;
  }

  ngOnInit() {
    // Falls die Kunden im App-Start nicht geladen wurden, hier laden
    this.customerService.loadCustomers().catch(err => 
        console.error('Fehler beim Laden der Kunden:', err)
    );
  }

  /**
   * Filtert die Kundenliste basierend auf dem Suchbegriff.
   */
  private filterCustomers(customers: Customer[], term: string): Customer[] {
    if (!term) {
      return customers;
    }
    const lowerCaseTerm = term.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(lowerCaseTerm) ||
      customer.email?.toLowerCase().includes(lowerCaseTerm)
    );
  }

  /**
   * Wählt einen Kunden aus und meldet dies an die Eltern-Komponente.
   * Die Entscheidung über die globale Zustandsänderung trifft die Eltern-Komponente.
   */
  public selectCustomer(customer: Customer): void {
    this.customerSelect.emit(customer);
    this.close.emit();
  }
}