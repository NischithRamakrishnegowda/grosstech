"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, Package, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const { items } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-700">
            <Package className="w-6 h-6" />
            <span>Gross<span className="text-gray-800">Tech</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/#about" className="hover:text-green-700 transition-colors">About Us</Link>
            <Link href="/products" className="hover:text-green-700 transition-colors">Our Products</Link>
            {session?.user.role === "ADMIN" && (
              <Link
                href="/admin/inventory"
                className="text-green-700 font-semibold hover:text-green-800 transition-colors flex items-center gap-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                Inventory
              </Link>
            )}
            <Link href="/#contact" className="hover:text-green-700 transition-colors">Get in Touch</Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/checkout" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-green-600 text-white rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2" type="button">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block max-w-[100px] truncate">{session.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs text-gray-500">
                    {session.user.email}
                    <span className="ml-1 capitalize text-green-600">({session.user.role.toLowerCase()})</span>
                  </div>
                  <DropdownMenuSeparator />
                  {session.user.role === "SELLER" && (
                    <DropdownMenuItem onClick={() => router.push("/seller/dashboard")}>
                      My Dashboard
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "BUYER" && (
                    <DropdownMenuItem onClick={() => router.push("/orders")}>
                      My Orders
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-md"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            <Link href="/#about" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link href="/products" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50" onClick={() => setMobileOpen(false)}>Our Products</Link>
            {session?.user.role === "ADMIN" && (
              <Link href="/admin/inventory" className="block px-3 py-2 text-sm rounded-md text-green-700 font-semibold hover:bg-green-50" onClick={() => setMobileOpen(false)}>Inventory</Link>
            )}
            <Link href="/#contact" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50" onClick={() => setMobileOpen(false)}>Get in Touch</Link>
          </div>
        )}
      </div>
    </header>
  );
}
