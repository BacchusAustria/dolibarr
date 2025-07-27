// src/components/DiscountModal.jsx
import React from 'react';
import { Percent } from 'lucide-react';

export default function DiscountModal({
  discountModal,
  setDiscountModal,
  applyDiscount,
  cartItems,
  subtotal,
  globalDiscountAmount,
  calculateItemTotal,
  onClose
}) {
  if (!discountModal) return null;

  const itemToDiscount = discountModal.type === 'item' ? cartItems[discountModal.index] : null;

  const calculateDiscountedValue = () => {
    if (discountModal.type === 'item' && itemToDiscount) {
      const base = itemToDiscount.price * itemToDiscount.quantity;
      if (discountModal.discountType === 'percent') {
        return base * (1 - discountModal.value / 100);
      } else {
        return Math.max(0, base - discountModal.value);
      }
    } else if (discountModal.type === 'global') {
      const base = subtotal;
      if (discountModal.discountType === 'percent') {
        return base * (1 - discountModal.value / 100);
      } else {
        return Math.max(0, base - discountModal.value);
      }
    }
    return 0;
  };

  const currentDiscountAmount = discountModal.type === 'item' && itemToDiscount
    ? (itemToDiscount.price * itemToDiscount.quantity) - calculateDiscountedValue()
    : subtotal - calculateDiscountedValue();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">
            <Percent className="mx-auto text-orange-500" size={32} />
          </div>
          <h3 className="text-lg font-bold">
            {discountModal.type === 'item' ? 'Positionsrabatt' : 'Gesamtrabatt'}
          </h3>
          {discountModal.type === 'item' && itemToDiscount && (
            <p className="text-gray-600 text-sm mt-1">
              {itemToDiscount.name}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rabatt-Art</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setDiscountModal(prev => ({...prev, discountType: 'percent'}))}
                className={`flex-1 py-2 px-3 rounded border ${
                  discountModal.discountType === 'percent' 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Prozent (%)
              </button>
              <button
                onClick={() => setDiscountModal(prev => ({...prev, discountType: 'euro'}))}
                className={`flex-1 py-2 px-3 rounded border ${
                  discountModal.discountType === 'euro' 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Euro (€)
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Rabatt-Wert {discountModal.discountType === 'percent' ? '(%)' : '(€)'}
            </label>
            <input
              type="number"
              value={discountModal.value}
              onChange={(e) => setDiscountModal(prev => ({...prev, value: parseFloat(e.target.value) || 0}))}
              className="w-full border rounded px-3 py-2 text-right"
              step={discountModal.discountType === 'percent' ? '1' : '0.01'}
              min="0"
              max={discountModal.discountType === 'percent' ? '100' : undefined}
              placeholder="0"
            />
          </div>
          
          {discountModal.type === 'item' && itemToDiscount && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Ursprünglich:</span>
                  <span>{(itemToDiscount.price * itemToDiscount.quantity).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Rabatt:</span>
                  <span className="text-orange-600">
                    -{currentDiscountAmount.toFixed(2)}€
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Neu:</span>
                  <span>{calculateDiscountedValue().toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
          
          {discountModal.type === 'global' && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Rabatt:</span>
                  <span className="text-orange-600">
                    -{currentDiscountAmount.toFixed(2)}€
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Gesamt:</span>
                  <span>{calculateDiscountedValue().toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={applyDiscount}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Anwenden
          </button>
        </div>
      </div>
    </div>
  );
}