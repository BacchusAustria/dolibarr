export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login'
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (id: string) => `/categories/${id}`
  },
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    SEARCH: '/customers/search',
    CREATE: '/customers',
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`
  }
};

export const MOCK_DATA = {
  CATEGORIES: [
    { id: '1', name: 'Getränke', color: 'bg-[#828f9a]' },
    { id: '2', name: 'Speisen', color: 'bg-[#818872]' },
    { id: '3', name: 'Desserts', color: 'bg-[#CBCEBD]' },
    { id: '4', name: 'Snacks', color: 'bg-[#171819]' }
  ],
  PRODUCTS: [
    { id: '1', name: 'Kaffee', price: 2.50, category: 1, image: '☕' },
    { id: '2', name: 'Tee', price: 2.00, category: 1, image: '🍵' },
    { id: '3', name: 'Cola', price: 2.80, category: 1, image: '🥤' },
    { id: '4', name: 'Wasser', price: 1.50, category: 1, image: '💧' },
    { id: '5', name: 'Sandwich', price: 4.50, category: 2, image: '🥪' },
    { id: '6', name: 'Salat', price: 6.80, category: 2, image: '🥗' },
    { id: '7', name: 'Pizza', price: 8.90, category: 2, image: '🍕' },
    { id: '8', name: 'Kuchen', price: 3.20, category: 3, image: '🍰' },
    { id: '9', name: 'Eis', price: 2.90, category: 3, image: '🍦' },
    { id: '10', name: 'Chips', price: 1.80, category: 4, image: '🍟' }
  ],
  DEFAULT_CUSTOMER: { id: '1', name: 'AbHof Kunde' }
};

export const APP_CONFIG = {
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 1,
  DEFAULT_API_URL: '/api'
};
