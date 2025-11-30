// src/utils/ReceiptPrinter.js
export class ReceiptPrinter {
  constructor() {
    this.lineWidth = 64; // Standard Thermodrucker Breite (64 Zeichen)
    this.fontSize = '12px';
  }

  // Text zentrieren
  centerText(text) {
    const padding = Math.max(0, Math.floor((this.lineWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Text rechtsbündig ausrichten
  rightAlign(text) {
    const padding = Math.max(0, this.lineWidth - text.length);
    return ' '.repeat(padding) + text;
  }

  // Linie erstellen
  createLine(char = '-') {
    return char.repeat(this.lineWidth);
  }

  // Zwei Texte links und rechts ausrichten
  leftRight(left, right) {
    const totalLength = left.length + right.length;
    const padding = Math.max(1, this.lineWidth - totalLength);
    return left + ' '.repeat(padding) + right;
  }

  // Preis formatieren
  formatPrice(price) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  // Datum formatieren
  formatDateTime(date = new Date()) {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  // Hauptfunktion zum Erstellen des Kassenbons
  generateReceipt(receiptData) {
    const {
      companyInfo = {},
      invoiceNumber,
      customer = null,
      items = [],
      totals: {
        subtotal = 0,
        tax = 0,
        total = 0,
        discount = 0
      } = {},
      payment = {},
      cashier = 'System',
      receiptNumber = null
    } = receiptData;

    let receipt = [];

    // Header - Firmeninfo
    receipt.push('');
    if (companyInfo) {
      if (companyInfo.name && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(companyInfo.name.toUpperCase()));
      }
      if (companyInfo.address && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(companyInfo.address));
      }
      if (companyInfo.zip && typeof companyInfo.name === 'string' && companyInfo.city && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(`${companyInfo.zip} ${companyInfo.city}`));
      }
      if (companyInfo.phone && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(`Tel: ${companyInfo.phone}`));
      }
      if (companyInfo.email && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(companyInfo.email));
      }
      if (companyInfo.vatNumber && typeof companyInfo.name === 'string') {
        receipt.push(this.centerText(`USt-IdNr: ${companyInfo.vatNumber}`));
      }
    }
    receipt.push('');
    receipt.push(this.createLine('='));
    receipt.push(this.centerText('KASSENBELEG'));
    receipt.push(this.createLine('='));

    // Rechnungs- und Beleginfos
    receipt.push('');
    receipt.push(`Datum: ${this.formatDateTime()}`);
    if (invoiceNumber) {
      receipt.push(`Rechnung: ${invoiceNumber}`);
    }
    if (receiptNumber) {
      receipt.push(`Beleg: ${receiptNumber}`);
    }
    receipt.push(`Kasse: ${cashier}`);

    // Kundeninformation
    if (customer && customer.name) {
      receipt.push('');
      receipt.push(`Kunde: ${customer.name}`);
      if (customer.address) {
        receipt.push(`       ${customer.address}`);
      }
      if (customer.zip && customer.city) {
        receipt.push(`       ${customer.zip} ${customer.city}`);
      }
    }

    receipt.push('');
    receipt.push(this.createLine('-'));

    // Artikel
    // Vorher: taxGroups sammeln
    const taxGroups = {};
    items.filter(item => item.tva_tx > 0)
    .forEach(item => {
      const taxRate = item.tva_tx || 0;
      const qty = item.quantity || 1;
      const price = item.multicurrency_total_ttc / qty || 0;
      const total = qty * price;
      const net = total / (1 + taxRate / 100);
      const taxAmount = price - net
      if (!taxGroups[taxRate]) {
        taxGroups[taxRate] = { net: 0, tax: 0 };
      }
      taxGroups[taxRate].net += net;
      taxGroups[taxRate].tax += taxAmount;
    });

    // Kennungen vergeben
    const rateLabels = {};
    Object.keys(taxGroups).forEach((rate, index) => {
      rateLabels[rate] = String.fromCharCode(65 + index); // A, B, C ...
    });

    items.forEach(item => {
      let name = item.product_label || '';
      if (name === '') {
        name = item.desc || '';
        if (name !== '') {
          receipt.push(name);
        }
      }
      else {
      const qty = item.quantity || 1;
      const price = item.multicurrency_total_ttc / qty || 0;
      const total = qty * price;



      // Artikelname (ggf. gekürzt)
      const maxNameLength = this.lineWidth - 2;
      const displayName = name.length > maxNameLength
        ? name.substring(0, maxNameLength - 3) + '...'
        : name;
      receipt.push(displayName);

      // Menge x Einzelpreis = Gesamtpreis
      //auskommentiert - wenn der Rabatt je Artikel angezeigt werden soll wieder einkommentieren
      // const qtyLine = `${qty.toFixed(2)} x ${this.formatPrice(price)} (enthält ${item.remise_percent}% Rabatt)`;
      const qtyLine = `${qty.toFixed(2)} x ${this.formatPrice(price)}`;
      const totalPrice = this.formatPrice(total);
      const label = rateLabels[item.tva_tx];      
      const priceLine =  totalPrice + ' ' + label;
      receipt.push(this.leftRight(qtyLine, priceLine));

      // Leerzeile zwischen Artikeln
      receipt.push('');
      }
    });
  

    receipt.push(this.createLine('-'));

    // Summen

    receipt.push(this.leftRight('Summe EUR:', this.formatPrice(total)));

    //Steuergruppen
    receipt.push('');
    receipt.push('Steuerübersicht:');
    for (const [rate, amounts] of Object.entries(taxGroups)) {
      receipt.push(this.leftRight(
        `inkl. ${parseFloat(rate).toFixed(0)}% MwSt. auf ${this.formatPrice(amounts.net)}`,
        this.formatPrice(amounts.tax)
      ));
    }
    // Zahlungsinformation
    receipt.push('');
    const paymentMethod = payment.method || 'Bargeld';
    receipt.push(this.leftRight(`Bezahlt ${paymentMethod}:`, this.formatPrice(payment.amount || total)));

    if (payment.change && payment.change > 0) {
      receipt.push(this.leftRight('Rückgeld:', this.formatPrice(payment.change)));
    }

    // Footer
    receipt.push('');
    receipt.push(this.createLine('-'));
    receipt.push(this.centerText('Vielen Dank'));
    receipt.push(this.centerText('für Ihren Einkauf'));
    receipt.push('');

    // Rechtliche Hinweise

    if (companyInfo && companyInfo.taxInfo) {
      receipt.push(this.centerText(companyInfo.taxInfo));
      receipt.push('');
    }

    // QR-Code Platzhalter (für spätere Implementierung)
    if (invoiceNumber) {
      receipt.push(this.centerText('[QR-Code hier]'));
      receipt.push(this.centerText(`Rechnung: ${invoiceNumber}`));
      receipt.push('');
    }

    // Abschließende Leerzeilen für Papierabschnitt
    receipt.push('');
    receipt.push('');
    receipt.push('');

    return receipt.join('\n');
  }

