"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart, Menu, X, LayoutDashboard, LogOut,
  User, Leaf, Search,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const { items } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isAdmin = session?.user.role === "ADMIN";
  const isSeller = session?.user.role === "SELLER";
  const isBuyer = !session || session.user.role === "BUYER";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    setMobileOpen(false);
  }

  // Clear search field when navigating away from products
  useEffect(() => {
    if (!pathname.startsWith("/products")) setSearchQuery("");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-gray-900 tracking-tight hidden sm:block">
              Gross<span className="text-green-600">Tech</span>
            </span>
          </Link>

          {/* Search bar — center, takes up available space */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for rice, sugar, oil, dal…"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto sm:ml-0">

            {/* Mobile search trigger */}
            <button
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => { setMobileOpen(false); searchRef.current?.focus(); }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            {status !== "loading" && isBuyer && (
              <Link
                href="/checkout"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span
                    suppressHydrationWarning
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] bg-green-600 text-white rounded-full font-bold leading-none"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium ml-1">
              <NavLink href="/products" label="Products" pathname={pathname} />
              {session && <NavLink href="/buyer-requests" label="Requests" pathname={pathname} />}
              {isAdmin && <NavLink href="/admin/dashboard" label="Admin" pathname={pathname} accent />}
              {isSeller && <NavLink href="/seller/dashboard" label="Dashboard" pathname={pathname} accent />}
            </nav>

            {/* Auth */}
            {status === "loading" ? (
              <div className="hidden sm:block h-8 w-20 rounded-lg bg-gray-100 animate-pulse ml-1" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all focus-visible:outline-none ml-1">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-green-700" />
                  </div>
                  <span className="hidden sm:block max-w-[80px] truncate text-xs">{session.user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border border-gray-100 p-1">
                  <div className="px-3 py-2 mb-1">
                    <div className="text-xs font-semibold text-gray-800 truncate">{session.user.name}</div>
                    <div className="text-xs text-gray-400 truncate">{session.user.email}</div>
                    <div className="text-xs text-green-600 font-semibold mt-0.5 capitalize">{session.user.role.toLowerCase()}</div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  {isSeller && (
                    <DropdownMenuItem onClick={() => router.push("/seller/dashboard")} className="rounded-lg text-sm cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-gray-400" /> My Dashboard
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/admin/dashboard")} className="rounded-lg text-sm cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-gray-400" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "BUYER" && (
                    <DropdownMenuItem onClick={() => router.push("/orders")} className="rounded-lg text-sm cursor-pointer">
                      My Orders
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-lg text-sm text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile search — full width below header row */}
        <div className="sm:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for rice, sugar, oil…"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
          </form>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-0.5 pb-4 animate-fade-in">
            <MobileNavLink href="/products" label="Products" onClick={() => setMobileOpen(false)} />
            {session && <MobileNavLink href="/buyer-requests" label="Buy Requests" onClick={() => setMobileOpen(false)} />}
            {isAdmin && <MobileNavLink href="/admin/dashboard" label="Admin Panel" onClick={() => setMobileOpen(false)} />}
            {isSeller && <MobileNavLink href="/seller/dashboard" label="My Dashboard" onClick={() => setMobileOpen(false)} />}
            {session?.user.role === "BUYER" && <MobileNavLink href="/orders" label="My Orders" onClick={() => setMobileOpen(false)} />}
            {!session && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <MobileNavLink href="/login" label="Login" onClick={() => setMobileOpen(false)} />
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-center mt-1"
                >
                  Sign Up Free
                </Link>
              </>
            )}
            {session && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-lg text-red-600 hover:bg-red-50 font-medium"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, label, pathname, accent = false }: { href: string; label: string; pathname: string; accent?: boolean }) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? accent
            ? "bg-green-50 text-green-700 font-semibold"
            : "text-gray-900 font-semibold bg-gray-100"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
    >
      {label}
    </Link>
  );
}
