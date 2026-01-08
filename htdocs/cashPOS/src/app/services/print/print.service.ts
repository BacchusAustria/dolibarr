// src/app/services/print/print.service.ts
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CartItem } from '../../models/cart.model';

@Injectable({ providedIn: 'root' })
export class PrintService {

  async generateAndUploadReceipt(invoiceId: string, ref: string, items: CartItem[], total: number, customerName: string): Promise<string> {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150 + (items.length * 10)] 
    });

    let y = 10;
    const margin = 5;
    const width = 70;

    // --- Header ---
    doc.setFontSize(12);
    doc.text("KASSENBELEG", width / 2 + margin, y, { align: 'center' });
    y += 7;
    doc.setFontSize(8);
    doc.text(`Rechnung: ${ref}`, margin, y);
    y += 5;
    doc.text(`Datum: ${new Date().toLocaleString('de-AT')}`, margin, y);
    y += 5;
    doc.text(`Kunde: ${customerName}`, margin, y);
    y += 7;

    // --- Tabelle Header ---
    doc.line(margin, y, margin + width, y);
    y += 4;
    doc.text("Pos. (MwSt)", margin, y);
    doc.text("Gesamt", margin + width, y, { align: 'right' });
    y += 4;
    doc.line(margin, y, margin + width, y);
    y += 6;

    // --- Dynamische Steuer-Logik ---
    const taxSummary: { [key: number]: { code: string, rate: number, gross: number, net: number, tax: number } } = {};
    let nextCodeIndex = 0;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    items.forEach(item => {
      const rate = item.tva_tx ?? 0; // Fallback auf 0% falls undefined
      
      // Prüfen, ob dieser Steuersatz bereits einen Code (A, B, C...) hat
      if (taxSummary[rate] === undefined) {
        taxSummary[rate] = {
          code: alphabet[nextCodeIndex] || '?', 
          rate: rate,
          gross: 0,
          net: 0,
          tax: 0
        };
        nextCodeIndex++;
      }

      const currentTaxGroup = taxSummary[rate];
      const itemTotal = item.price * item.quantity;

      // Position im Beleg drucken
      doc.text(`${item.quantity}x ${item.label.substring(0, 25)} `, margin, y);
      doc.text(`${itemTotal.toFixed(2)}€ (${currentTaxGroup.code})`, margin + width, y, { align: 'right' });
      y += 5;

      // Berechnungen für die Zusammenfassung
      const net = itemTotal / (1 + rate / 100);
      currentTaxGroup.gross += itemTotal;
      currentTaxGroup.net += net;
      currentTaxGroup.tax += (itemTotal - net);
    });

    // --- Summe ---
    y += 2;
    doc.line(margin, y, margin + width, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GESAMTSUMME (Brutto)", margin, y);
    doc.text(`${total.toFixed(2)}€`, margin + width, y, { align: 'right' });
    
    // --- MwSt Aufschlüsselung ---
    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("MwSt-Aufschlüsselung:", margin, y);
    y += 5;

    // Sortiere die Steuersätze nach Code (A, B, C...) für die Ausgabe
    const sortedTaxGroups = Object.values(taxSummary).sort((a, b) => a.code.localeCompare(b.code));

    sortedTaxGroups.forEach(g => {
        const formattedRate = Number(g.rate).toLocaleString('de-AT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      const text = `${g.code}=${formattedRate}% | Netto: ${g.net.toFixed(2)}€ | MwSt: ${g.tax.toFixed(2)}€`;
      doc.text(text, margin, y);
      y += 4;
    });

    // --- Footer ---
    y += 5;
    doc.setFontSize(7);
    doc.text("Vielen Dank für Ihren Einkauf!", width / 2 + margin, y, { align: 'center' });

    // --- PDF Handling ---
    doc.autoPrint();
    const blobUrl = URL.createObjectURL(doc.output('blob'));
    window.open(blobUrl, '_blank');

    return doc.output('datauristring').split(',')[1];
  }
}