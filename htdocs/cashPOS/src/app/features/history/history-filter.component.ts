// src/app/features/history/history-filter.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface HistoryFilterOptions {
  dateFrom: string | null;
  dateTo: string | null;
  customerId: string | null; // ID statt Name
  customerName?: string;     // Nur für die Anzeige
  minAmount: number | null;
  maxAmount: number | null;
}

@Component({
  selector: 'app-history-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 animate-in slide-in-from-top-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-500 uppercase">Datum</label>
          <div class="flex items-center gap-2">
            <input type="date" [(ngModel)]="filters.dateFrom" (change)="emitFilter()" 
                   class="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#828f9a] outline-none">
            <span class="text-gray-400">-</span>
            <input type="date" [(ngModel)]="filters.dateTo" (change)="emitFilter()" 
                   class="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#828f9a] outline-none">
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-500 uppercase">Kunde</label>
          
          <div *ngIf="!filters.customerId" 
               (click)="requestCustomerSelect.emit()"
               class="w-full p-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between">
            <span>Kunden auswählen...</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>

          <div *ngIf="filters.customerId" class="flex items-center gap-2">
            <div class="flex-1 p-2 text-sm border rounded-lg bg-blue-50 text-blue-800 font-medium truncate">
              {{ filters.customerName || 'Kunde #' + filters.customerId }}
            </div>
            <button (click)="clearCustomer()" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="space-y-1 sm:col-span-2">
          <label class="text-xs font-bold text-gray-500 uppercase">Betrag (€)</label>
          <div class="flex items-center gap-2">
            <input type="number" [(ngModel)]="filters.minAmount" (ngModelChange)="emitFilter()" placeholder="Min" 
                   class="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#828f9a] outline-none">
            <span class="text-gray-400">-</span>
            <input type="number" [(ngModel)]="filters.maxAmount" (ngModelChange)="emitFilter()" placeholder="Max" 
                   class="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#828f9a] outline-none">
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button (click)="reset()" class="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Filter zurücksetzen
        </button>
      </div>
    </div>
  `
})
export class HistoryFilterComponent {
  @Input() filters: HistoryFilterOptions = { dateFrom: null, dateTo: null, customerId: null, minAmount: null, maxAmount: null };
  @Output() filterChange = new EventEmitter<HistoryFilterOptions>();
  @Output() requestCustomerSelect = new EventEmitter<void>();

  emitFilter() {
    this.filterChange.emit(this.filters);
  }

  clearCustomer() {
    this.filters.customerId = null;
    this.filters.customerName = undefined;
    this.emitFilter();
  }

  reset() {
    this.filters = { dateFrom: null, dateTo: null, customerId: null, minAmount: null, maxAmount: null };
    this.emitFilter();
  }
}