// src/hooks/useInvoiceData.js
import { useState, useEffect } from 'react';
import { api } from '../api';

/**
 * Ein React Hook zur Verwaltung von Rechnungs- und Belegdaten.
 * @param {string} apiKey - Der API-Schlüssel für Dolibarr.
 */
export function useInvoiceData(apiKey) {
  const [invoiceData, setInvoiceData] = useState();
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  /**
   * Ruft detaillierte Rechnungsdaten von der Dolibarr API ab.
   * @param {number} invoiceId - Die ID der Rechnung, die geladen werden soll.
   */
  

  const fetchInvoiceData = async (invoiceId) => {
    if (!invoiceId) {
      setDataError('Keine Rechnungs-ID zum Laden angegeben.');
      return;
    }
    
    setDataLoading(true);
    setDataError(null);

    try {
      const details = await api.getInvoiceDetails(apiKey, invoiceId);
      setInvoiceData(details);
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungsdaten:', error);
      setDataError(error);
      setInvoiceData(null);
    } finally {
      setDataLoading(false);
    }
  };

  /**
   * Generiert ein strukturiertes Objekt für den Kassenbeleg.
   * @param {object} companyInfo - Informationen zum eigenen Unternehmen.
   * @param {object} customer - Der Kunde der Transaktion.
   * @param {object} payment - Das Zahlungsobjekt.
   * @param {number} globalDiscountAmount - Der Betrag des globalen Rabatts.
   * @returns {object|null} Das vorbereitete Belegobjekt oder null, wenn keine Daten vorhanden sind.
   */
  const generateReceiptData = (companyInfo, customer, payment, globalDiscountAmount = 0) => {

    if (!invoiceData) return null;

    // 1. Artikeldaten für den Beleg aufbereiten
    const receiptItems = invoiceData.lines.map(item => ({
      ...item,
      price: parseFloat(item.subprice), // Dolibarr liefert den Bruttopreis als total_ttc
      discount: parseFloat(item.remise_percent || 0), // Annahme: Rabatt in %
      quantity: parseFloat(item.qty)
    }));

    // 2. Steuersätze und Summen gruppieren
    const vatSummary = {};
    invoiceData.lines
    .filter(line => line.tva_tx > 0)
    .forEach(line => {
      const vatRate = line.tva_tx;
      if (!vatSummary[vatRate]) {
        vatSummary[vatRate] = {
          taxableBase: 0, // Basis (Netto)
          taxAmount: 0 // Steuerbetrag
        };
      }
      vatSummary[vatRate].taxableBase += parseFloat(line.total_ht);
      vatSummary[vatRate].taxAmount += parseFloat(line.total_tva);
    });
    
    // 3. Totale neu berechnen unter Berücksichtigung des globalen Rabatts
    const subtotal = parseFloat(invoiceData.total_ht);
    const tax = parseFloat(invoiceData.tva);
    const total = parseFloat(invoiceData.total_ttc);

    // 4. Rückgabe des finalen Objekts für den `ReceiptPrinter`
    return {
      invoiceNumber: invoiceData.ref,
      date: new Date(invoiceData.date_creation * 1000),
      customer: customer,
      payment: payment,
      items: receiptItems,
      totals: {
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount: globalDiscountAmount // Globaler Rabatt separat ausweisen
      },
      vatSummary: vatSummary, // Gruppierte Steuersätze
      companyInfo: companyInfo
    };
  };

  return {
    invoiceData,
    dataLoading,
    dataError,
    fetchInvoiceData,
    generateReceiptData,
    isReady: !dataLoading && !dataError && !!invoiceData
  };
}