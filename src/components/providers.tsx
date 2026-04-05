"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import { NavigationProgress } from "@/components/NavigationProgress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <NavigationProgress />
        {children}
        <Toaster richColors position="top-right" />
      </CartProvider>
    </SessionProvider>
  );
}
