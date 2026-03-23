"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, MessageSquare } from "lucide-react";

const links = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/listings", label: "Listings", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingBag },
  { href: "/buyer-requests", label: "Buy Requests", icon: MessageSquare },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 py-6 hidden md:block shrink-0">
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller Panel</p>
        </div>
        <nav className="space-y-1 px-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden">
        <div className="grid grid-cols-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive(href) ? "text-green-600" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(href) ? "stroke-[2.5]" : ""}`} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
