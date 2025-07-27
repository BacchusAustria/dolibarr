// src/MobileTakePos.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Printer, Search, Plus, Minus, X, Check, Edit3, Percent, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCart } from './hooks/useCart';
import { useDolibarrData } from './hooks/useDolibarrData';
import { api } from './api';
import ProductModal from './components/ProductModal';
import DiscountModal from './components/DiscountModal';
import CustomerSelector from './components/CustomerSelector';
import PaymentView from './components/PaymentView';

// Mock-Daten für die Demo (nur noch Kategorien/Produkte)
const mockCategories = [
  { id: 1, name: 'Getränke', color: 'bg-blue-500' },
  { id: 2, name: 'Speisen', color: 'bg-green-500' },
  { id: 3, name: 'Desserts', color: 'bg-purple-500' },
  { id: 4, name: 'Snacks', color: 'bg-orange-500' }
];

const mockProducts = [
  { id: 1, name: 'Kaffee', price: 2.50, category: 1, image: '☕' },
  { id: 2, name: 'Tee', price: 2.00, category: 1, image: '🍵' },
  { id: 3, name: 'Cola', price: 2.80, category: 1, image: '🥤' },
  { id: 4, name: 'Wasser', price: 1.50, category: 1, image: '💧' },
  { id: 5, name: 'Sandwich', price: 4.50, category: 2, image: '🥪' },
  { id: 6, name: 'Salat', price: 6.80, category: 2, image: '🥗' },
  { id: 7, name: 'Pizza', price: 8.90, category: 2, image: '🍕' },
  { id: 8, name: 'Kuchen', price: 3.20, category: 3, image: '🍰' },
  { id: 9, name: 'Eis', price: 2.90, category: 3, image: '🍦' },
  { id: 10, name: 'Chips', price: 1.80, category: 4, image: '🍟' }
];


