// src/components/CustomerModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, User, Building, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';

export default function CustomerModal({
  isOpen,
  mode, // 'create' oder 'edit'
  customer, // Kundendaten bei Bearbeitung
  onClose,
  onSave,
  loading = false,
  countries = {} // Länderliste als Prop
}) {
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    zip: '',
    town: '',
    country: 'DE',
    customerCode: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Formular zurücksetzen oder mit Kundendaten füllen
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && customer) {
        setFormData({
          name: customer.name || '',
          firstname: customer.firstname || '',
          company: customer.company || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          zip: customer.zip || '',
          town: customer.town || '',
          country: customer.country || 'DE',
          customerCode: customer.code_client || '',
          notes: customer.note_private || ''
        });
      } else {
        // Neuer Kunde - Formular zurücksetzen
        setFormData({
          name: '',
          firstname: '',
          company: '',
          email: '',
          phone: '',
          address: '',
          zip: '',
          town: '',
          country: 'DE',
          customerCode: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, customer]);

  const validateForm = () => {
    const newErrors = {};

    // Name ist Pflichtfeld
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    // Email-Validierung (falls angegeben)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Fehler für dieses Feld entfernen
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      // Fehler wird vom Parent-Component behandelt
    } finally {
      setSaving(false);
    }
  };

  // Länder-Optionen aus der countries-Prop generieren
  const getCountryOptions = () => {
    // Fallback zu statischen Ländern falls API-Daten nicht verfügbar
    const fallbackCountries = {
      'AT': 'Österreich',
      'DE': 'Deutschland', 
      'CH': 'Schweiz',
      'IT': 'Italien',
      'FR': 'Frankreich'
    };

    // Wenn countries leer ist, verwende Fallback
    if (!countries || Object.keys(countries).length === 0) {
      return Object.entries(fallbackCountries).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ));
    }

    // Ländernamen-Mapping (kann erweitert werden)
    const countryNames = {
      'AT': 'Österreich',
      'DE': 'Deutschland',
      'CH': 'Schweiz',
      'IT': 'Italien',
      'FR': 'Frankreich',
      'ES': 'Spanien',
      'NL': 'Niederlande',
      'BE': 'Belgien',
      'LU': 'Luxemburg',
      'PL': 'Polen',
      'CZ': 'Tschechien',
      'SK': 'Slowakei',
      'HU': 'Ungarn',
      'SI': 'Slowenien',
      'HR': 'Kroatien',
      'GB': 'Großbritannien',
      'US': 'USA',
      'CA': 'Kanada'
    };

    // Sortiere Länder alphabetisch nach Namen
    return Object.keys(countries)
      .sort((a, b) => {
        const nameA = countryNames[a] || a;
        const nameB = countryNames[b] || b;
        return nameA.localeCompare(nameB);
      })
      .map(code => (
        <option key={code} value={code}>
          {countryNames[code] || code}
        </option>
      ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-[#828f9a] text-white rounded-t-lg">
          <h2 className="text-lg font-bold flex items-center">
            {mode === 'create' ? (
              <>
                <User className="mr-2" size={20} />
                Neuen Kunden erstellen
              </>
            ) : (
              <>
                <User className="mr-2" size={20} />
                Kunde bearbeiten
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-200 transition-colors"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Persönliche Daten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => handleInputChange('firstname', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                  placeholder="Max"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#828f9a]'
                  }`}
                  placeholder="Mustermann"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Firma */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Building size={16} className="mr-1" />
                Firma
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                placeholder="Musterfirma GmbH"
              />
            </div>

            {/* Kontaktdaten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail size={16} className="mr-1" />
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#828f9a]'
                  }`}
                  placeholder="max@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone size={16} className="mr-1" />
                  Telefon
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                  placeholder="+43 123 456789"
                />
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="mr-1" />
                Adresse
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                placeholder="Musterstraße 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ
                </label>
                <input
                  id="zip"
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                  placeholder="1234"
                />
              </div>

              <div>
                <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">
                  Ort
                </label>
                <input
                  id="town"
                  type="text"
                  value={formData.town}
                  onChange={(e) => handleInputChange('town', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                  placeholder="Musterstadt"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                >
                  {getCountryOptions()}
                </select>
              </div>
            </div>

            {/* Kundennummer */}
            <div>
              <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700 mb-1">
                Kundennummer
              </label>
              <input
                id="customerCode"
                type="text"
                value={formData.customerCode}
                onChange={(e) => handleInputChange('customerCode', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent"
                placeholder="Automatisch generiert (leer lassen)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leer lassen für automatische Generierung
              </p>
            </div>

            {/* Notizen */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Interne Notizen
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#828f9a] focus:border-transparent resize-none"
                placeholder="Interne Notizen zu diesem Kunden..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#828f9a] text-white rounded-lg hover:bg-[#171819] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {mode === 'create' ? 'Kunde erstellen' : 'Änderungen speichern'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}