  // HTML-Version für Vorschau
  generateReceiptHTML(receiptData) {
    const textReceipt = this.generateReceipt(receiptData);

    return `
      <div style="
        font-family: 'Courier New', monospace;
        font-size: ${this.fontSize};
        line-height: 1.2;
        white-space: pre;
        max-width: ${this.lineWidth}ch;
        margin: 0 auto;
        padding: 20px;
        background: white;
        color: black;
        border: 1px solid #ccc;
      ">
        ${textReceipt}
      </div>
    `;
  }

  // Druckfunktion für Browser
  async printReceipt(receiptData) {
    const htmlContent = this.generateReceiptHTML(receiptData);

    // Neues Fenster für Druck
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kassenbeleg - ${receiptData.invoiceNumber || 'Rechnung'}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 80mm auto; margin: 0; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${this.fontSize};
              line-height: 1.2;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ESC/POS Befehle für echte Thermodrucker
  generateESCPOS(receiptData) {
    const textReceipt = this.generateReceipt(receiptData);

    // ESC/POS Befehle
    const ESC = '\x1B';
    const commands = {
      init: ESC + '@',           // Drucker initialisieren
      centerAlign: ESC + 'a1',   // Zentriert
      leftAlign: ESC + 'a0',     // Linksbündig
      rightAlign: ESC + 'a2',    // Rechtsbündig
      bold: ESC + 'E1',          // Fett ein
      boldOff: ESC + 'E0',       // Fett aus
      cut: ESC + 'd3' + ESC + 'i', // Papier schneiden
      lineFeed: '\n'
    };

    let escpos = commands.init;
    escpos += commands.leftAlign;

    // Text hinzufügen
    escpos += textReceipt;

    // Papier schneiden
    escpos += commands.cut;

    return escpos;
  }

  // Blob für Download erstellen
  createReceiptBlob(receiptData, format = 'txt') {
    let content, mimeType, extension;

    switch (format) {
      case 'html':
        content = this.generateReceiptHTML(receiptData);
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'escpos':
        content = this.generateESCPOS(receiptData);
        mimeType = 'application/octet-stream';
        extension = 'prn';
        break;
      default:
        content = this.generateReceipt(receiptData);
        mimeType = 'text/plain';
        extension = 'txt';
    }

    return {
      blob: new Blob([content], { type: mimeType }),
      filename: `kassenbeleg_${receiptData.invoiceNumber || Date.now()}.${extension}`
    };
  }

  // Download-Funktion
  downloadReceipt(receiptData, format = 'txt') {
    const { blob, filename } = this.createReceiptBlob(receiptData, format);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}