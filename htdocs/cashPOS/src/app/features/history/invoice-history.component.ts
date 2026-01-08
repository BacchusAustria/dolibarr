// src/app/features/history/invoice-history.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, switchMap, Observable } from 'rxjs';

// Services
import { InvoiceService } from '../../services/invoice/invoice.service';
import { DeliveryService } from '../../services/delivery/delivery.service';
import { CustomerService } from '../../services/customer/customer.service';
import { DocumentService } from '../../services/documents/document.service';

// Models
import { DetailViewConfig } from '../../models/document.model';
import { Customer } from '../../models/customer.model';

// Components
import { DocumentDetailComponent } from "../../components/detail/detail.component";
import { HistoryFilterComponent, HistoryFilterOptions } from './history-filter.component';
import { CustomerSelectionComponent } from "../customer/customer-selection.component"; // Import anpassen!

type HistoryCategory = 'invoice' | 'takepos' | 'shipment';

@Component({
  selector: 'app-invoice-history',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DocumentDetailComponent, 
    HistoryFilterComponent,
    CustomerSelectionComponent // Hinzufügen
  ],
  template: `
    <div class="flex flex-col h-full bg-white shadow-xl relative overflow-hidden">
      
      <div class="bg-[#828f9a] text-white p-4 shrink-0 shadow-md z-10">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <h2 class="text-xl font-semibold">Journal</h2>
          </div>
          <button (click)="close.emit()" class="hover:bg-white/20 p-2 rounded-full transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div class="flex p-1 bg-black/10 rounded-lg mb-4">
          <button (click)="setCategory('invoice')" 
            [class]="getTabClass('invoice')">Rechnungen</button>
          <button (click)="setCategory('takepos')" 
            [class]="getTabClass('takepos')">Barverkäufe</button>
          <button (click)="setCategory('shipment')" 
            [class]="getTabClass('shipment')">Lieferscheine</button>
        </div>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" 
                   placeholder="Referenz, Kunde, Artikel..." 
                   class="w-full pl-9 pr-4 py-2 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
            <svg class="absolute left-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <button (click)="showFilter = !showFilter" 
                  [class]="'p-2 rounded-lg transition-colors ' + (hasActiveFilters() ? 'bg-orange-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto bg-gray-50 p-4 relative">
        
        <div *ngIf="showFilter">
          <app-history-filter 
            [filters]="currentFilters" 
            (filterChange)="updateFilters($event)"
            (requestCustomerSelect)="showCustomerSelector = true"> </app-history-filter>
        </div>

        @if (filteredData$ | async; as documents) {
          <div class="space-y-3">
            @for (doc of documents; track doc.id) {
              <div (click)="openDetails(doc)" 
                   class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all active:scale-[0.99]">
                
                <div class="flex justify-between items-start mb-2">
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ doc.ref }}</span>
                      <span class="text-xs text-gray-400">{{ formatDate(doc.date || doc.date_delivery) }}</span>
                    </div>
                    <div class="font-medium text-gray-800 mt-1">
                      {{ getCustomerName(doc) }}
                    </div>
                  </div>
                  
                  <div *ngIf="doc.total_ttc !== undefined" class="text-right">
                    <div class="font-bold text-[#171819] font-mono">{{ (+doc.total_ttc).toFixed(2) }} €</div>
                    <div class="text-[10px] text-gray-400 uppercase tracking-wider">{{ getStatusLabel(doc) }}</div>
                  </div>
                </div>

                <div class="flex justify-between items-end border-t pt-2 mt-2 border-gray-50">
                  <div class="text-xs text-gray-400 italic">
                    {{ activeCategory === 'shipment' ? 'Lieferschein' : (activeCategory === 'takepos' ? 'Barverkauf' : 'Rechnung') }}
                  </div>
                  <div class="text-xs text-blue-500 font-medium">Details öffnen →</div>
                </div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg class="mb-2 opacity-50" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Keine Dokumente gefunden.</p>
              </div>
            }
          </div>
        } @else {
           <div class="flex flex-col items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#828f9a]"></div>
            <p class="mt-2 text-sm text-gray-500">Lade Daten...</p>
          </div>
        }
      </div>

      @if (selectedConfig) {
        <app-document-detail 
          [config]="selectedConfig" 
          (close)="selectedConfig = null">
        </app-document-detail>
      }

      @if (showCustomerSelector) {
        <div class="absolute inset-0 z-50 bg-white">
          <app-customer-selection
            (customerSelect)="onCustomerSelected($any($event))"
            (close)="showCustomerSelector = false">
          </app-customer-selection>
        </div>
      }

    </div>
  `
})
export class InvoiceHistoryComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  // State
  activeCategory: HistoryCategory = 'invoice';
  searchTerm: string = '';
  showFilter = false;
  showCustomerSelector = false;
  
  currentFilters: HistoryFilterOptions = {
    dateFrom: null, dateTo: null, customerId: null, minAmount: null, maxAmount: null
  };

  // Observables
  private categorySubject = new BehaviorSubject<HistoryCategory>('invoice');
  private filterSubject = new BehaviorSubject<any>({ term: '', filters: this.currentFilters });
  
  filteredData$!: Observable<any[]>; 
  customersMap: Record<string, string> = {};

  selectedConfig: DetailViewConfig | null = null;

  constructor(
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    this.loadCustomers();

    this.filteredData$ = combineLatest([
      this.categorySubject,
      this.filterSubject
    ]).pipe(
      switchMap(([category, filterState]) => {
        let dataStream;
        if (category === 'shipment') {
            dataStream = this.deliveryService.getShipments ? 
                         this.deliveryService.getShipments() : 
                         Promise.resolve([]);
        } else {
            dataStream = this.invoiceService.getInvoices();
        }
        return Promise.resolve(dataStream).then(data => ({ data, category, filterState }));
      }),
      map(({ data, category, filterState }) => {
        return this.applyFilters(data, category, filterState.term, filterState.filters);
      })
    );
  }

  // --- Filter Logic ---

  applyFilters(data: any[], category: HistoryCategory, term: string, filters: HistoryFilterOptions): any[] {
    if (!Array.isArray(data)) return [];

    return data.filter(item => {
      // 1. Kategorie
      if (category === 'takepos') {
        if (item.module_source !== 'takepos' && item.pos_source === null) return false;
      }
      else{
        if(item.module_source === 'takepos') return false;
      }

      // 2. Suche (Referenz + Kunde + Artikel)
      if (term) {
        const t = term.toLowerCase();
        
        // A. Referenz
        const matchRef = (item.ref || '').toLowerCase().includes(t);
        
        // B. Kunde
        const custName = this.getCustomerName(item).toLowerCase();
        const matchCust = custName.includes(t);

        // C. Artikel / Positionen
        let matchLine = false;
        if (item.lines && Array.isArray(item.lines)) {
          matchLine = item.lines.some((l: any) => 
            (l.libelle || l.label || '').toLowerCase().includes(t) ||
            (l.desc || '').toLowerCase().includes(t) || 
            (l.ref || '').toLowerCase().includes(t)
          );
        }

        if (!matchRef && !matchCust && !matchLine) return false;
      }

      // 3. Erweiterte Filter
      const itemDate = (item.date || item.date_delivery || 0) * 1000;
      if (filters.dateFrom && itemDate < new Date(filters.dateFrom).setHours(0,0,0,0)) return false;
      if (filters.dateTo && itemDate > new Date(filters.dateTo).setHours(23,59,59,999)) return false;

      if (item.total_ttc !== undefined) {
        if (filters.minAmount !== null && +item.total_ttc < filters.minAmount) return false;
        if (filters.maxAmount !== null && +item.total_ttc > filters.maxAmount) return false;
      }

      // Kunde (Filter aus Modal) - strikter ID Vergleich
      if (filters.customerId) {
        // socid kann number oder string sein, daher == statt === für Sicherheit
        if (item.socid != filters.customerId) return false;
      }

      return true;
    });
  }

  // --- Handlers ---

  onCustomerSelected(customer: Customer) {

    this.currentFilters = {
      ...this.currentFilters,
      customerId: customer.id,
      customerName: customer.name
    };
    this.showCustomerSelector = false;
    this.updateFilters(this.currentFilters);
  }

  setCategory(cat: HistoryCategory) {
    this.activeCategory = cat;
    this.categorySubject.next(cat);
  }

  getTabClass(cat: HistoryCategory): string {
    const base = "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ";
    return this.activeCategory === cat 
      ? base + "bg-white text-[#828f9a] shadow-sm" 
      : base + "text-white/70 hover:bg-white/10 hover:text-white";
  }

  onSearchChange() {
    this.filterSubject.next({ term: this.searchTerm, filters: this.currentFilters });
  }

  updateFilters(newFilters: HistoryFilterOptions) {
    this.currentFilters = newFilters;
    this.filterSubject.next({ term: this.searchTerm, filters: this.currentFilters });
  }

  hasActiveFilters(): boolean {
    const f = this.currentFilters;
    return !!(f.dateFrom || f.dateTo || f.minAmount || f.maxAmount || f.customerId);
  }

  // --- Helpers ---
  
  loadCustomers() {
    // Falls CustomerService Promise zurückgibt:
    // this.customerService.getCustomers().then(...)
    // Falls synchron (Mock):
    const list = this.customerService.getCustomers();
    if (Array.isArray(list)) {
         list.forEach(c => { if(c.id) this.customersMap[c.id] = c.name; });
    }
  }

  getCustomerName(doc: any): string {
    return this.customersMap[doc.socid] || doc.socname || 'Unbekannter Kunde';
  }

  getStatusLabel(doc: any): string {
    if (doc.paye === '1') return 'Bezahlt';
    if (doc.status === '0') return 'Entwurf';
    if (doc.status === '2') return 'Teilbezahlt';
    return 'Offen';
  }

  formatDate(ts: number): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('de-DE');
  }

  openDetails(doc: any) {
    this.selectedConfig = {
      title: this.activeCategory === 'shipment' ? 'Lieferschein' : 'Rechnung',
      modulePart: this.activeCategory === 'shipment' ? 'shipment' : 'invoice', 
      id: doc.id,
      ref: doc.ref,
      date: doc.date || doc.date_delivery,
      total: doc.total_ttc,
      customerName: this.getCustomerName(doc)
    };
  }
}