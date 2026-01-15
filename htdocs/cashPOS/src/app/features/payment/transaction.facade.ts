import { Injectable } from '@angular/core';
import { InvoiceService } from '../../services/invoice/invoice.service';
import { DeliveryService } from '../../services/delivery/delivery.service';
import { CartService } from '../../services/cart/cart.service';
import { PrintService } from '../../services/print/print.service';
import { DocumentService } from '../../services/documents/document.service';
import { Customer } from '../../models/customer.model';
import { CartItem } from '../../models/cart.model';

export interface TransactionConfig {
  type: 'cash' | 'delivery' | 'invoice';
  customer: Customer;
  paidAmount: number;
  printReceipt: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionFacade {
  constructor(
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private printService: PrintService,
    private documentService: DocumentService
  ) {}

  /**
   * Führt den kompletten Bezahlvorgang aus.
   * Kapselt die Logik für Rechnungen, Barzahlungen und Lieferscheine.
   */
  async processTransaction(config: TransactionConfig): Promise<string> {
    const items = this.cartService.items();
    const cartTotal = this.cartService.cartTotal();

    if (config.type === 'delivery') {
      return await this.handleDeliveryProcess(config.customer.id, items);
    } else {
      return await this.handleInvoiceProcess(config, items, cartTotal);
    }
  }

  /**
   * Logik für Lieferscheine (Delegation an DeliveryService)
   */
  private async handleDeliveryProcess(customerId: string, items: CartItem[]): Promise<string> {
    const docId = await this.deliveryService.createFullDeliveryProcess(customerId, items);
    console.log(`Lieferschein erfolgreich erstellt: ${docId}`);
    return docId;
  }

  /**
   * Logik für Rechnungen (Draft -> Lines -> Validate -> Payment -> Print)
   */
  private async handleInvoiceProcess(config: TransactionConfig, items: CartItem[], total: number): Promise<string> {
    let invoiceId = '';
    
    try {
      // 1. Rechnungsentwurf erstellen
      invoiceId = await this.invoiceService.createDraft(config.customer.id);

      // 2. Positionen hinzufügen
      for (const item of items) {
        await this.invoiceService.addLine(invoiceId, item, total, this.cartService.globalDiscountAmount());
      }

      // 3. Rechnung validieren (wird offiziell gebucht)
      await this.invoiceService.validate(invoiceId);

      // 4. Zahlung erfassen (nur bei Cash oder sofortiger Rechnung, nicht bei 'invoice' als Zahlungsziel)
      if (config.type !== 'invoice') {
        await this.invoiceService.addPayment(invoiceId, config.paidAmount, config.type);
      }

      // 5. optionaler Belegdruck & Upload
      if (config.type === 'cash' && config.printReceipt) {
        await this.handleReceiptPrinting(invoiceId, items, total, config.customer.name);
      }

      return invoiceId;

    } catch (error) {
      // Rollback: Falls die Rechnung noch ein Entwurf ist, löschen wir sie bei Fehlern
      if (invoiceId) {
        console.warn(`Fehler im Prozess. Versuche Rollback für Rechnung ${invoiceId}`);
        await this.invoiceService.deleteInvoice(invoiceId).catch(e => console.error('Rollback failed', e));
      }
      throw error;
    }
  }

  /**
   * Erzeugt das PDF und lädt es zu Dolibarr hoch
   */
  private async handleReceiptPrinting(invoiceId: string, items: CartItem[], total: number, customerName: string) {
    try {
      const invoice = await this.invoiceService.getInvoiceById(invoiceId);
      const base64Receipt = await this.printService.generateAndUploadReceipt(
        invoiceId, 
        invoice.ref, 
        items, 
        total, 
        customerName
      );

      await this.documentService.uploadFile(
        'invoice', 
        invoice.ref, 
        base64Receipt, 
        `Kassenbeleg_${invoice.ref}.pdf`
      );
    } catch (printError) {
      console.error('Druckvorgang/Upload fehlgeschlagen:', printError);
      // Wir werfen keinen Fehler, da die Rechnung in Dolibarr bereits valide ist.
    }
  }
}