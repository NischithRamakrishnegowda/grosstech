"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, LayoutDashboard, LogOut, User, Leaf } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const { items } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isInventoryActive = pathname.startsWith("/admin");

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">
              Gross<span className="text-green-600">Tech</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link href="/#about" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              About
            </Link>
            <Link href="/products" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              Products
            </Link>
            {session && (
              <Link href="/buyer-requests" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                Buy Requests
              </Link>
            )}
            {session?.user.role === "ADMIN" && (
              <Link
                href="/admin/inventory"
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isInventoryActive
                    ? "text-green-600 font-semibold bg-green-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Inventory
              </Link>
            )}
            <Link href="/#contact" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              Contact
            </Link>
          </nav>

          {/* Right — desktop shows full auth, mobile shows cart + hamburger only */}
          <div className="flex items-center gap-1.5">
            {/* Cart — buyers and guests (hide while session resolves to avoid flicker) */}
            {status !== "loading" && (!session || session.user.role === "BUYER") && (
              <Link
                href="/checkout"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                {cartCount > 0 && (
                  <span suppressHydrationWarning className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] bg-green-600 text-white rounded-full font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth — desktop only for logged-in user dropdown */}
            {status === "loading" ? (
              <div className="hidden sm:block h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all focus-visible:outline-none">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-green-700" />
                  </div>
                  <span className="hidden sm:block max-w-[90px] truncate">{session.user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border border-slate-100">
                  <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-50">
                    <div className="font-medium text-slate-600 truncate">{session.user.email}</div>
                    <div className="mt-0.5 capitalize text-green-600 font-semibold">{session.user.role.toLowerCase()}</div>
                  </div>
                  {session.user.role === "SELLER" && (
                    <DropdownMenuItem onClick={() => router.push("/seller/dashboard")} className="mx-1 my-0.5 rounded-lg">
                      My Dashboard
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => router.push("/admin/dashboard")} className="mx-1 my-0.5 rounded-lg">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "BUYER" && (
                    <DropdownMenuItem onClick={() => router.push("/orders")} className="mx-1 my-0.5 rounded-lg">
                      My Orders
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="mx-1 my-0.5 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Desktop auth buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-green-100"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-0.5 pb-4 animate-fade-in">
            <Link href="/#about" className="block px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setMobileOpen(false)}>About</Link>
            <Link href="/products" className="block px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setMobileOpen(false)}>Products</Link>
            {session && (
              <Link href="/buyer-requests" className="block px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setMobileOpen(false)}>Buy Requests</Link>
            )}
            {session?.user.role === "ADMIN" && (
              <Link href="/admin/inventory" className={`block px-3 py-2.5 text-sm rounded-lg ${isInventoryActive ? "text-green-600 font-semibold bg-green-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`} onClick={() => setMobileOpen(false)}>Inventory</Link>
            )}
            <Link href="/#contact" className="block px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setMobileOpen(false)}>Contact</Link>

            {/* Auth links in mobile menu for guests */}
            {!session && (
              <>
                <div className="border-t border-slate-100 my-2" />
                <Link href="/login" className="block px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="block px-3 py-2.5 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-center" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