export default function MobileTakePos() {
  const [currentView, setCurrentView] = useState('main'); // main, customer, payment
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]); // Pfad durch die Kategorienhierarchie
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  const [productModal, setProductModal] = useState(null);
  const [tempProduct, setTempProduct] = useState({ quantity: 1, price: 0 }); // for product modal
  
  const [discountModal, setDiscountModal] = useState(null); // { type: 'item'|'global', index: number|null, value: number, discountType: 'percent'|'euro' }
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const [apiKey, setApiKey] = useState(localStorage.getItem('dolibarrApiKey') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState({ id: 0, name: 'Standard-Kunde' });

  // Custom Hooks
  const { cartItems, setCartItems, globalDiscount, setGlobalDiscount, 
          addToCart, updateCartItem, removeFromCart, applyItemDiscount, 
          calculateItemTotal, subtotal, globalDiscountAmount, cartTotal, resetCart } = useCart();

  const { customerList, categoryList, productList, dataLoading, dataError, 
          getMainCategories, getSubcategories, getAllSubcategoryIds } = useDolibarrData(apiKey);

  useEffect(() => {
    // Set default customer once customerList is loaded, if not already set
    if (customerList.length > 0 && selectedCustomer.id === 0) {
      setSelectedCustomer(customerList[0]);
    }
  }, [customerList, selectedCustomer.id]);

  // Category navigation functions
  const navigateToCategory = (categoryId) => {
    if (categoryId === null) {
      setSelectedCategory(null);
      setCategoryPath([]);
    } else {
      const category = categoryList.find(cat => cat.id === categoryId);
      if (category) {
        setSelectedCategory(categoryId);
        const newPath = [...categoryPath];
        if (!newPath.some(item => item.id === categoryId)) {
          newPath.push({ id: categoryId, name: category.name });
        }
        setCategoryPath(newPath);
      }
    }
  };

  const navigateBack = () => {
    if (categoryPath.length > 1) {
      const newPath = categoryPath.slice(0, -1);
      setCategoryPath(newPath);
      setSelectedCategory(newPath[newPath.length - 1].id);
    } else {
      setCategoryPath([]);
      setSelectedCategory(null);
    }
  };

  const getCurrentCategories = () => {
    if (selectedCategory === null) {
      return getMainCategories();
    } else {
      return getSubcategories(selectedCategory);
    }
  };

  // Filtered products based on category and search term
  const filteredProducts = productList.filter(product => {
    let matchesCategory = true;
    if (selectedCategory !== null) {
      const validIds = getAllSubcategoryIds(selectedCategory);
      matchesCategory = product.category ? validIds.includes(parseInt(product.category)) : false;
    }
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Long Press Handler for products
  const handleTouchStart = (product) => {
    const timer = setTimeout(() => {
      setProductModal(product);
      setTempProduct({ quantity: 1, price: product.price });
    }, 500); // 500ms for Long Press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const addProductFromModal = () => {
    addToCart(productModal, tempProduct.quantity, tempProduct.price);
    setProductModal(null);
    setTempProduct({ quantity: 1, price: 0 });
  };

  // Discount Modal Handlers
  const openDiscountModal = (type, index = null) => {
    // Initialize value based on existing discount if editing, or 0
    let initialValue = 0;
    let initialDiscountType = 'percent';

    if (type === 'item' && index !== null && cartItems[index] && cartItems[index].discount) {
      initialValue = cartItems[index].discount.value;
      initialDiscountType = cartItems[index].discount.type;
    } else if (type === 'global' && globalDiscount) {
      initialValue = globalDiscount.value;
      initialDiscountType = globalDiscount.type;
    }

    setDiscountModal({ type, index, value: initialValue, discountType: initialDiscountType });
  };

  const applyDiscount = () => {
    if (discountModal.type === 'item') {
      applyItemDiscount(discountModal.index, discountModal.value, discountModal.discountType);
    } else {
      setGlobalDiscount({ value: discountModal.value, type: discountModal.discountType });
    }
    setDiscountModal(null);
  };

  const completeTransaction = async () => {
    const paidAmount = parseFloat(paymentAmount);
    const changeAmount = paidAmount - cartTotal;

    if (!paymentAmount || paidAmount < cartTotal) {
      alert('Bezahlter Betrag ist zu niedrig!');
      return;
    }

    try {
      if (!apiKey || apiKey === 'undefined') {
        throw new Error('Kein gültiger API-Key vorhanden. Bitte neu einloggen.');
      }

      // 1. Rechnung in Dolibarr erstellen (erst ohne Zeilen)
      const invoiceData = {
        socid: selectedCustomer.id === 0 ? null : selectedCustomer.id, // Changed to socid
        type: 0, 
        date: Math.floor(Date.now() / 1000),
        note_private: `Mobile TakePos - ${new Date().toLocaleString('de-DE')}`,
        mode_reglement_id: 4, // 4 = Cash
        cond_reglement_id: 1 // 1 = Immediate
      };

      console.log('Sending invoice to Dolibarr:', invoiceData);
      const invoiceId = await api.createInvoice(apiKey, invoiceData);
      console.log('Invoice created with ID:', invoiceId);

      // Verbesserte lineData für addInvoiceLine in MobileTakePos.jsx
// Ersetze den bestehenden lineData Code (circa Zeile 195-210) mit diesem:

// 1a. Rechnungszeilen einzeln hinzufügen
for (const item of cartItems) {
  const lineData = {
    desc: item.name,
    label: item.name,
    qty: item.quantity,
    subprice: item.price,
    tva_tx: 0, // VAT rate
    fk_product: parseInt(item.id),
    product_type: 1, // 1 for product, 0 for service
    remise_percent: item.discount && item.discount.type === 'percent' ? item.discount.value : 0,
    localtax1_tx: 0,
    localtax2_tx: 0,
    // Zusätzliche Felder um PHP-Warnings zu vermeiden:
    fk_fournprice: null,
    pa_ht: 0,
    date_start: null,
    date_end: null,
    fk_code_ventilation: 0,
    info_bits: 0,
    fk_remise_except: null,
    price_base_type: 'HT', // oder 'TTC' je nach Konfiguration
    rang: 0,
    special_code: 0,
    origin: null,
    origin_id: null,
    array_options: {},
    situation_percent: 100,
    fk_prev_id: null,
    fk_unit: null,
    ref_ext: null
  };
  
  try {
    await api.addInvoiceLine(apiKey, invoiceId, lineData);
  } catch (lineError) {
    console.warn(`Warning: Could not add line for product ${item.name}:`, lineError);
  }
}

// Add global discount as a separate line if applicable
if (globalDiscount.value > 0) {
  const discountLineData = {
    desc: `Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'})`,
    label: `Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'})`,
    qty: 1,
    subprice: -globalDiscountAmount, // Negative value for discount
    tva_tx: 0,
    product_type: 0, // Service line for discount
    remise_percent: 0,
    localtax1_tx: 0,
    localtax2_tx: 0,
    fk_product: null,
    // Zusätzliche Felder um PHP-Warnings zu vermeiden:
    fk_fournprice: null,
    pa_ht: 0,
    date_start: null,
    date_end: null,
    fk_code_ventilation: 0,
    info_bits: 0,
    fk_remise_except: null,
    price_base_type: 'HT',
    rang: 0,
    special_code: 0,
    origin: null,
    origin_id: null,
    array_options: {},
    situation_percent: 100,
    fk_prev_id: null,
    fk_unit: null,
    ref_ext: null
  };
  
  try {
    await api.addInvoiceLine(apiKey, invoiceId, discountLineData);
  } catch (discountError) {
    console.warn('Warning: Could not add discount line:', discountError);
  }
}
      // Add global discount as a separate line if applicable
      if (globalDiscount.value > 0) {
        const discountLineData = {
          desc: `Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'})`,
          label: `Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'})`, // Added label
          qty: 1,
          subprice: -globalDiscountAmount, // Negative value for discount
          tva_tx: 0,
          product_type: 0, // Treat discount as a service line or special type if product_type required
          remise_percent: 0,
          localtax1_tx: 0,
          localtax2_tx: 0,
          fk_product: null, // No product associated with a global discount line
        };
        try {
          await api.addInvoiceLine(apiKey, invoiceId, discountLineData);
        } catch (discountError) {
          console.warn('Warning: Could not add discount line:', discountError);
        }
      }

      // 2. Rechnung validieren
      try {
        await api.validateInvoice(apiKey, invoiceId);
      } catch (validateError) {
        console.warn('Warning: Invoice could not be validated:', validateError);
      }

      // 3. Zahlung erfassen

        const PaymentData = {
          closepaidinvoices: 'yes', // Close specific invoice
          accountid: 1, // Default bank account, adjust if necessary
          datepaye: Math.floor(Date.now() / 1000),
          paymentid: 0,
          num_payment: `CASH-ALT-${Date.now()}`,
          amount: paidAmount
        };
        try {
            console.log('Recording payment:', PaymentData);
          await api.recordPayment(apiKey, invoiceId, PaymentData);
          console.log('Payment recorded method.');
        } catch (PaymentError) {
          console.warn('Warning: Payment could not be recorded:', PaymentError);
        }

      // 4. PDF-Beleg generieren und öffnen (falls gewünscht)
      if (printReceipt) {
        try {
          const downloadUrl = await api.generatePdf(apiKey, invoiceId);
          window.open(downloadUrl, '_blank');
          console.log('PDF generated and opened.');
        } catch (pdfError) {
          console.warn('PDF could not be generated or opened:', pdfError);
          // Fallback to a print-friendly summary if PDF generation fails
          const printWindow = window.open('', '_blank');
          printWindow.document.write(`
            <html>
              <head>
                <title>Beleg ${invoiceId}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .customer { margin-bottom: 20px; }
                  .items { margin-bottom: 20px; }
                  .total { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; }
                  @media print { button { display: none; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>Kassenbeleg</h2>
                  <p>Rechnung Nr.: ${invoiceId}</p>
                  <p>Datum: ${new Date().toLocaleString('de-DE')}</p>
                </div>
                
                <div class="customer">
                  <strong>Kunde:</strong> ${selectedCustomer.name}
                </div>
                
                <div class="items">
                  <h3>Positionen:</h3>
                  ${cartItems.map(item => `
                    <div>${item.quantity}x ${item.name} - ${calculateItemTotal(item).toFixed(2)}€</div>
                  `).join('')}
                  ${globalDiscount.value > 0 ? `
                    <div>Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'}): -${globalDiscountAmount.toFixed(2)}€</div>
                  ` : ''}
                </div>
                
                <div class="total">
                  Gesamt: ${cartTotal.toFixed(2)}€<br>
                  Bezahlt: ${paidAmount.toFixed(2)}€<br>
                  Wechselgeld: ${changeAmount.toFixed(2)}€
                </div>
                
                <button onclick="window.print()">Drucken</button>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }

      alert(`✅ Transaktion erfolgreich abgeschlossen!
Rechnung Nr.: ${invoiceId}
Kunde: ${selectedCustomer.name}
Gesamt: ${cartTotal.toFixed(2)}€
Bezahlt: ${paidAmount.toFixed(2)}€
Wechselgeld: ${changeAmount.toFixed(2)}€
${printReceipt ? 'Beleg wird geöffnet...' : ''}`);

      resetCart();
      setPaymentAmount('');
      setCurrentView('main');
      setSelectedCustomer(customerList[0]); // Reset to default customer
    } catch (error) {
      console.error('Error during transaction:', error);
      
      if (error.message.includes('Authentication') || error.message.includes('einloggen')) {
        if (window.confirm('API-Sitzung abgelaufen. Möchten Sie sich neu einloggen?')) {
          localStorage.removeItem('dolibarrApiKey');
          setApiKey('');
          return; // Don't reset cart if re-logging in
        }
      }
      
      // Local storage fallback for receipts
      const receiptData = {
        timestamp: new Date().toLocaleString('de-DE'),
        customer: selectedCustomer.name,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: calculateItemTotal(item)
        })),
        subtotal: subtotal,
        globalDiscount: globalDiscount.value > 0 ? {
          type: globalDiscount.type,
          value: globalDiscount.value,
          amount: globalDiscountAmount
        } : null,
        total: cartTotal,
        paid: paidAmount,
        change: changeAmount
      };

      const offlineReceipts = JSON.parse(localStorage.getItem('offlineReceipts') || '[]');
      offlineReceipts.push(receiptData);
      localStorage.setItem('offlineReceipts', JSON.stringify(offlineReceipts));

      alert(`⚠️ Rechnung konnte nicht in Dolibarr gespeichert werden!
Fehler: ${error.message}

Die Transaktion wurde lokal gespeichert.
Kunde: ${selectedCustomer.name}
Gesamt: ${cartTotal.toFixed(2)}€
Bezahlt: ${paidAmount.toFixed(2)}€
Wechselgeld: ${changeAmount.toFixed(2)}€

Bitte später manuell in Dolibarr nachtragen.`);

      // Reset anyway, even if API failed
      resetCart();
      setPaymentAmount('');
      setCurrentView('main');
      setSelectedCustomer(customerList[0]);
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Dolibarr Login</h2>
          <div className="mb-3">
            <label htmlFor="username" className="block text-sm font-medium mb-1">Benutzername</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <button
            onClick={async () => {
              try {
                const token = await api.login(username, password);
                localStorage.setItem('dolibarrApiKey', token);
                setApiKey(token);
                console.log('Login successful.');
              } catch (err) {
                console.error(err);
                alert('Login fehlgeschlagen: ' + err.message);
              }
            }}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Einloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Mobile TakePos</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('customer')}
              className={`p-2 rounded-lg ${selectedCustomer.id === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
              title="Kunde auswählen"
            >
              <User size={18} />
            </button>
            <button
              onClick={() => cartItems.length > 0 && setCurrentView('payment')}
              className={`p-2 rounded-lg ${cartItems.length > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}`}
              disabled={cartItems.length === 0}
              title="Zahlung abschließen"
            >
              <CreditCard size={18} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('dolibarrApiKey');
                setApiKey('');
                setSelectedCustomer({ id: 0, name: 'Standard-Kunde' }); // Reset customer on logout
                resetCart(); // Clear cart on logout
              }}
              className="ml-2 p-2 bg-red-500 text-white rounded"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="mt-1 text-sm opacity-90">
          Kunde: {selectedCustomer.name}
        </div>
      </div>

      {/* Main View with Split-View */}
      {currentView === 'main' && (
        <div className="flex-1 flex flex-col">
          {/* Cart Section (Upper Part) */}
          <div className="bg-white shadow-sm border-b" style={{ minHeight: '200px', maxHeight: '40vh' }}>
            <div className="p-3 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-gray-700">Warenkorb</h2>
                <div className="flex items-center space-x-2">
                  {cartItems.length > 0 && (
                    <button
                      onClick={() => openDiscountModal('global')}
                      className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                      title="Gesamtrabatt"
                    >
                      <Percent size={16} />
                    </button>
                  )}
                  <div className="text-lg font-bold text-blue-600">
                    {cartTotal.toFixed(2)}€
                  </div>
                </div>
              </div>
              {globalDiscount.value > 0 && (
                <div className="mt-1 text-xs text-orange-600">
                  Gesamtrabatt: -{globalDiscountAmount.toFixed(2)}€ 
                  ({globalDiscount.value}{globalDiscount.type === 'percent' ? '%' : '€'})
                </div>
              )}
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(40vh - 60px)' }}>
              {cartItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Warenkorb leer</p>
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
                          {(item.price !== item.originalPrice || item.discount.value > 0) && (
                            <div className="text-xs text-orange-600">
                              {item.price !== item.originalPrice && "Preis angepasst"}
                              {item.price !== item.originalPrice && item.discount.value > 0 && " • "}
                              {item.discount.value > 0 && `${item.discount.value}${item.discount.type === 'percent' ? '%' : '€'} Rabatt`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateCartItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                          className="p-1 bg-gray-300 rounded hover:bg-gray-400"
                          title="Menge reduzieren"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                          className="p-1 bg-gray-300 rounded hover:bg-gray-400"
                          title="Menge erhöhen"
                        >
                          <Plus size={10} />
                        </button>
                        
                        <input
                          type="number"
                          value={item.price.toFixed(2)}
                          onChange={(e) => updateCartItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-12 text-xs text-right border rounded px-1"
                          step="0.01"
                          min="0"
                          title="Preis pro Stück bearbeiten"
                        />
                        <span className="text-xs">€</span>
                        
                        <button
                          onClick={() => openDiscountModal('item', index)}
                          className={`p-1 rounded hover:bg-orange-200 ${
                            item.discount.value > 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                          title="Positionsrabatt"
                        >
                          <Percent size={10} />
                        </button>
                        
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Position entfernen"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      
                      <div className="ml-2 text-xs font-medium text-right">
                        {calculateItemTotal(item).toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Section (Lower Part) */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
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

            {/* Category Navigation */}
            <div className="p-3 bg-white border-b">
              {/* Breadcrumb */}
              {categoryPath.length > 0 && (
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                  <button
                    onClick={navigateBack}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Zurück zur vorherigen Kategorie"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setCategoryPath([]);
                      }}
                      className="hover:text-blue-600"
                    >
                      Alle
                    </button>
                    {categoryPath.map((pathItem, index) => (
                      <React.Fragment key={pathItem.id}>
                        <ChevronRight size={14} className="text-gray-400" />
                        <button
                          onClick={() => {
                            const newPath = categoryPath.slice(0, index + 1);
                            setCategoryPath(newPath);
                            setSelectedCategory(pathItem.id);
                          }}
                          className={`hover:text-blue-600 ${
                            index === categoryPath.length - 1 ? 'font-medium text-blue-600' : ''
                          }`}
                        >
                          {pathItem.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Buttons */}
              <div className="flex space-x-2 overflow-x-auto pb-2"> {/* Added pb-2 for scrollbar visibility */}
                {selectedCategory === null && (
                  <button
                    onClick={() => navigateToCategory(null)}
                    className="px-3 py-1.5 text-sm rounded-lg whitespace-nowrap bg-blue-500 text-white"
                  >
                    Alle
                  </button>
                )}
                
                {dataLoading ? (
                    <div className="text-gray-500">Kategorien werden geladen...</div>
                ) : dataError && categoryList.length === 0 ? (
                    <div className="text-red-500">Fehler beim Laden der Kategorien.</div>
                ) : (
                    getCurrentCategories().map(category => {
                      const hasSubcategories = getSubcategories(category.id).length > 0;
                      const isSelected = selectedCategory === category.id;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => navigateToCategory(category.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <span>{category.name}</span>
                          {hasSubcategories && (
                            <ChevronRight size={14} className={isSelected ? 'text-blue-200' : 'text-gray-500'} />
                          )}
                        </button>
                      );
                    })
                )}
              </div>
              
              {/* Info about current display */}
              <div className="mt-2 text-xs text-gray-500">
                {dataLoading ? "Produkte werden geladen..." :
                 dataError && productList.length === 0 ? "Fehler beim Laden der Produkte." :
                 selectedCategory === null 
                  ? `${filteredProducts.length} Produkte insgesamt`
                  : `${filteredProducts.length} Produkte in dieser Kategorie`}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onTouchStart={() => handleTouchStart(product)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(product)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    onClick={() => {
                      if (!longPressTimer) { // Only add if not a long press
                        addToCart(product);
                      }
                    }}
                    className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-all active:scale-95 select-none"
                  >
                    <div className="text-2xl mb-2">{product.image}</div>
                    <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                    <div className="text-blue-600 font-bold text-sm">{product.price.toFixed(2)}€</div>
                  </button>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchTerm ? `Keine Produkte für "${searchTerm}" gefunden` : 'Keine Produkte in dieser Kategorie'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        product={productModal}
        tempProduct={tempProduct}
        setTempProduct={setTempProduct}
        addProductFromModal={addProductFromModal}
        onClose={() => setProductModal(null)}
      />

      {/* Discount Modal */}
      <DiscountModal
        discountModal={discountModal}
        setDiscountModal={setDiscountModal}
        applyDiscount={applyDiscount}
        cartItems={cartItems}
        subtotal={subtotal}
        globalDiscountAmount={globalDiscountAmount}
        calculateItemTotal={calculateItemTotal}
        onClose={() => setDiscountModal(null)}
      />

      {/* Customer Selection View */}
      {currentView === 'customer' && (
        <CustomerSelector
          customerList={customerList}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customerSearchTerm={customerSearchTerm}
          setCustomerSearchTerm={setCustomerSearchTerm}
          onClose={() => setCurrentView('main')}
        />
      )}

      {/* Payment Processing View */}
      {currentView === 'payment' && (
        <PaymentView
          cartItems={cartItems}
          subtotal={subtotal}
          globalDiscount={globalDiscount}
          globalDiscountAmount={globalDiscountAmount}
          cartTotal={cartTotal}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          printReceipt={printReceipt}
          setPrintReceipt={setPrintReceipt}
          completeTransaction={completeTransaction}
          calculateItemTotal={calculateItemTotal}
          onClose={() => setCurrentView('main')}
        />
      )}
    </div>
  );
}