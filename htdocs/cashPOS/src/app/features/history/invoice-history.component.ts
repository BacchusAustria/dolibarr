// src/app/features/history/invoice-history.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { InvoiceService, DolibarrInvoice } from '../../services/invoice/invoice.service';
import { Observable, from } from 'rxjs';

@Component({
  selector: 'app-invoice-history',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  template: `
    <div class="flex flex-col h-full bg-white shadow-xl">
      <div class="bg-[#828f9a] text-white p-4 flex justify-between items-center shadow-md">
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h2 class="text-xl font-semibold">Rechnungsjournal</h2>
        </div>
        <button (click)="close.emit()" class="hover:bg-white/20 p-2 rounded-full transition-colors text-2xl leading-none">&times;</button>
      </div>

      <div class="flex-1 overflow-auto p-4">
        @if (invoices$ | async; as invoices) {
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-100 text-[#828f9a] uppercase text-xs tracking-wider">
                <th class="py-3 px-2">Beleg-Nr.</th>
                <th class="py-3 px-2">Kunde</th>
                <th class="py-3 px-2 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody class="text-[#171819]">
              @for (inv of invoices; track inv.id) {
                <tr class="border-b hover:bg-gray-50 transition-colors">
                  <td class="py-4 px-2 font-mono text-sm font-semibold text-[#818872]">{{ inv.ref }}</td>
                  <td class="py-4 px-2">{{ inv.socname }}</td>
                  <td class="py-4 px-2 text-right font-bold">{{ (+inv.total_ttc).toFixed(2) }} €</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-10 text-center text-gray-500 italic">Keine Rechnungen für heute gefunden.</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div class="flex flex-col items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#818872]"></div>
            <p class="mt-2 text-sm text-gray-500">Lade Journal...</p>
          </div>
        }
      </div>
      
      
    </div>
  `
})
export class InvoiceHistoryComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  invoices$!: Observable<DolibarrInvoice[]>;
  today = new Date();

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.invoices$ = from(this.invoiceService.getInvoices());
  }

  reprint(invoice: DolibarrInvoice) {
    // Hier könnte man das PDF von Dolibarr abrufen: /invoices/{id}/reports
    console.log('Nachdruck für:', invoice.ref);
  }
}