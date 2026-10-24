import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@/lib/tracking';
import { productImage } from '@/lib/productImages';

const CartContext = createContext(null);
import { CART_STORAGE_KEY as KEY, MAX_CART_QUANTITY, normalizeCartQuantity, readCart } from './cartStorage';

function lineKey(productId, variant) {
  return `${productId}::${variant || ''}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((product, quantity = 1, variant = null) => {
    quantity = normalizeCartQuantity(quantity);
    if (!product?.id || !quantity) return;
    trackEvent('cart_add', { product_id: product.id, value_usd: product.price_usd });
    setItems((prev) => {
      const key = lineKey(product.id, variant);
      const existing = prev.find((i) => lineKey(i.product_id, i.variant) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.product_id, i.variant) === key ? { ...i, quantity: Math.min(MAX_CART_QUANTITY, i.quantity + quantity) } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug || null,
          title: product.title,
          image: productImage(product),
          price_usd: Number(product.price_usd) || 0,
          source_type: product.source_type,
          seller_id: product.seller_id || null,
          seller_name: product.seller_name || null,
          supplier_id: product.supplier_id || null,
          supplier_name: product.supplier_name || null,
          weight_kg: product.weight_kg || 0.5,
          variant: variant || null,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId, variant, quantity) => {
    setItems((prev) =>
      prev
        .map((i) =>
          lineKey(i.product_id, i.variant) === lineKey(productId, variant) ? { ...i, quantity: normalizeCartQuantity(quantity) } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId, variant) => {
    setItems((prev) => prev.filter((i) => lineKey(i.product_id, i.variant) !== lineKey(productId, variant)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.quantity * (Number(i.price_usd) || 0), 0);
    return { items, count, subtotal: Math.round(subtotal * 100) / 100, addItem, updateQuantity, removeItem, clear };
  }, [items, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}