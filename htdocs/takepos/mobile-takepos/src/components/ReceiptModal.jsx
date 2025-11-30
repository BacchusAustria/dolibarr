// src/components/ReceiptModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Printer, Download, Eye, X, FileText } from 'lucide-react';
import { ReceiptPrinter } from '../utils/ReceiptPrinter';
import { useInvoiceData } from '../hooks/useInvoiceData';
import { useSettings } from '../hooks/useSettings';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  invoiceData, // Dies sind die bereits geladenen Daten aus PaymentView
  customer = null,
  payment = {}, 
  apiKey
}) => {
  const [receiptPreview, setReceiptPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const { companyInfo } = useSettings(); // Beispiel, wie Unternehmensinfo geholt werden könnte
const { 
    invoiceData: fullInvoiceData, // Umbenannt, um Verwirrung zu vermeiden
    fetchInvoiceData, 
    generateReceiptData 
  } = useInvoiceData(apiKey, invoiceData);

  const receiptPrinter = React.useMemo(() => {
    try {
      return new ReceiptPrinter();
    } catch (error) {
      console.error('Failed to initialize ReceiptPrinter:', error);
      return null;
    }
  }, []);

  // 1. useEffect: Lade die vollständigen Rechnungsdaten, wenn das Modal geöffnet wird
  useEffect(() => {
    if (isOpen && invoiceData?.id) {
      fetchInvoiceData(invoiceData.id);
    }
  }, [isOpen, invoiceData, fetchInvoiceData]);

  // 2. useEffect: Generiere den Beleg erst, wenn die vollständigen Daten geladen sind
  useEffect(() => {
    // Wichtig: Jetzt prüfen wir auf `fullInvoiceData` aus dem Hook-State
    if (fullInvoiceData && receiptPrinter) {
      const receiptData = generateReceiptData(companyInfo, customer, payment);
      
      if (receiptData) {
        const preview = receiptPrinter.generateReceipt(receiptData);
        setReceiptPreview(preview);
      } else {
        setReceiptPreview('Fehler beim Erstellen der Belegvorschau.');
      }
    }
  }, [fullInvoiceData, receiptPrinter, generateReceiptData, companyInfo, customer, payment]);

  // Kassenbon drucken
  const handlePrint = React.useCallback(async () => {
    setIsPrinting(true);
    try {
      const receiptData = generateReceiptData(companyInfo, customer, payment);
      if (receiptData) {
        await receiptPrinter.printReceipt(receiptData);
      }
    } catch (error) {
      console.error('Druckfehler:', error);
      alert('Fehler beim Drucken: ' + error.message);
    } finally {
      setIsPrinting(false);
    }
  }, [receiptPrinter, generateReceiptData, companyInfo, customer, payment]);

  // Download als verschiedene Formate
  const handleDownload = (format) => {
    const receiptData = generateReceiptData(companyInfo, customer, payment);
    if (receiptData) {
      receiptPrinter.downloadReceipt(receiptData, format);
    }
  };

  // Vorschau umschalten
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Kassenbeleg erstellen</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info-Bereich */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Rechnung #{invoiceData?.reference || invoiceData?.id}</strong>{' '}wurde erfolgreich erstellt.
              {customer?.name && (
                <> Kunde: <strong>{customer.name}</strong></>
              )}
            </p>
          </div>

          <>
            {/* Aktionen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Drucken */}
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className={`w-6 h-6 mb-2 ${isPrinting ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="text-sm font-medium text-gray-800">{isPrinting ? 'Druckt...' : 'Drucken'}</span>
              </button>

              {/* Vorschau */}
              <button
                onClick={togglePreview}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-6 h-6 mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Vorschau</span>
              </button>

              {/* Download TXT */}
              <button
                onClick={() => handleDownload('txt')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-6 h-6 mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">TXT</span>
              </button>

              {/* Download HTML */}
              <button
                onClick={() => handleDownload('html')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-6 h-6 mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">HTML</span>
              </button>
            </div>

            {/* Vorschau-Bereich */}
            {showPreview && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                  <h3 className="font-medium text-gray-800">Kassenbeleg Vorschau</h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div
                    className="font-mono text-xs leading-tight whitespace-pre border border-gray-200 p-3 bg-white"
                    style={{ maxWidth: '68ch', fontFamily: 'Courier New, monospace', fontSize: '12px' }}
                  >
                    {receiptPreview}
                  </div>
                </div>
              </div>
            )}

            {/* Zusätzliche Optionen */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-800 mb-3">Erweiterte Optionen</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleDownload('escpos')}
                  className="w-full text-left p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-800">ESC/POS Format</div>
                      <div className="text-xs text-gray-600">Für direkte Thermodrucker-Ansteuerung</div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Hinweise */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-1">Hinweise:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Der Kassenbeleg entspricht dem Standard für Thermodrucker (64 Zeichen breit)</li>
                <li>• ESC/POS Format für direkte Drucker-Integration verfügbar</li>
                <li>• HTML-Format für bessere Darstellung und Archivierung</li>
              </ul>
            </div>
          </>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Schließen
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? 'Drucke...' : 'Jetzt drucken'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;