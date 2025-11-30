// src/hooks/useDolibarrData.js
import { useState, useEffect } from 'react';
import { api } from '../api';

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

const DEFAULT_CUSTOMER_NAME = 'AbHof Kunde';

export function useDolibarrData(apiKey) {
  const [customerList, setCustomerList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [defaultCustomer, setDefaultCustomer] = useState(null);


  // Function to ensure default customer exists
  const ensureDefaultCustomer = async (customers, apiKey) => {
    // Look for existing default customer
    let defaultCust = customers.find(c => c.name === DEFAULT_CUSTOMER_NAME);
    
    if (!defaultCust && apiKey && apiKey !== 'undefined') {
      try {
        // Create the default customer if it doesn't exist
        const customerData = {
          name: DEFAULT_CUSTOMER_NAME,
          name_alias: 'AbHof Standard Kunde',
          client: 1, // Mark as customer
          fournisseur: 0, // Not a supplier
          particulier: 0, // Not an individual
          status: 1, // Active
          code_client: 'ABHOF_DEFAULT',
          address: '',
          zip: '',
          town: '',
          country_id: 1, // Adjust according to your Dolibarr setup
          email: '',
          phone: ''
        };

        console.log('Creating default customer:', DEFAULT_CUSTOMER_NAME);
        defaultCust = await api.createCustomer(apiKey, customerData);
        console.log('Default customer created:', defaultCust);
        
        // Add to customer list
        customers.push(defaultCust);
      } catch (error) {
        console.error('Failed to create default customer:', error);
        // Create a fallback customer for offline mode
        defaultCust = { 
          id: -1, 
          name: DEFAULT_CUSTOMER_NAME, 
          company: 'AbHof Standard Kunde',
          email: '' 
        };
        customers.push(defaultCust);
      }
    } else if (!defaultCust) {
      // In offline/mock mode, create mock default customer
      defaultCust = { 
        id: -1, 
        name: DEFAULT_CUSTOMER_NAME, 
        company: 'AbHof Standard Kunde',
        email: '' 
      };
      customers.push(defaultCust);
    }

    return defaultCust;
  };

  useEffect(() => {
    async function loadData() {
      if (!apiKey || apiKey === 'undefined') {
        const mockCustomers = [{ id: 0, name: 'Standard-Kunde' }];
        const defaultCust = await ensureDefaultCustomer(mockCustomers, apiKey);
        
        setCustomerList(mockCustomers);
        setCategoryList(mockCategories);
        setProductList(mockProducts);
        setDefaultCustomer(defaultCust);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const [customers, products, categories] = await Promise.all([
          api.fetchCustomers(apiKey),
          api.fetchProducts(apiKey),
          api.fetchCategories(apiKey)
        ]);

        // Ensure default customer exists
        const defaultCust = await ensureDefaultCustomer(customers, apiKey);

        setCustomerList(customers);
        setProductList(products);
        setCategoryList(categories);
        setDefaultCustomer(defaultCust);

      } catch (error) {
        console.error('Fehler beim Laden der Dolibarr-Daten:', error);
        setDataError(error);
        
        // Fallback to mock data on error
        const fallbackCustomers = [{ id: 0, name: 'Standard-Kunde' }];
        const defaultCust = await ensureDefaultCustomer(fallbackCustomers, null);
        
        setCustomerList(fallbackCustomers);
        setProductList(mockProducts);
        setCategoryList(mockCategories);
        setDefaultCustomer(defaultCust);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [apiKey]);

  // Helper functions for category hierarchy
  const getMainCategories = () => {
    return categoryList.filter(cat => !cat.parent || cat.parent === 0 || cat.parent === '0');
  };

  const getSubcategories = (parentId) => {
    return categoryList.filter(cat => cat.parent == parentId);
  };

  const getAllSubcategoryIds = (categoryId) => {
    const result = [parseInt(categoryId)];
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
  };

  return {
    customerList,
    categoryList,
    productList,
    dataLoading,
    dataError,
    defaultCustomer,
    getMainCategories,
    getSubcategories,
    getAllSubcategoryIds
  };
}