// src/components/PaymentView.jsx
import React, { useState } from 'react';
import { X, Printer, CreditCard, Receipt } from 'lucide-react';
import ReceiptModal from './ReceiptModal';

export default function PaymentView({
  cartItems,
  subtotal,
  globalDiscount,
  globalDiscountAmount,
  cartTotal,
  paymentAmount,
  setPaymentAmount,
  printReceipt,
  setPrintReceipt,
  completeTransaction,
  calculateItemTotal,
  onClose,
  customer = null,
  companyInfo = {},
  resetCart,           // Funktion zum Zurücksetzen des Warenkorbs
  setSelectedCustomer,  // Funktion zum Zurücksetzen des Kunden
  apiKey
}) {
  // Neue State-Variablen für Kassenbon-Feature
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  React.useEffect(() => {
    // Only format when input is complete (when paymentAmount changes)
    if (paymentAmount !== '' && !isNaN(paymentAmount)) {
      const parsedAmount = parseFloat(paymentAmount);
      // Only format if the last character isn't a decimal point
      // This allows users to type decimal numbers
      if (!paymentAmount.toString().endsWith('.')) {
        if (parsedAmount < 0) {
          setPaymentAmount('0.00');
        } else {
          // Only format if there's a significant change
          const formatted = parsedAmount.toFixed(2);
          if (parseFloat(formatted) !== parseFloat(paymentAmount)) {
            setPaymentAmount(formatted);
          }
        }
      }
    }
  }, [paymentAmount, setPaymentAmount]);

  const changeAmount = paymentAmount
    ? parseFloat((parseFloat(paymentAmount)).toFixed(2)) - parseFloat(cartTotal.toFixed(2))
    : 0;

  // Erweiterte Funktion zum Abschließen der Zahlung
  // KORRIGIERTE handleCompleteTransaction Funktion in PaymentView.jsx
const handleCompleteTransaction = async () => {
  const actualPaymentAmount = paymentAmount && parseFloat(paymentAmount) < cartTotal 
    ? cartTotal.toFixed(2) 
    : paymentAmount;
  
  setIsProcessingPayment(true);
  
  try {
    // completeTransaction aufrufen und auf Ergebnis warten
    const result = await completeTransaction(actualPaymentAmount);
    
    if (result) {
      // Erfolgreich: Daten für Kassenbon vorbereiten
      setCompletedInvoice(result.invoice);
      setLastPayment(result.payment);

      // Kassenbon-Modal automatisch anzeigen bei Erfolg
      if (printReceipt && !result.error) {
        setShowReceiptModal(true);
      }

      // ⚠️ WICHTIG: Reset hier manuell durchführen
      // Da completeTransaction jetzt keinen automatischen Reset mehr macht
      resetCart();
      setPaymentAmount('');
      
      // selectedCustomer Reset nur bei erfolgreicher Online-Transaktion
      if (!result.offline) {
        setSelectedCustomer(null);
      }

      // Success-Nachricht
      const successMessage = result.error 
        ? '⚠️ Transaktion offline gespeichert'
        : '✅ Transaktion erfolgreich abgeschlossen!';
      
      console.log(successMessage, result);

    } else {
      // Kein Ergebnis (z.B. bei Neuanmeldung) - kein Reset
      console.log('Transaktion abgebrochen oder Neuanmeldung erforderlich');
    }

  } catch (error) {
    console.error('Zahlungsfehler:', error);
    alert('Fehler bei der Zahlungsverarbeitung: ' + error.message);
  } finally {
    setIsProcessingPayment(false);
  }
};

// Kassenbon-Modal schließen mit korrekter Navigation
const handleReceiptModalClose = () => {
  setShowReceiptModal(false);
  // Nach dem Schließen zurück zur Hauptansicht
  setTimeout(() => {
    if (onClose) {
      onClose(); // Zurück zu main view
    }
  }, 100); // Kurze Verzögerung für smooth UX
};

  // Kassenbon später anzeigen (falls Modal geschlossen wurde)
  const showReceiptAgain = () => {
    if (completedInvoice) {
      setShowReceiptModal(true);
    }
  };

  // Kartenzahlung für alle Artikel vorbereiten
  const prepareCartItemsForReceipt = () => {
    return cartItems.map(item => ({
      name: item.label || item.name,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || { value: 0, type: 'none' }
    }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h2 className="text-lg font-bold">Zahlung</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Kundeninformation */}
        {customer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-medium text-blue-800 mb-1">Kunde</h3>
            <p className="text-sm text-blue-700">{customer.name}</p>
            {customer.email && (
              <p className="text-xs text-blue-600">{customer.email}</p>
            )}
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">Rechnungsübersicht</h3>
          <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{calculateItemTotal(item).toFixed(2)}€</span>
                </div>
                {item.discount && item.discount.value > 0 && (
                  <div className="text-xs text-orange-600 ml-4">
                    Rabatt: -{item.discount.type === 'percent' 
                      ? `${item.discount.value}% (${((item.price * item.quantity) - calculateItemTotal(item)).toFixed(2)}€)`
                      : `${item.discount.value}€`}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Zwischensumme:</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>
            {globalDiscount.value > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Gesamtrabatt ({globalDiscount.value}{globalDiscount.type === 'percent' ? '%' : '€'}):</span>
                <span>-{globalDiscountAmount.toFixed(2)}€</span>
              </div>
            )}
            <div className="border-t pt-1 font-bold flex justify-between">
              <span>Gesamt:</span>
              <span>{cartTotal.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label htmlFor="payment-amount" className="block text-sm font-medium mb-2">
            Erhaltener Betrag (optional für Wechselgeld-Berechnung)
          </label>
          <input
            id="payment-amount"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-4 border-2 rounded-xl text-2xl text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isProcessingPayment}
          />
          
          <div className="grid grid-cols-4 gap-3 mt-4">
            <button
              onClick={() => setPaymentAmount(cartTotal.toFixed(2).toString())}
              className="p-3 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium hover:bg-blue-200 active:scale-95 transition-all"
              disabled={isProcessingPayment}
            >
              Passend
            </button>
            <button
              onClick={() => setPaymentAmount((Math.ceil(cartTotal / 5) * 5).toFixed(2).toString())}
              className="p-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
              disabled={isProcessingPayment}
            >
              {(Math.ceil(cartTotal / 5) * 5).toFixed(2)}€
            </button>
            <button
              onClick={() => setPaymentAmount((Math.ceil(cartTotal / 10) * 10).toFixed(2).toString())}
              className="p-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
              disabled={isProcessingPayment}
            >
              {(Math.ceil(cartTotal / 10) * 10).toFixed(2)}€
            </button>
            <button
              onClick={() => setPaymentAmount((Math.ceil(cartTotal / 20) * 20).toFixed(2).toString())}
              className="p-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
              disabled={isProcessingPayment}
            >
              {(Math.ceil(cartTotal / 20) * 20).toFixed(2)}€
            </button>
          </div>
        </div>

        {paymentAmount && (
          <div className={`p-4 rounded-lg ${
            changeAmount >= 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {changeAmount >= 0 ? 'Wechselgeld:' : 'Fehlbetrag:'}
              </span>
              <span className={`text-xl font-bold ${
                changeAmount >= 0 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {Math.abs(changeAmount).toFixed(2)}€
              </span>
            </div>
            {changeAmount < 0 && (
              <p className="text-orange-600 text-sm mt-1">
                Hinweis: Bei Zahlungsabschluss wird automatisch der Rechnungsbetrag verwendet.
              </p>
            )}
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label htmlFor="print-receipt-checkbox" className="flex items-center space-x-3">
            <input
              id="print-receipt-checkbox"
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-5 h-5 text-blue-600"
              disabled={isProcessingPayment}
            />
            <span className="flex items-center space-x-2">
              <Printer size={18} />
              <span>Kassenbeleg automatisch anzeigen</span>
            </span>
          </label>
        </div>

        {/* Erfolgsbereich nach abgeschlossener Zahlung */}
        {completedInvoice && !showReceiptModal && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Zahlung erfolgreich!</h3>
                <p className="text-sm text-green-700">
                  Rechnung {completedInvoice.reference || completedInvoice.id} wurde erstellt
                </p>
              </div>
            </div>
            
            <button
              onClick={showReceiptAgain}
              className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Kassenbeleg erstellen
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 shadow-lg">
        <button
          onClick={handleCompleteTransaction}
          disabled={isProcessingPayment}
          className="w-full py-5 rounded-xl font-bold text-xl bg-green-500 text-white hover:bg-green-600 active:scale-98 transition-all touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-2">
            {isProcessingPayment ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Zahlung wird verarbeitet...</span>
              </>
            ) : (
              <>
                <CreditCard size={20} />
                <span>Zahlung abschließen ({cartTotal.toFixed(2)}€)</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Kassenbeleg Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={handleReceiptModalClose}
        invoiceData={completedInvoice}
        companyInfo={companyInfo}
        customer={customer}
        payment={lastPayment}
        apiKey={apiKey} 
      />
    </div>
  );
}