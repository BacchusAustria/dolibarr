// src/components/CustomerSelector.jsx
import React, { useState, useEffect } from 'react';
import { Search, X, User, Check, UserPen, UserPlus, ChartLine } from 'lucide-react';
import CustomerModal from './CustomerModal';
import { api } from '../api';

export default function CustomerSelector({
  customerList,
  selectedCustomer,
  setSelectedCustomer,
  customerSearchTerm,
  setCustomerSearchTerm,
  onClose,
  onCreateCustomer,
  onUpdateCustomer,
  apiKey
}) {
  const [customerModal, setCustomerModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' oder 'edit'
    customer: null
  });

  const [countries, setCountries] = useState({});
  const [countriesLoading, setCountriesLoading] = useState(false);

  // Länder beim ersten Laden abrufen
  useEffect(() => {
    const fetchCountries = async () => {
      if (!apiKey || Object.keys(countries).length > 0) return;

      setCountriesLoading(true);
      try {
        const countryData = await api.fetchCountries(apiKey);
        setCountries(countryData);
        console.log('Countries loaded:', countryData);
      } catch (error) {
        console.error('Fehler beim Laden der Länder:', error);
        // Bei Fehler verwenden wir die Fallback-Länder im Modal
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, [apiKey, countries]);

  const filteredCustomers = customerList.filter(customer => {
    if (!customerSearchTerm) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  const openCreateModal = () => {
    setCustomerModal({
      isOpen: true,
      mode: 'create',
      customer: null
    });
  };

  const openEditModal = () => {
    if (selectedCustomer) {
      setCustomerModal({
        isOpen: true,
        mode: 'edit',
        customer: selectedCustomer
      });
    } else {
      alert('Bitte wählen Sie zunächst einen Kunden aus, um ihn zu bearbeiten.');
    }
  };

  const closeModal = () => {
    setCustomerModal({
      isOpen: false,
      mode: 'create',
      customer: null
    });
  };

  const handleSaveCustomer = async (formData) => {
    try {
      if (customerModal.mode === 'create') {
        // Neuen Kunden erstellen
        const newCustomer = await onCreateCustomer(formData);
        if (newCustomer) {
          // Optional: Neuen Kunden direkt auswählen
          setSelectedCustomer(newCustomer);
          alert('Kunde erfolgreich erstellt!');
        }
      } else {
        // Bestehenden Kunden aktualisieren
        const updatedCustomer = await onUpdateCustomer(customerModal.customer.id, formData);
        if (updatedCustomer) {
          // Wenn der aktualisierte Kunde der ausgewählte ist, Selection aktualisieren
          if (selectedCustomer && selectedCustomer.id === customerModal.customer.id) {
            setSelectedCustomer(updatedCustomer);
          }
          alert('Kunde erfolgreich aktualisiert!');
        }
      }
      closeModal();
    } catch (error) {
      console.error('Fehler beim Speichern des Kunden:', error);
      alert(`Fehler beim Speichern: ${error.message}`);
      throw error; // Re-throw für Modal error handling
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-white shadow-sm">
          <h2 className="text-lg font-bold">Kunde auswählen</h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={openEditModal}
              className="p-2 text-gray-600 hover:text-[#828f9a] hover:bg-gray-100 rounded-lg transition-colors"
              title="Ausgewählten Kunden bearbeiten"
            >
              <UserPen size={20} />
            </button>
            
            <button
              onClick={openCreateModal}
              className="p-2 text-gray-600 hover:text-[#818872] hover:bg-gray-100 rounded-lg transition-colors"
              title="Neuen Kunden erstellen"
            >
              <UserPlus size={20} />
            </button>
            <button onClick={""}
              className="p-2 text-gray-600 hover:text-[#818872] hover:bg-gray-100 rounded-lg transition-colors"
              title="Kundenstatistik anzeigen">
                <ChartLine size={20} />
              </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Kunde suchen..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a]"
            />
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {/* Option zum Abwählen des Kunden */}
            {selectedCustomer && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearchTerm('');
                  onClose();
                }}
                className="w-full p-4 rounded-lg border-2 text-left transition-all border-[#CBCEBD] bg-[#CBCEBD] text-[#171819] hover:bg-[#818872] hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">Keinen Kunden auswählen (aktuell: {selectedCustomer.name})</span>
                  </div>
                  <X className="flex-shrink-0 ml-2" size={20} />
                </div>
              </button>
            )}

            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setCustomerSearchTerm('');
                  onClose();
                }}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCustomer && selectedCustomer.id === customer.id
                    ? 'border-[#828f9a] bg-[#CBCEBD]'
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
                  {selectedCustomer && selectedCustomer.id === customer.id && (
                    <Check className="text-[#818872] flex-shrink-0 ml-2" size={20} />
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
                  className="mt-2 text-[#828f9a] hover:text-[#171819] text-sm"
                >
                  Suche zurücksetzen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={customerModal.isOpen}
        mode={customerModal.mode}
        customer={customerModal.customer}
        onClose={closeModal}
        onSave={handleSaveCustomer}
        countries={countries}
        loading={countriesLoading}
      />
    </>
  );
}