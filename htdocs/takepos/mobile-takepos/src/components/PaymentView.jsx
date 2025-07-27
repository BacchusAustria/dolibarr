// src/components/PaymentView.jsx
import React from 'react';
import { X, Printer, CreditCard } from 'lucide-react';

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
  onClose
}) {
  const changeAmount = paymentAmount ? (parseFloat(paymentAmount) - cartTotal) : 0;

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
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">Rechnungsübersicht</h3>
          <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{calculateItemTotal(item).toFixed(2)}€</span>
                </div>
                {item.discount.value > 0 && (
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
            Erhaltener Betrag
          </label>
          <input
            id="payment-amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full p-3 border rounded-lg text-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={() => setPaymentAmount(cartTotal.toFixed(2).toString())}
              className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              Passend
            </button>
            <button
              onClick={() => setPaymentAmount((Math.ceil(cartTotal / 5) * 5).toFixed(2).toString())}
              className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              Auf 5€
            </button>
            <button
              onClick={() => setPaymentAmount((Math.ceil(cartTotal / 10) * 10).toFixed(2).toString())}
              className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              Auf 10€
            </button>
          </div>
        </div>

        {paymentAmount && (
          <div className={`p-4 rounded-lg ${
            changeAmount >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Wechselgeld:</span>
              <span className={`text-xl font-bold ${
                changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeAmount.toFixed(2)}€
              </span>
            </div>
            {changeAmount < 0 && (
              <p className="text-red-600 text-sm mt-1">
                Betrag zu niedrig!
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
            />
            <span className="flex items-center space-x-2">
              <Printer size={18} />
              <span>Beleg drucken</span>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white p-4 shadow-lg">
        <button
          onClick={completeTransaction}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            !paymentAmount || parseFloat(paymentAmount) < cartTotal
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
          }`}
          disabled={!paymentAmount || parseFloat(paymentAmount) < cartTotal}
        >
          <div className="flex items-center justify-center space-x-2">
            <CreditCard size={20} />
            <span>Zahlung abschließen</span>
          </div>
        </button>
      </div>
    </div>
  );
}