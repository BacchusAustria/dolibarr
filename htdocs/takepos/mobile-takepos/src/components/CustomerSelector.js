// src/components/CustomerSelector.jsx
import React from 'react';
import { Search, X, User, Check } from 'lucide-react';

export default function CustomerSelector({
  customerList,
  selectedCustomer,
  setSelectedCustomer,
  customerSearchTerm,
  setCustomerSearchTerm,
  onClose
}) {
  const filteredCustomers = customerList.filter(customer => {
    if (!customerSearchTerm) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h2 className="text-lg font-bold">Kunde auswählen</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Kunde suchen..."
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              onClick={() => {
                setSelectedCustomer(customer);
                setCustomerSearchTerm('');
                onClose();
              }}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedCustomer.id === customer.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{customer.name}</span>
                  {customer.company && (
                    <div className="text-sm text-gray-500 truncate">{customer.company}</div>
                  )}
                  {customer.email && (
                    <div className="text-xs text-gray-400 truncate">{customer.email}</div>
                  )}
                </div>
                {selectedCustomer.id === customer.id && (
                  <Check className="text-blue-500 flex-shrink-0 ml-2" size={20} />
                )}
              </div>
            </button>
          ))}
          
          {filteredCustomers.length === 0 && customerSearchTerm && (
            <div className="text-center py-8 text-gray-500">
              <User size={48} className="mx-auto mb-4 opacity-30" />
              <p>Kein Kunde gefunden für "{customerSearchTerm}"</p>
              <button
                onClick={() => setCustomerSearchTerm('')}
                className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
              >
                Suche zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}