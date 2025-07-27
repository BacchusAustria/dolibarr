// src/components/ProductModal.jsx
import React from 'react';
import { Plus, Minus, X } from 'lucide-react';

export default function ProductModal({ product, tempProduct, setTempProduct, addProductFromModal, onClose }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{product.image}</div>
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="text-gray-600">Standardpreis: {product.price.toFixed(2)}€</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="modal-quantity" className="block text-sm font-medium mb-1">Menge</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTempProduct(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                <Minus size={16} />
              </button>
              <input
                id="modal-quantity"
                type="number"
                value={tempProduct.quantity}
                onChange={(e) => setTempProduct(prev => ({...prev, quantity: Math.max(1, parseInt(e.target.value) || 1)}))}
                className="flex-1 text-center border rounded px-3 py-2"
                min="1"
              />
              <button
                onClick={() => setTempProduct(prev => ({...prev, quantity: prev.quantity + 1}))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="modal-price" className="block text-sm font-medium mb-1">Preis pro Stück</label>
            <input
              id="modal-price"
              type="number"
              value={tempProduct.price}
              onChange={(e) => setTempProduct(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
              className="w-full border rounded px-3 py-2 text-right"
              step="0.01"
              min="0"
            />
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between font-medium">
              <span>Gesamtpreis:</span>
              <span>{(tempProduct.quantity * tempProduct.price).toFixed(2)}€</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={addProductFromModal}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}