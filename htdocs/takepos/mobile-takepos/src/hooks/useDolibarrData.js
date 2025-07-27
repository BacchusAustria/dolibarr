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

export function useDolibarrData(apiKey) {
  const [customerList, setCustomerList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!apiKey || apiKey === 'undefined') {
        setCustomerList([{ id: 0, name: 'Standard-Kunde' }]);
        setCategoryList(mockCategories);
        setProductList(mockProducts);
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

        customers.unshift({ id: 0, name: 'Standard-Kunde' }); // Add default customer
        setCustomerList(customers);
        setProductList(products);
        setCategoryList(categories);

      } catch (error) {
        console.error('Fehler beim Laden der Dolibarr-Daten:', error);
        setDataError(error);
        // Fallback to mock data on error
        setCustomerList([{ id: 0, name: 'Standard-Kunde' }]);
        setProductList(mockProducts);
        setCategoryList(mockCategories);
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
    getMainCategories,
    getSubcategories,
    getAllSubcategoryIds
  };
}