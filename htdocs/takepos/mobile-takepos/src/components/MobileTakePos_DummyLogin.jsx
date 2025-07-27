import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Printer, Search, Plus, Minus, X, Check, Edit3, Percent, Settings, Wifi, WifiOff } from 'lucide-react';

// Dolibarr API Service (vereinfachte Version für Demo)
class DolibarrApiService {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.isConnected = false;
  }

  async testConnection() {
    // Simuliere API-Verbindungstest
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = this.baseUrl && this.apiKey;
        resolve(this.isConnected);
      }, 1000);
    });
  }

  async getProducts() {
    // Simuliere Produktabruf von Dolibarr
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, label: 'Kaffee', price: '2.50', fk_product_type: 1 },
          { id: 2, label: 'Tee', price: '2.00', fk_product_type: 1 },
          { id: 3, label: 'Sandwich', price: '4.50', fk_product_type: 2 },
          { id: 4, label: 'Salat', price: '6.80', fk_product_type: 2 }
        ]);
      }, 500);
    });
  }

  async getCustomers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Max Mustermann', email: 'max@mustermann.de' },
          { id: 2, name: 'Anna Schmidt', email: 'anna@schmidt.com' }
        ]);
      }, 500);
    });
  }

  async createPosTransaction(cartItems, customer, paymentAmount) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: Math.floor(Math.random() * 1000),
          invoiceId: Math.floor(Math.random() * 1000)
        });
      }, 1000);
    });
  }
}

// Mock-Kategorien für Mapping
const categoryMapping = {
  1: { name: 'Getränke', color: 'bg-blue-500', icon: '☕' },
  2: { name: 'Speisen', color: 'bg-green-500', icon: '🍽️' },
  3: { name: 'Desserts', color: 'bg-purple-500', icon: '🍰' },
  4: { name: 'Snacks', color: 'bg-orange-500', icon: '🍟' }
};

const productIcons = {
  'Kaffee': '☕',
  'Tee': '🍵',
  'Cola': '🥤',
  'Wasser': '💧',
  'Sandwich': '🥪',
  'Salat': '🥗',
  'Pizza': '🍕',
  'Kuchen': '🍰',
  'Eis': '🍦',
  'Chips': '🍟'
};

