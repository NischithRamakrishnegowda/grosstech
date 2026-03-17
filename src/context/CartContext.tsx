"use client";

import { createContext, useContext, useReducer, useEffect } from "react";

export interface CartItem {
  listingId: string;
  priceOptionId: string;
  name: string;
  brand?: string;
  weight: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

type Action =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; priceOptionId: string }
  | { type: "UPDATE_QTY"; priceOptionId: string; quantity: number }
  | { type: "CLEAR" };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "ADD": {
      const exists = state.find((i) => i.priceOptionId === action.item.priceOptionId);
      if (exists) {
        return state.map((i) =>
          i.priceOptionId === action.item.priceOptionId
            ? { ...i, quantity: i.quantity + action.item.quantity }
            : i
        );
      }
      return [...state, action.item];
    }
    case "REMOVE":
      return state.filter((i) => i.priceOptionId !== action.priceOptionId);
    case "UPDATE_QTY":
      return state.map((i) =>
        i.priceOptionId === action.priceOptionId ? { ...i, quantity: action.quantity } : i
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (priceOptionId: string) => void;
  updateQty: (priceOptionId: string, quantity: number) => void;
  clearCart: () => void;
}>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, [], () => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem: (item) => dispatch({ type: "ADD", item }),
        removeItem: (priceOptionId) => dispatch({ type: "REMOVE", priceOptionId }),
        updateQty: (priceOptionId, quantity) =>
          dispatch({ type: "UPDATE_QTY", priceOptionId, quantity }),
        clearCart: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
