// src/api.js
const serverUrl = 'https://mittermayer.bplaced.net/dolibarr/htdocs';

const handleApiResponse = async (response) => {
  // Clone the response so we can read it multiple times if needed
  const responseClone = response.clone();
  
  try {
    const data = await response.json();
    if (!response.ok) {
      // If response is not OK, but we successfully parsed JSON, it's an API error
      throw new Error(`API-Fehler (${response.status}): ${data.error ? (data.error.message || JSON.stringify(data.error)) : JSON.stringify(data)}`);
    }
    return data;
  } catch (jsonError) {
    // If JSON parsing failed, try to get the raw text from the cloned response
    try {
      const errorText = await responseClone.text();
      
      if (errorText.includes('<br />') || errorText.includes('Warning:') || errorText.includes('<html>')) {
        if (errorText.includes('Authentication') || errorText.includes('Login')) {
          throw new Error('API-Authentifizierung fehlgeschlagen. Bitte neu einloggen.');
        } else {
          // This is the case where PHP warnings corrupted the JSON response
          console.error('Raw response containing PHP warnings:', errorText);
          throw new Error(`Server-Fehler (${response.status}): Die Antwort enthielt PHP-Warnungen und konnte nicht als JSON verarbeitet werden. Details: ${errorText.substring(0, 200)}...`);
        }
      } else {
        // It's not HTML/PHP warnings, so it's likely just malformed or no JSON
        console.error('Response ist kein gültiges JSON oder leer:', errorText);
        console.error('Original JSON Parse Error:', jsonError);
        throw new Error(`Server hat ungültige Antwort gesendet (kein JSON). Status: ${response.status}. Original Error: ${jsonError.message}`);
      }
    } catch (textError) {
      // If even reading as text fails, throw the original JSON error
      console.error('Could not read response as text either:', textError);
      throw new Error(`Server-Antwort konnte nicht verarbeitet werden. Status: ${response.status}. JSON Error: ${jsonError.message}, Text Error: ${textError.message}`);
    }
  }
};

export const api = {
  login: async (username, password) => {
    const response = await fetch(`${serverUrl}/api/index.php/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: username, password: password })
    });
    const data = await handleApiResponse(response);
    if (data.success && data.success.token) {
      return data.success.token;
    } else {
      throw new Error('Falscher Benutzername oder Passwort.');
    }
  },

  fetchCustomers: async (apiKey) => {
    const response = await fetch(`${serverUrl}/api/index.php/thirdparties`, {
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json' }
    });
    const data = await handleApiResponse(response);
    return data.map(c => ({
      id: parseInt(c.id),
      name: c.name,
      company: c.name_alias || '',
      email: c.email || ''
    }));
  },

  fetchProducts: async (apiKey) => {
    const response = await fetch(`${serverUrl}/api/index.php/products`, {
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json' }
    });
    const data = await handleApiResponse(response);

    const productsWithCategories = await Promise.all(
      data.map(async (p) => {
        let category = null;
        if (p.fk_category_default) {
          category = parseInt(p.fk_category_default);
        } else if (p.categories && p.categories.length > 0) {
          category = parseInt(p.categories[0]);
        } else {
          try {
            const catResponse = await fetch(`${serverUrl}/api/index.php/products/${p.id}/categories`, {
              headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json' }
            });
            if (catResponse.ok) {
              const catData = await handleApiResponse(catResponse);
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
    return productsWithCategories;
  },

  fetchCategories: async (apiKey) => {
    const response = await fetch(`${serverUrl}/api/index.php/categories?type=product`, {
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json' }
    });
    const data = await handleApiResponse(response);
    return data.map(cat => ({
      id: parseInt(cat.id),
      name: cat.label || cat.name || `Kategorie ${cat.id}`,
      parent: cat.fk_parent ? parseInt(cat.fk_parent) : 0,
      color: 'bg-blue-500' // Beispiel: Farbe dynamisch generieren oder aus API
    }));
  },

  createInvoice: async (apiKey, invoiceData) => {
    const response = await fetch(`${serverUrl}/api/index.php/invoices`, {
      method: 'POST',
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    return handleApiResponse(response);
  },

  addInvoiceLine: async (apiKey, invoiceId, lineData) => {
    const response = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/lines`, {
      method: 'POST',
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(lineData)
    });
    return handleApiResponse(response);
  },

  validateInvoice: async (apiKey, invoiceId) => {
    const response = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/validate`, {
      method: 'POST',
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json' }
    });
    return handleApiResponse(response);
  },


  recordPayment: async (apiKey, invoiceId, paymentData) => {
    const response = await fetch(`${serverUrl}/api/index.php/invoices/${invoiceId}/settopaid`, {
      method: 'POST',
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  generatePdf: async (apiKey, invoiceId) => {
    const response = await fetch(`${serverUrl}/api/index.php/documents/builddoc`, {
      method: 'POST',
      headers: { 'DOLAPIKEY': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulepart: 'facture',
        original_file: `${invoiceId}/${invoiceId}.pdf`,
        doctemplate: '',
        langcode: 'de_DE'
      })
    });
    // Dolibarr's builddoc API returns just a success/error status, not the PDF itself.
    // The actual PDF download is via a direct URL.
    // We still call handleApiResponse to catch potential errors in the response structure
    await handleApiResponse(response); 
    return `${serverUrl}/document.php?modulepart=facture&file=${invoiceId}/${invoiceId}.pdf&entity=1`;
  }
};