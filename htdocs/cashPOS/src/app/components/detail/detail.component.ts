import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, DolibarrDocument } from '../../services/documents/document.service';
import { DetailViewConfig } from '../../models/document.model';
import { InvoiceService } from '../../services/invoice/invoice.service';
import { ApiService } from '../../services/api.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        
        <div class="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ config.title }}</h3>
            <p class="text-xl font-mono font-bold text-[#171819]">{{ config.ref }}</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 text-3xl p-2">&times;</button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <label class="text-[10px] text-gray-400 block uppercase font-bold">Datum</label>
              <p class="font-medium">{{ formatDate(config.date) }}</p>
            </div>
            <div *ngIf="config.total">
              <label class="text-[10px] text-gray-400 block uppercase font-bold">Gesamtbetrag</label>
              <p class="font-bold text-lg text-[#818872]">{{ (+config.total).toFixed(2) }} €</p>
            </div>
            <div class="col-span-2">
              <label class="text-[10px] text-gray-400 block uppercase font-bold">Kunde</label>
              <p class="font-medium">{{ config.customerName }}</p>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Positionen
            </h4>
            <div class="border rounded-xl overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th class="p-2 text-left">Bezeichnung</th>
                    <th class="p-2 text-center">Menge</th>
                    <th class="p-2 text-right">Summe</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (line of lines; track line.id) {
                    <tr>
                      <td class="p-2">
                        <div class="font-medium">{{ line.libelle || line.label || line.product_label }}</div>
                        <div class="text-[10px] text-gray-400">Einzelpreis: {{ ((+line.subprice_ttc) || getBruttoSingle(line)).toFixed(2) }}€</div>
                        <div class="text-[10px] text-gray-400 italic">{{ (+(line.tva_tx || 0)).toFixed(2) }}% MwSt.</div>
                      </td>
                      <td class="p-2 text-center">{{ line.qty }}</td>
                      <td class="p-2 text-right font-mono font-bold">{{ (+line.total_ttc || 0).toFixed(2) }}€</td>
                    </tr>
                  } @empty {
                    @if (loading) {
                       <tr><td colspan="3" class="p-4 text-center animate-pulse text-gray-400">Lade Positionen...</td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
              Verfügbare Dateien
            </h4>
            <div class="space-y-2">
              @for (doc of documents; track doc.relativename) {
                <button (click)="openFile(doc)" 
                   class="w-full flex items-center justify-between p-3 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div class="flex items-center gap-3">
                    <div class="bg-red-50 text-red-500 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div class="text-left">
                      <div class="text-sm font-medium truncate max-w-[200px]">{{ doc.relativename }}</div>
                      <div class="text-[10px] text-gray-400">{{ (doc.size / 1024).toFixed(1) }} KB</div>
                    </div>
                  </div>
                  <svg class="text-gray-300 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              } @empty {
                 <div class="text-xs text-gray-400 italic p-2 text-center">Suche nach Dokumenten...</div>
              }
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 shrink-0">
          <button (click)="close.emit()" 
            class="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
            Schließen
          </button>
        </div>
      </div>
    </div>
  `
})
export class DocumentDetailComponent implements OnInit {
  @Input() config!: DetailViewConfig;
  @Output() close = new EventEmitter<void>();

  lines: any[] = [];
  documents: DolibarrDocument[] = [];
  loading = true;

  constructor(
    private documentService: DocumentService,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    this.loadData();
    this.loadDocuments();
  }

  /**
   * Lädt die Details des Objekts (Rechnung/Lieferschein), um die Positionszeilen zu erhalten
   */
  async loadData() {
    this.loading = true;
    try {
      const endpoint = this.config.modulePart ===  'invoice' ? 'invoices' : 
                       this.config.modulePart === 'shipment' ? 'shipments' : 'orders';
      
      const data = await lastValueFrom(this.apiService.get<any>(`/${endpoint}/${this.config.id}`));
      this.lines = data.lines || [];
    } catch (error) {
      console.error('Fehler beim Laden der Positionen:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadDocuments() {
    try {
      this.documents = await this.documentService.listDocuments(this.config.modulePart, this.config.id);
    } catch (error) {
      console.error('Dokumentenliste konnte nicht geladen werden:', error);
    }
  }

  formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString('de-DE');
  }

  async openFile(doc: DolibarrDocument) {
    // Falls relpath im Model vorhanden ist, nutzen wir diesen. 
    // Falls nicht, bauen wir ihn aus level1name und relativename wie gewünscht.
    const path = doc.relpath || (doc['level1name'] + '/' + doc['relativename']);
    await this.documentService.downloadAndOpenPdf(this.config.modulePart, path);
  }
  getBruttoSingle(line: any): number {
  const netto = +line.subprice || 0;
  const taxRate = +line.tva_tx || 0;

  if (line.price_ttc) {
    return +line.price_ttc;
  }

  if (taxRate > 0) {
    return netto * (1 + taxRate / 100);
  }

  return netto;
}
}