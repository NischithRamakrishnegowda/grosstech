"use client";

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

export interface CartItem {
  listingId: string;
  priceOptionId: string;
  name: string;
  brand?: string;
  weight: string;
  price: number;
  stock: number;
  imageUrl?: string;
  quantity: number;
}

type Action =
  | { type: "INIT"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; priceOptionId: string }
  | { type: "UPDATE_QTY"; priceOptionId: string; quantity: number }
  | { type: "CLEAR" };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "INIT":
      return action.items;
    case "ADD": {
      const exists = state.find((i) => i.priceOptionId === action.item.priceOptionId);
      if (exists) {
        return state.map((i) =>
          i.priceOptionId === action.item.priceOptionId
            ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
            : i
        );
      }
      return [...state, action.item];
    }
    case "REMOVE":
      return state.filter((i) => i.priceOptionId !== action.priceOptionId);
    case "UPDATE_QTY":
      return state.map((i) =>
        i.priceOptionId === action.priceOptionId
          ? { ...i, quantity: Math.min(Math.max(1, action.quantity), i.stock) }
          : i
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

const CartContext = createContext<{
  items: CartItem[];
  cartReady: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (priceOptionId: string) => void;
  updateQty: (priceOptionId: string, quantity: number) => void;
  clearCart: () => void;
}>({
  items: [],
  cartReady: false,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  // null while session is loading; "guest" when logged out; user.id when logged in
  const userId = status === "loading" ? null : (session?.user?.id ?? "guest");

  const [items, dispatch] = useReducer(reducer, []);
  // tracks which userId's cart is currently loaded to prevent premature saves
  const [cartUserId, setCartUserId] = useState<string | null>(null);

  // Re-load cart whenever the logged-in user changes (login / logout)
  useEffect(() => {
    if (userId === null) return; // still resolving session
    try {
      const stored = localStorage.getItem(`cart_${userId}`);
      dispatch({ type: "INIT", items: stored ? JSON.parse(stored) : [] });
    } catch {
      dispatch({ type: "INIT", items: [] });
    }
    setCartUserId(userId);
  }, [userId]);

  // Persist to localStorage only after the correct user's cart has been loaded
  useEffect(() => {
    if (cartUserId === null || cartUserId !== userId) return;
    localStorage.setItem(`cart_${userId}`, JSON.stringify(items));
  }, [items, cartUserId, userId]);

  const addItem = useCallback((item: CartItem) => dispatch({ type: "ADD", item }), []);
  const removeItem = useCallback((priceOptionId: string) => dispatch({ type: "REMOVE", priceOptionId }), []);
  const updateQty = useCallback((priceOptionId: string, quantity: number) => dispatch({ type: "UPDATE_QTY", priceOptionId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const cartReady = cartUserId !== null;
  const value = useMemo(() => ({ items, cartReady, addItem, removeItem, updateQty, clearCart }), [items, cartReady, addItem, removeItem, updateQty, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
