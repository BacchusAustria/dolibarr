import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Printer, Search, Plus, Minus, X, Check, Edit3, Percent, ChevronRight, ChevronLeft } from 'lucide-react';

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
  const [cartItems, setCartItems] = useState([]);

  // NEU: Kunden aus der API
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 0, name: 'Standard-Kunde' });

  //Produkte und Kategorien aus der API
  const [categoryList, setCategoryList] = useState([]);
  const [productList, setProductList] = useState([]);

  const [productModal, setProductModal] = useState(null);
  const [tempProduct, setTempProduct] = useState({ quantity: 1, price: 0 });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [discountModal, setDiscountModal] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState({ value: 0, type: 'percent' }); // percent or euro
const serverUrl = 'https://mittermayer.bplaced.net/dolibarr/htdocs'; // fest im Code
const [apiKey, setApiKey] = useState(localStorage.getItem('dolibarrApiKey') || '');
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
  // --- NEUER useEffect: Kunden aus Dolibarr laden ---
  useEffect(() => {
    if (!apiKey || apiKey === 'undefined') {
      console.log('Kein API-Key gesetzt, Kunden können nicht geladen werden.');
      return; 
  }
    async function loadCustomers() {
      try {
        const response = await fetch(`${serverUrl}/api/index.php/thirdparties`, {

  headers: {
    'DOLAPIKEY': apiKey,
    'Accept': 'application/json'
  }
});

        if (!response.ok) throw new Error('API Fehler' && response.statusText);
        const data = await response.json();

        const customers = data.map(c => ({
          id: c.id,
          name: c.name,
          company: c.name_alias || '',
          email: c.email || ''
        }));

        // Standard-Kunde ergänzen
        customers.unshift({ id: 0, name: 'Standard-Kunde' });

        setCustomerList(customers);
        setSelectedCustomer(customers[0]);
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
        // Fallback: Nur Standard-Kunde
        setCustomerList([{ id: 0, name: 'Standard-Kunde' }]);
      }
    }

    loadCustomers();
  }, [apiKey]);
  // ---------------------------------------------------


  // --- NEUER useEffect: Kategorien und Produkte laden ---

  useEffect(() => {
  if (!apiKey) return;

  async function loadCustomers() {
    try {
      const response = await fetch(`${serverUrl}/api/index.php/thirdparties`, {
        headers: {
          'DOLAPIKEY': apiKey,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('API Fehler Kunden');
      const data = await response.json();

      const customers = data.map(c => ({
        id: c.id,
        name: c.name,
        company: c.name_alias || '',
        email: c.email || ''
      }));

      customers.unshift({ id: 0, name: 'Standard-Kunde' });
      setCustomerList(customers);
      setSelectedCustomer(customers[0]);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
      setCustomerList([{ id: 0, name: 'Standard-Kunde' }]);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(`${serverUrl}/api/index.php/products`, {
        headers: {
          'DOLAPIKEY': apiKey,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('API Fehler Produkte');
      const data = await response.json();

      console.log('Geladene Produkte (Beispiel):', data[0]); // Debug: Struktur eines Produkts

      // Produkte mit Kategorie-Zuordnung laden
      const productsWithCategories = await Promise.all(
        data.map(async (p) => {
          let category = null;
          
          // Versuche verschiedene Felder für die Kategorie
          if (p.fk_category_default) {
            category = parseInt(p.fk_category_default);
          } else if (p.categories && p.categories.length > 0) {
            category = parseInt(p.categories[0]);
          } else {
            // Fallback: Kategorien für dieses Produkt separat laden
            try {
              const catResponse = await fetch(`${serverUrl}/api/index.php/products/${p.id}/categories`, {
                headers: {
                  'DOLAPIKEY': apiKey,
                  'Accept': 'application/json'
                }
              });
              if (catResponse.ok) {
                const catData = await catResponse.json();
                if (catData && catData.length > 0) {
                  category = parseInt(catData[0].id || catData[0]);
                }
              }
            } catch (catError) {
              console.log(`Keine Kategorien für Produkt ${p.id}:`, catError);
            }
          }

          return {
            id: parseInt(p.id),
            name: p.label || p.ref || `Produkt ${p.id}`,
            price: parseFloat(p.price || p.price_ttc || 0),
            category: category,
            image: '🏷️'
          };
        })
      );


      setProductList(productsWithCategories);
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      // Fallback auf Mock-Daten
      setProductList(mockProducts);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(`${serverUrl}/api/index.php/categories?type=product`, {
        headers: {
          'DOLAPIKEY': apiKey,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('API Fehler Kategorien');
      const data = await response.json();

      

      const categories = data.map(cat => {
        
        return {
          id: parseInt(cat.id),
          name: cat.label || cat.name || `Kategorie ${cat.id}`,
          parent: cat.fk_parent ? parseInt(cat.fk_parent) : 0,
          color: 'bg-blue-500'
        };
      });

  
      setCategoryList(categories);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      // Fallback auf Mock-Daten wenn API nicht verfügbar
      setCategoryList(mockCategories);
    }
  }

  // Alle Daten parallel laden
  Promise.all([
    loadCustomers(),
    loadProducts(), 
    loadCategories()
  ]).then(() => {
    console.log('Alle Daten geladen');
  });
}, [apiKey]);

// Hilfsfunktionen für Kategorienhierarchie
function getMainCategories() {
  return categoryList.filter(cat => !cat.parent || cat.parent === 0 || cat.parent === '0');
}

function getSubcategories(parentId) {
  return categoryList.filter(cat => cat.parent == parentId); // == statt === für String/Number Vergleich
}

function getAllSubcategoryIds(categoryId) {
  const result = [parseInt(categoryId)]; // Sicherstellen dass categoryId eine Zahl ist
  let added = true;

  while (added) {
    added = false;
    categoryList.forEach(cat => {
      if (cat.parent && result.includes(parseInt(cat.parent)) && !result.includes(parseInt(cat.id))) {
        result.push(parseInt(cat.id));
        added = true;
      }
    });
  }
  return result;
}

// Kategorie-Navigation
function navigateToCategory(categoryId) {
  if (categoryId === null) {
    // "Alle" ausgewählt
    setSelectedCategory(null);
    setCategoryPath([]);
  } else {
    const category = categoryList.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(categoryId);
      // Pfad aufbauen
      const newPath = [...categoryPath];
      if (!newPath.some(item => item.id === categoryId)) {
        newPath.push({ id: categoryId, name: category.name });
      }
      setCategoryPath(newPath);
    }
  }
}

function navigateBack() {
  if (categoryPath.length > 1) {
    const newPath = categoryPath.slice(0, -1);
    setCategoryPath(newPath);
    setSelectedCategory(newPath[newPath.length - 1].id);
  } else {
    setCategoryPath([]);
    setSelectedCategory(null);
  }
}

// Aktuelle Kategorien für die Anzeige
function getCurrentCategories() {
  if (selectedCategory === null) {
    // Hauptkategorien anzeigen
    return getMainCategories();
  } else {
    // Unterkategorien der ausgewählten Kategorie
    return getSubcategories(selectedCategory);
  }
}

  // ---------------------------------------------------
  // Gefilterte Produkte
  const filteredProducts = productList.filter(product => {
    let matchesCategory = true;
    if (selectedCategory !== null) {
      const validIds = getAllSubcategoryIds(selectedCategory);
      // Auch null/undefined Kategorien berücksichtigen falls keine Kategorie zugewiesen
      matchesCategory = product.category ? validIds.includes(parseInt(product.category)) : false;
    }
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  // Gefilterte Kunden – jetzt aus customerList
  const filteredCustomers = customerList.filter(customer => {
    if (!customerSearchTerm) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  // Long Press Handler
  const handleTouchStart = (product) => {
    const timer = setTimeout(() => {
      setProductModal(product);
      setTempProduct({ quantity: 1, price: product.price });
    }, 500); // 500ms für Long Press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Warenkorb-Funktionen
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

  const updateCartItem = (index, field, value) => {
    setCartItems(cartItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Product Modal Handler
  const addProductFromModal = () => {
    addToCart(productModal, tempProduct.quantity, tempProduct.price);
    setProductModal(null);
    setTempProduct({ quantity: 1, price: 0 });
  };

  // Berechnungen
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

  // Discount functions
  const applyItemDiscount = (index, discountValue, discountType) => {
    setCartItems(cartItems.map((item, i) =>
      i === index ? { ...item, discount: { value: discountValue, type: discountType } } : item
    ));
  };

  const openDiscountModal = (type, index = null) => {
    setDiscountModal({ type, index, value: 0, discountType: 'percent' });
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
    if (!paymentAmount || parseFloat(paymentAmount) < cartTotal) {
      alert('Bezahlter Betrag ist zu niedrig!');
      return;
    }

    try {
      // API-Key validieren
      if (!apiKey || apiKey === 'undefined') {
        throw new Error('Kein gültiger API-Key vorhanden. Bitte neu einloggen.');
      }

      // 1. Rechnung in Dolibarr erstellen (erst ohne Zeilen)
      const invoiceData = {
        socid: selectedCustomer.id === 0 ? null : selectedCustomer.id,
        type: 0, 
        date: Math.floor(Date.now() / 1000),
        note_private: `Mobile TakePos - ${new Date().toLocaleString('de-DE')}`,
        mode_reglement_id: 4,
        cond_reglement_id: 1
      };

      console.log('Sende Rechnung an Dolibarr:', invoiceData);

      const invoiceResponse = await fetch(`${serverUrl}/api/index.php/invoices`, {
        method: 'POST',
        headers: {
          'DOLAPIKEY': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      // Verbesserte Fehlerbehandlung für API-Response
      let invoiceResult;
      const responseText = await invoiceResponse.text();
      
      if (!invoiceResponse.ok) {
        // Prüfen ob es sich um HTML-Fehler handelt
        if (responseText.includes('<br />') || responseText.includes('<html>')) {
          if (responseText.includes('Authentication') || responseText.includes('Login')) {
            throw new Error('API-Authentifizierung fehlgeschlagen. Bitte neu einloggen.');
          } else {
            throw new Error(`Server-Fehler (${invoiceResponse.status}): Wahrscheinlich HTML-Fehlermeldung vom Server`);
          }
        } else {
          throw new Error(`API-Fehler (${invoiceResponse.status}): ${responseText}`);
        }
      }

      // JSON parsen mit Fehlerbehandlung
      try {
        invoiceResult = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Response ist kein gültiges JSON:', responseText);
        throw new Error('Server hat ungültige Antwort gesendet (kein JSON)');
      }

      const invoiceId = invoiceResult;
      console.log('Rechnung erstellt mit ID:', invoiceId);

      // 1a. Rechnungszeilen einzeln hinzufügen
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const lineData = {
          desc: item.name,
          qty: item.quantity,
          subprice: item.price,
          tva_tx: 0,
          fk_product: parseInt(item.id)
        };

        try {
          const lineResponse = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/lines`, {
            method: 'POST',
            headers: {
              'DOLAPIKEY': apiKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(lineData)
          });

          if (!lineResponse.ok) {
            console.warn(`Warnung: Zeile ${i + 1} konnte nicht hinzugefügt werden`);
          }
        } catch (lineError) {
          console.warn(`Fehler beim Hinzufügen der Zeile ${i + 1}:`, lineError);
        }
      }

      // Globalen Rabatt als Zeile hinzufügen
      if (globalDiscount.value > 0) {
        try {
          const discountLineData = {
            desc: `Gesamtrabatt (${globalDiscount.value}${globalDiscount.type === 'percent' ? '%' : '€'})`,
            qty: 1,
            subprice: -globalDiscountAmount,
            tva_tx: 0
          };

          const discountResponse = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/lines`, {
            method: 'POST',
            headers: {
              'DOLAPIKEY': apiKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(discountLineData)
          });

          if (!discountResponse.ok) {
            console.warn('Warnung: Rabattzeile konnte nicht hinzugefügt werden');
          }
        } catch (discountError) {
          console.warn('Fehler beim Hinzufügen der Rabattzeile:', discountError);
        }
      }

      // 2. Rechnung validieren (von Entwurf zu gültig)
      try {
        const validateResponse = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/validate`, {
          method: 'POST',
          headers: {
            'DOLAPIKEY': apiKey,
            'Accept': 'application/json'
          }
        });

        if (!validateResponse.ok) {
          console.warn('Warnung: Rechnung konnte nicht validiert werden');
        }
      } catch (validateError) {
        console.warn('Validierung fehlgeschlagen:', validateError);
      }

      // 3. Zahlung erfassen
      try {
        const paymentData = {
          datepaye: Math.floor(Date.now() / 1000),
          paiementid: 4, // 4 = Bargeld
          num_paiement: `CASH-${Date.now()}`,
          amount: parseFloat(paymentAmount),
          fk_facture: invoiceId
        };

        const paymentResponse = await fetch(`${serverUrl}/api/index.php/bankaccounts/payments`, {
          method: 'POST',
          headers: {
            'DOLAPIKEY': apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        if (!paymentResponse.ok) {
          // Alternative Zahlungserfassung über direkten Invoice-Endpunkt
          const altPaymentData = {
            closepaidinvoices: invoiceId,
            accountid: 1, // Standard Bankkonto
            datepaye: Math.floor(Date.now() / 1000),
            paiementid: 4,
            num_paiement: `CASH-${Date.now()}`,
            amount: parseFloat(paymentAmount)
          };

          const altPaymentResponse = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/payments`, {
            method: 'POST',
            headers: {
              'DOLAPIKEY': apiKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(altPaymentData)
          });

          if (!altPaymentResponse.ok) {
            console.warn('Warnung: Zahlung konnte nicht erfasst werden (beide Methoden fehlgeschlagen)');
          } else {
            console.log('Zahlung über alternative Methode erfasst');
          }
        } else {
          console.log('Zahlung erfolgreich erfasst');
        }
      } catch (paymentError) {
        console.warn('Zahlungserfassung fehlgeschlagen:', paymentError);
      }

      // 4. PDF-Beleg generieren (falls gewünscht)
      if (printReceipt) {
        try {
          // Erst versuchen das Dokument zu generieren
          const pdfResponse = await fetch(`${serverUrl}/api/index.php/documents/builddoc`, {
            method: 'POST',
            headers: {
              'DOLAPIKEY': apiKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              modulepart: 'facture',
              original_file: `${invoiceId}/${invoiceId}.pdf`,
              doctemplate: '',
              langcode: 'de_DE'
            })
          });

          if (pdfResponse.ok) {
            // PDF-Download-Link öffnen
            const downloadUrl = `${serverUrl}/document.php?modulepart=facture&file=${invoiceId}/${invoiceId}.pdf&entity=1`;
            
            // Neues Fenster für PDF öffnen
            window.open(downloadUrl, '_blank');
            
            console.log('PDF wurde generiert und geöffnet');
          } else {
            // Fallback: Direkter Link ohne Generierung
            const directUrl = `${serverUrl}/document.php?modulepart=facture&file=${invoiceId}/${invoiceId}.pdf&entity=1`;
            window.open(directUrl, '_blank');
            console.log('Direkter PDF-Link geöffnet (ohne Generierung)');
          }
        } catch (pdfError) {
          console.warn('PDF konnte nicht generiert werden:', pdfError);
          
          // Als letzten Ausweg: Druckfreundliche Zusammenfassung anzeigen
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
                  Bezahlt: ${paymentAmount}€<br>
                  Wechselgeld: ${changeAmount.toFixed(2)}€
                </div>
                
                <button onclick="window.print()">Drucken</button>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }

      // Erfolgs-Nachricht
      alert(`✅ Transaktion erfolgreich abgeschlossen!

Rechnung Nr.: ${invoiceId}
Kunde: ${selectedCustomer.name}
Gesamt: ${cartTotal.toFixed(2)}€
Bezahlt: ${paymentAmount}€
Wechselgeld: ${changeAmount.toFixed(2)}€

${printReceipt ? 'Beleg wird geöffnet...' : ''}`);

      // Reset der Anwendung
      setCartItems([]);
      setPaymentAmount('');
      setCurrentView('main');
      setSelectedCustomer(customerList[0]);
      setGlobalDiscount({ value: 0, type: 'percent' });

    } catch (error) {
      console.error('Fehler bei der Transaktionsabwicklung:', error);
      
      // Spezielle Behandlung für Authentifizierungsfehler
      if (error.message.includes('Authentication') || error.message.includes('einloggen')) {
        if (window.confirm('API-Sitzung abgelaufen. Möchten Sie sich neu einloggen?')) {
          localStorage.removeItem('dolibarrApiKey');
          setApiKey('');
          return; // Nicht zurücksetzen, damit Warenkorb erhalten bleibt
        }
      }
      
      // Fallback: Lokale Speicherung/Anzeige
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
        paid: parseFloat(paymentAmount),
        change: changeAmount
      };

      // Lokale Speicherung für Offline-Belege
      const offlineReceipts = JSON.parse(localStorage.getItem('offlineReceipts') || '[]');
      offlineReceipts.push(receiptData);
      localStorage.setItem('offlineReceipts', JSON.stringify(offlineReceipts));

      alert(`⚠️ Rechnung konnte nicht in Dolibarr gespeichert werden!
Fehler: ${error.message}

Die Transaktion wurde lokal gespeichert.
Kunde: ${selectedCustomer.name}
Gesamt: ${cartTotal.toFixed(2)}€
Bezahlt: ${paymentAmount}€
Wechselgeld: ${changeAmount.toFixed(2)}€

Bitte später manuell in Dolibarr nachtragen.`);

      // Trotzdem zurücksetzen
      setCartItems([]);
      setPaymentAmount('');
      setCurrentView('main');
      setSelectedCustomer(customerList[0]);
      setGlobalDiscount({ value: 0, type: 'percent' });
    }
  };


if (!apiKey || apiKey === 'undefined') {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Dolibarr Login</h2>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          onClick={async () => {
            try {
              const resp = await fetch(`${serverUrl}/api/index.php/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: username, password: password })
              });

              if (!resp.ok) throw new Error('Login fehlgeschlagen');
              const data = await resp.json();
              console.log('Login response:', data);
              if (data.success && data.success.token) {
                localStorage.setItem('dolibarrApiKey', data.success.token);
                setApiKey(data.success.token);
                console.log('Login erfolgreich:', data);
                
              } else {
                alert('Falscher Benutzer oder Passwort.');
              }
            } catch (err) {
              console.error(err);
              alert('Login fehlgeschlagen');
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
            <button
  onClick={() => {
    localStorage.removeItem('dolibarrApiKey');
    setApiKey('');
  }}
  className="ml-2 p-2 bg-red-500 text-white rounded"
>
  Logout
</button>
          </div>
        </div>
        
        <div className="mt-1 text-sm opacity-90">
          Kunde: {selectedCustomer.name}
        </div>
      </div>

      {/* Hauptansicht mit Split-View */}
      {currentView === 'main' && (
        <div className="flex-1 flex flex-col">
          {/* Warenkorb-Bereich (oberer Teil) */}
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
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                          className="p-1 bg-gray-300 rounded hover:bg-gray-400"
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
                        />
                        <span className="text-xs">€</span>
                        
                        <button
                          onClick={() => openDiscountModal('item', index)}
                          className={`p-1 rounded hover:bg-orange-200 ${
                            item.discount.value > 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                          title="Rabatt"
                        >
                          <Percent size={10} />
                        </button>
                        
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-500 hover:text-red-700"
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

          {/* Produktbereich (unterer Teil) */}
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

            {/* Kategorie-Navigation */}
            <div className="p-3 bg-white border-b">
              
              {/* Breadcrumb */}
              {categoryPath.length > 0 && (
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                  <button
                    onClick={() => navigateBack()}
                    className="p-1 text-gray-500 hover:text-gray-700"
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

              {/* Kategorie-Buttons */}
              <div className="flex space-x-2 overflow-x-auto">
                {selectedCategory === null && (
                  <button
                    onClick={() => navigateToCategory(null)}
                    className="px-3 py-1.5 text-sm rounded-lg whitespace-nowrap bg-blue-500 text-white"
                  >
                    Alle
                  </button>
                )}
                
                {getCurrentCategories().map(category => {
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
                })}
              </div>
              
              {/* Info über aktuelle Anzeige */}
              <div className="mt-2 text-xs text-gray-500">
                {selectedCategory === null 
                  ? `${filteredProducts.length} Produkte insgesamt`
                  : `${filteredProducts.length} Produkte in dieser Kategorie`
                }
              </div>
            </div>

            {/* Produktgrid */}
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
                      if (!longPressTimer) {
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

      {/* Discount Modal */}
      {discountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">
                <Percent className="mx-auto text-orange-500" size={32} />
              </div>
              <h3 className="text-lg font-bold">
                {discountModal.type === 'item' ? 'Positionsrabatt' : 'Gesamtrabatt'}
              </h3>
              {discountModal.type === 'item' && (
                <p className="text-gray-600 text-sm mt-1">
                  {cartItems[discountModal.index]?.name}
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rabatt-Art</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDiscountModal({...discountModal, discountType: 'percent'})}
                    className={`flex-1 py-2 px-3 rounded border ${
                      discountModal.discountType === 'percent' 
                        ? 'bg-orange-500 text-white border-orange-500' 
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Prozent (%)
                  </button>
                  <button
                    onClick={() => setDiscountModal({...discountModal, discountType: 'euro'})}
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
                  onChange={(e) => setDiscountModal({...discountModal, value: parseFloat(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2 text-right"
                  step={discountModal.discountType === 'percent' ? '1' : '0.01'}
                  min="0"
                  max={discountModal.discountType === 'percent' ? '100' : undefined}
                  placeholder="0"
                />
              </div>
              
              {discountModal.type === 'item' && discountModal.index !== null && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Ursprünglich:</span>
                      <span>{(cartItems[discountModal.index].price * cartItems[discountModal.index].quantity).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rabatt:</span>
                      <span className="text-orange-600">
                        -{discountModal.discountType === 'percent' 
                          ? `${discountModal.value}% (${((cartItems[discountModal.index].price * cartItems[discountModal.index].quantity) * (discountModal.value / 100)).toFixed(2)}€)`
                          : `${discountModal.value.toFixed(2)}€`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Neu:</span>
                      <span>
                        {discountModal.discountType === 'percent' 
                          ? ((cartItems[discountModal.index].price * cartItems[discountModal.index].quantity) * (1 - discountModal.value / 100)).toFixed(2)
                          : Math.max(0, (cartItems[discountModal.index].price * cartItems[discountModal.index].quantity) - discountModal.value).toFixed(2)}€
                      </span>
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
                        -{discountModal.discountType === 'percent' 
                          ? `${discountModal.value}% (${(subtotal * (discountModal.value / 100)).toFixed(2)}€)`
                          : `${discountModal.value.toFixed(2)}€`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Gesamt:</span>
                      <span>
                        {discountModal.discountType === 'percent' 
                          ? (subtotal * (1 - discountModal.value / 100)).toFixed(2)
                          : Math.max(0, subtotal - discountModal.value).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setDiscountModal(null)}
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

          {/* Kunden-Suchleiste */}
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
                    setCustomerSearchTerm(''); // Reset search when customer is selected
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
      )}

      {/* Zahlungsabwicklung */}
      {currentView === 'payment' && (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-white shadow-sm">
            <h2 className="text-lg font-bold">Zahlung</h2>
            <button
              onClick={() => setCurrentView('main')}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Rechnungsübersicht */}
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
              
              {/* Schnell-Buttons */}
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
              //disabled={!paymentAmount || parseFloat(paymentAmount) < cartTotal}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all bg-green-500 
                text-white hover:bg-green-600 active:scale-95` }
            >
              <div className="flex items-center justify-center space-x-2">
                <CreditCard size={20} />
                <span>Zahlung abschließen</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Product Modal für Long Press */}
      {productModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{productModal.image}</div>
              <h3 className="text-lg font-bold">{productModal.name}</h3>
              <p className="text-gray-600">Standardpreis: {productModal.price.toFixed(2)}€</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Menge</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setTempProduct({...tempProduct, quantity: Math.max(1, tempProduct.quantity - 1)})}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={tempProduct.quantity}
                    onChange={(e) => setTempProduct({...tempProduct, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                    className="flex-1 text-center border rounded px-3 py-2"
                    min="1"
                  />
                  <button
                    onClick={() => setTempProduct({...tempProduct, quantity: tempProduct.quantity + 1})}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Preis pro Stück</label>
                <input
                  type="number"
                  value={tempProduct.price}
                  onChange={(e) => setTempProduct({...tempProduct, price: parseFloat(e.target.value) || 0})}
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
                onClick={() => setProductModal(null)}
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
      )}
    </div>
  );
}