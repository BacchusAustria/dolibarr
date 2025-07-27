// src/hooks/useCart.js
import { useState, useMemo } from 'react';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState({ value: 0, type: 'percent' });

  const calculateItemTotal = (item) => {
    const baseTotal = item.price * item.quantity;
    if (item.discount && item.discount.value > 0) {
      if (item.discount.type === 'percent') {
        return baseTotal * (1 - item.discount.value / 100);
      } else {
        return Math.max(0, baseTotal - item.discount.value);
      }
    }
    return baseTotal;
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  }, [cartItems]);

  const calculateGlobalDiscountAmount = () => {
    if (globalDiscount.value === 0) return 0;
    if (globalDiscount.type === 'percent') {
      return subtotal * (globalDiscount.value / 100);
    } else {
      return Math.min(globalDiscount.value, subtotal);
    }
  };
  
  const globalDiscountAmount = useMemo(() => calculateGlobalDiscountAmount(), [globalDiscount, subtotal]);
  const cartTotal = useMemo(() => Math.max(0, subtotal - globalDiscountAmount), [subtotal, globalDiscountAmount]);

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
        discount: { value: 0, type: 'percent' } // Default discount
      }]);
    }
  };

  const updateCartItem = (index, field, value) => {
    setCartItems(prevItems => prevItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFromCart = (index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const applyItemDiscount = (index, discountValue, discountType) => {
    setCartItems(prevItems => prevItems.map((item, i) =>
      i === index ? { ...item, discount: { value: discountValue, type: discountType } } : item
    ));
  };

  const resetCart = () => {
    setCartItems([]);
    setGlobalDiscount({ value: 0, type: 'percent' });
  };

  return {
    cartItems,
    setCartItems, // Sometimes needed for external manipulation or reset
    globalDiscount,
    setGlobalDiscount,
    addToCart,
    updateCartItem,
    removeFromCart,
    applyItemDiscount,
    calculateItemTotal,
    subtotal,
    globalDiscountAmount,
    cartTotal,
    resetCart
  };
}