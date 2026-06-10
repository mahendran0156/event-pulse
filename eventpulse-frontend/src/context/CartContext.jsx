import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (event, qty) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.event._id === event._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty };
        return next;
      }
      return [...prev, { event, qty }];
    });
  };

  const removeFromCart = (eventId) =>
    setCart(prev => prev.filter(i => i.event._id !== eventId));

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s, i) => s + i.event.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