export default function IntegratedMobileTakePos() {
  // Dolibarr Konfiguration
  const [dolibarrConfig, setDolibarrConfig] = useState({
    baseUrl: '',
    apiKey: '',
    isConfigured: false
  });
  
  const [api, setApi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected, connecting, connected, error

  // Bestehende States
  const [currentView, setCurrentView] = useState('main');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 0, name: 'Standard-Kunde' });
  const [productModal, setProductModal] = useState(null);
  const [tempProduct, setTempProduct] = useState({ quantity: 1, price: 0 });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [discountModal, setDiscountModal] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState({ value: 0, type: 'percent' });
  const [configModal, setConfigModal] = useState(false);

  // Daten States
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([{ id: 0, name: 'Standard-Kunde' }]);
  const [categories, setCategories] = useState([]);

  // Dolibarr Verbindung initialisieren
  useEffect(() => {
    // Konfiguration aus localStorage laden
    const savedConfig = localStorage.getItem('dolibarr_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setDolibarrConfig(config);
      if (config.isConfigured) {
        initializeApi(config);
      }
    }
  }, []);

  const initializeApi = async (config) => {
    setSyncStatus('connecting');
    const apiService = new DolibarrApiService(config.baseUrl, config.apiKey);
    
    try {
      const connected = await apiService.testConnection();
      setApi(apiService);
      setIsConnected(connected);
      setSyncStatus(connected ? 'connected' : 'error');
      
      if (connected) {
        await loadDolibarrData(apiService);
      }
    } catch (error) {
      console.error('Dolibarr connection failed:', error);
      setSyncStatus('error');
    }
  };

  const loadDolibarrData = async (apiService) => {
    setLoading(true);
    try {
      // Produkte laden
      const productsData = await apiService.getProducts();
      const mappedProducts = productsData.map(product => ({
        id: product.id,
        name: product.label,
        price: parseFloat(product.price),
        category: product.fk_product_type,
        image: productIcons[product.label] || '📦'
      }));
      setProducts(mappedProducts);

      // Kategorien extrahieren
      const uniqueCategories = [...new Set(mappedProducts.map(p => p.category))];
      const mappedCategories = uniqueCategories.map(catId => ({
        id: catId,
        name: categoryMapping[catId]?.name || `Kategorie ${catId}`,
        color: categoryMapping[catId]?.color || 'bg-gray-500'
      }));
      setCategories(mappedCategories);

      // Kunden laden
      const customersData = await apiService.getCustomers();
      const mappedCustomers = [
        { id: 0, name: 'Standard-Kunde' },
        ...customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email
        }))
      ];
      setCustomers(mappedCustomers);

    } catch (error) {
      console.error('Error loading Dolibarr data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDolibarrConfig = async (baseUrl, apiKey) => {
    const config = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      isConfigured: true
    };
    
    localStorage.setItem('dolibarr_config', JSON.stringify(config));
    setDolibarrConfig(config);
    setConfigModal(false);
    
    await initializeApi(config);
  };

  // Gefilterte Produkte
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Gefilterte Kunden
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  // Bestehende Funktionen (gekürzt)
  const addToCart = (product, customQuantity = 1, customPrice = null) => {
    const price = customPrice !== null ? customPrice : product.price;
    const existingItem = cartItems.find(item => item.id === product.id && item.price === price);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id && item.price === price
          ? { ...item, quantity: item.quantity + customQuantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { 
        ...product, 
        quantity: customQuantity, 
        price: price,
        originalPrice: product.price,
        discount: { value: 0, type: 'percent' }
      }]);
    }
  };

  const calculateItemTotal = (item) => {
    const baseTotal = item.price * item.quantity;
    if (item.discount.value === 0) return baseTotal;
    
    if (item.discount.type === 'percent') {
      return baseTotal * (1 - item.discount.value / 100);
    } else {
      return Math.max(0, baseTotal - item.discount.value);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  
  const calculateGlobalDiscountAmount = () => {
    if (globalDiscount.value === 0) return 0;
    if (globalDiscount.type === 'percent') {
      return subtotal * (globalDiscount.value / 100);
    } else {
      return Math.min(globalDiscount.value, subtotal);
    }
  };
  
  const globalDiscountAmount = calculateGlobalDiscountAmount();
  const cartTotal = Math.max(0, subtotal - globalDiscountAmount);
  const changeAmount = paymentAmount ? (parseFloat(paymentAmount) - cartTotal) : 0;

  const completeTransaction = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) < cartTotal) return;

    setLoading(true);
    try {
      if (api && isConnected) {
        // Dolibarr-Transaktion
        const result = await api.createPosTransaction(cartItems, selectedCustomer, parseFloat(paymentAmount));
        
        if (result.success) {
          alert(`Transaktion erfolgreich in Dolibarr erstellt!\nBestellung ID: ${result.orderId}\nRechnung ID: ${result.invoiceId}\nGesamt: ${cartTotal.toFixed(2)}€\nBezahlt: ${paymentAmount}€\nWechselgeld: ${changeAmount.toFixed(2)}€`);
        } else {
          alert('Fehler bei der Dolibarr-Synchronisation, aber lokale Transaktion abgeschlossen.');
        }
      } else {
        // Lokale Transaktion ohne Dolibarr
        alert(`Lokale Transaktion abgeschlossen!\n(Nicht mit Dolibarr synchronisiert)\nKunde: ${selectedCustomer.name}\nGesamt: ${cartTotal.toFixed(2)}€\nBezahlt: ${paymentAmount}€\nWechselgeld: ${changeAmount.toFixed(2)}€`);
      }
      
      // Reset
      setCartItems([]);
      setPaymentAmount('');
      setCurrentView('main');
      setSelectedCustomer(customers[0]);
      setGlobalDiscount({ value: 0, type: 'percent' });
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Fehler bei der Transaktion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'connected': return <Wifi className="text-green-500" size={16} />;
      case 'connecting': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'error': return <WifiOff className="text-red-500" size={16} />;
      default: return <WifiOff className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header mit Dolibarr Status */}
      <div className="bg-blue-600 text-white p-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">Mobile TakePos</h1>
            {getSyncStatusIcon()}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setConfigModal(true)}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-400"
              title="Dolibarr Konfiguration"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setCurrentView('customer')}
              className={`p-2 rounded-lg ${selectedCustomer.id === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
            >
              <User size={18} />
            </button>
            <button
              onClick={() => cartItems.length > 0 && setCurrentView('payment')}
              className={`p-2 rounded-lg ${cartItems.length > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}`}
              disabled={cartItems.length === 0}
            >
              <CreditCard size={18} />
            </button>
          </div>
        </div>
        
        <div className="mt-1 text-sm opacity-90 flex justify-between">
          <span>Kunde: {selectedCustomer.name}</span>
          <span className="text-xs">
            {syncStatus === 'connected' ? 'Dolibarr verbunden' : 
             syncStatus === 'connecting' ? 'Verbinde...' :
             syncStatus === 'error' ? 'Verbindungsfehler' : 'Offline Modus'}
          </span>
        </div>
      </div>

      {/* Konfigurationsmodal */}
      {configModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <Settings className="mx-auto text-blue-500 mb-2" size={32} />
              <h3 className="text-lg font-bold">Dolibarr Konfiguration</h3>
              <p className="text-gray-600 text-sm">Verbindung zu Ihrem Dolibarr-System</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dolibarr URL</label>
                <input
                  type="url"
                  placeholder="https://ihr-dolibarr.de"
                  defaultValue={dolibarrConfig.baseUrl}
                  className="w-full border rounded px-3 py-2"
                  id="dolibarr-url"
                />
                <p className="text-xs text-gray-500 mt-1">Basis-URL Ihrer Dolibarr Installation</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Ihr Dolibarr API-Schlüssel"
                  defaultValue={dolibarrConfig.apiKey}
                  className="w-full border rounded px-3 py-2"
                  id="dolibarr-key"
                />
                <p className="text-xs text-gray-500 mt-1">API-Schlüssel aus Dolibarr Setup → Module → API/Web services</p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setConfigModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const url = document.getElementById('dolibarr-url').value;
                  const key = document.getElementById('dolibarr-key').value;
                  saveDolibarrConfig(url, key);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Verbinde...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest der UI bleibt gleich, aber mit den geladenen Daten */}
      {currentView === 'main' && (
        <div className="flex-1 flex flex-col">
          {/* Warenkorb-Bereich */}
          <div className="bg-white shadow-sm border-b" style={{ minHeight: '200px', maxHeight: '40vh' }}>
            <div className="p-3 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-gray-700">Warenkorb</h2>
                <div className="text-lg font-bold text-blue-600">
                  {cartTotal.toFixed(2)}€
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(40vh - 60px)' }}>
              {cartItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Warenkorb leer</p>
                    {!isConnected && (
                      <p className="text-xs text-orange-500 mt-1">Offline Modus</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-lg">{item.image}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.name}</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-right">
                        {item.quantity}x {item.price.toFixed(2)}€ = {calculateItemTotal(item).toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Produktbereich */}
          <div className="flex-1 flex flex-col">
            {/* Suchleiste */}
            <div className="p-3 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Produkt suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Kategorien */}
            <div className="p-3 bg-white border-b">
              <div className="flex space-x-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                    selectedCategory === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Alle
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                      selectedCategory === category.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Produktgrid */}
            <div className="flex-1 p-3 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Lade Produkte...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-all active:scale-95 select-none"
                    >
                      <div className="text-2xl mb-2">{product.image}</div>
                      <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                      <div className="text-blue-600 font-bold text-sm">{product.price.toFixed(2)}€</div>
                    </button>
                  ))}
                </div>
              )}
              
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📦</div>
                  <p>Keine Produkte gefunden</p>
                  {!isConnected && (
                    <p className="text-sm text-orange-500 mt-2">
                      Überprüfen Sie Ihre Dolibarr-Verbindung
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kundenauswahl */}
      {currentView === 'customer' && (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-white shadow-sm">
            <h2 className="text-lg font-bold">Kunde auswählen</h2>
            <button
              onClick={() => setCurrentView('main')}
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
                    setCurrentView('main');
                    setCustomerSearchTerm('');
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
            </div>
          </div>
        </div>
      )}

      {/* Zahlungsabwicklung */}
      {currentView === 'payment' && (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-white shadow-sm">
            <h2 className="text-lg font-bold">Zahlung</h2>
            <div className="flex items-center space-x-2">
              {getSyncStatusIcon()}
              <button
                onClick={() => setCurrentView('main')}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Rechnungsübersicht */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Rechnungsübersicht</h3>
              <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{calculateItemTotal(item).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Zwischensumme:</span>
                  <span>{subtotal.toFixed(2)}€</span>
                </div>
                <div className="border-t pt-1 font-bold flex justify-between">
                  <span>Gesamt:</span>
                  <span>{cartTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Dolibarr Status Anzeige */}
            {syncStatus !== 'connected' && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <WifiOff size={16} className="text-orange-500" />
                  <span className="text-sm text-orange-700">
                    {syncStatus === 'error' 
                      ? 'Dolibarr nicht verbunden - Transaktion wird nur lokal gespeichert'
                      : 'Offline Modus - Keine Synchronisation mit Dolibarr'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Zahlungsbetrag */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <label className="block text-sm font-medium mb-2">
                Erhaltener Betrag
              </label>
              <input
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
                  onClick={() => setPaymentAmount(cartTotal.toString())}
                  className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Passend
                </button>
                <button
                  onClick={() => setPaymentAmount((Math.ceil(cartTotal / 5) * 5).toString())}
                  className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Auf 5€
                </button>
                <button
                  onClick={() => setPaymentAmount((Math.ceil(cartTotal / 10) * 10).toString())}
                  className="p-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Auf 10€
                </button>
              </div>
            </div>

            {/* Wechselgeld */}
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

            {/* Beleg-Option */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <label className="flex items-center space-x-3">
                <input
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

          {/* Abschluss-Button */}
          <div className="bg-white p-4 shadow-lg">
            <button
              onClick={completeTransaction}
              disabled={!paymentAmount || parseFloat(paymentAmount) < cartTotal || loading}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                paymentAmount && parseFloat(paymentAmount) >= cartTotal && !loading
                  ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verarbeite...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>
                      {isConnected ? 'Zahlung abschließen' : 'Zahlung abschließen (Offline)'}
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}